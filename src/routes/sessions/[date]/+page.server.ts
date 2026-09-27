import { normalizeWeight } from '$lib/core';
import { isIsoDate, today } from '$lib/date';
import { parseDecimal, parseWholeNumber } from '$lib/format';
import { lastBlockCreatedAt, updateTrainingMaxes } from '$lib/planning/db.server';
import { supplementalWeight } from '$lib/supplemental';
import {
	defaultTrainingMaxSource,
	trainingMaxCheck,
	type TrainingMaxCheck
} from '$lib/trainingMax';
import { latestTrainingMaxTests, type TrainingMaxTest } from '$lib/server/trainingMaxTests';
import type {
	AssistanceExerciseDb,
	AssistanceWorkDb,
	LiftsDb,
	MainLift,
	MainWorkDb,
	SupplementalTemplateDb,
	SupplementalWork,
	TrainingCycleDb,
	WeekTemplateDb,
	WorkoutSessionsDb
} from '$lib/types';
import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { translateLiftName } from '$lib/helpers';
import { sql } from '$lib/server/db';
import { addAssistanceWork, completeMainWorkout } from '$lib/server/transactions';

type SessionDb = WorkoutSessionsDb &
	TrainingCycleDb &
	WeekTemplateDb &
	LiftsDb &
	SupplementalTemplateDb & {
		weekName: string;
		templateName: string;
		liftName: string;
		session_id: number;
		session_notes: string | null;
		session_completed_date: string | null;
	};

export type PlannedAssistance = { exercise_id: number; sets: number; reps: number };

type SessionHistory = {
	mainWork: MainWorkDb[];
	assistanceWork: (AssistanceWorkDb & Pick<AssistanceExerciseDb, 'name' | 'category'>)[];
};

export const actions = {
	complete: async ({ request }) => {
		const data = await request.formData();

		const sessionId = Number(data.get('session_id'));
		const saved = sql.get`SELECT status FROM workout_sessions WHERE id = ${sessionId}` as
			| Pick<WorkoutSessionsDb, 'status'>
			| undefined;
		if (!saved) return fail(404, { error: 'Fant ikke økta' });
		// A retry after lost signal may reach a session that was already saved
		if (saved.status === 'completed') return { success: true };
		// The last main set is the one recorded: set 3, or set 4 in a 7th week
		const setNumber = Number(data.get('top_set_number'));

		// Main work
		const plannedWeight = Number(data.get('top_set_weight'));
		const plannedReps = Number(data.get('top_set_reps'));
		// Empty when the set was skipped, which is not the same as 0 reps
		const actualReps = parseWholeNumber(String(data.get('top_set_actual_reps') ?? ''));
		const isAmrap = data.get('top_set_amrap') == 'true';
		const recordsReps = data.get('top_set_records_reps') == 'true';
		const hasDoneSupplemental = data.get('supplemental_sets_done') == 'true';
		const notes = String(data.get('comment') ?? '').trim();
		// The one the weights on the phone were computed from, which may be older than the current
		const trainingMax = parseDecimal(String(data.get('training_max') ?? ''));
		// The phone's calendar day; the server clock may be UTC and date a late session a day early
		const sentDate = String(data.get('completed_date') ?? '');
		const completedDate = isIsoDate(sentDate) ? sentDate : today();

		// Assistance work, one slot per planned exercise
		const assistance = data.getAll('assistance_slot').map((slot) => ({
			exerciseId: Number(data.get(`${slot}`)),
			weight: parseDecimal(String(data.get(`${slot}-weight`) ?? '')),
			reps: data
				.getAll(`${slot}-set`)
				.map(Number)
				.filter((reps) => reps > 0)
		}));

		// Save!
		completeMainWorkout({
			sessionId,
			setNumber,
			plannedWeight,
			plannedReps,
			actualWeight: plannedWeight,
			actualReps: recordsReps || isAmrap ? actualReps : plannedReps,
			isAmrap,
			hasDoneSupplemental,
			notes,
			trainingMax,
			completedDate
		});

		for (const { exerciseId, weight, reps } of assistance) {
			if (!exerciseId || reps.length === 0) continue;
			addAssistanceWork({
				sessionId,
				exerciseId,
				sets: reps.length,
				reps: reps.reduce((tot, curr) => tot + curr, 0),
				weight
			});
		}

		return { success: true };
	},

	// Lowering after a heavy top set, and undoing that
	changeTrainingMax: async ({ request }) => {
		const data = await request.formData();
		const liftId = Number(data.get('lift_id'));
		const from = Number(data.get('from'));
		const to = Number(data.get('to'));
		if (!(to > 0 && to <= 500)) return fail(400, { tmError: 'Ugyldig training max' });

		const lift = sql.get`SELECT current_training_max FROM lifts WHERE id = ${liftId}` as
			| Pick<LiftsDb, 'current_training_max'>
			| undefined;
		if (!lift) return fail(400, { tmError: 'Fant ikke løftet' });
		// A double tap or a resent form must not change it twice
		if (lift.current_training_max !== from)
			return fail(409, { tmError: 'Training max er allerede endret' });

		updateTrainingMaxes([{ liftId, trainingMax: to }]);
		return { tmChanged: true };
	}
} satisfies Actions;

export const load: PageServerLoad = async ({ params }) => {
	const { date } = params;
	if (!isIsoDate(date)) error(404, 'Ugyldig dato');

	const session =
		sql.get`SELECT *, s.id AS session_id, s.notes AS session_notes, s.completed_date AS session_completed_date, lifts.name AS liftName, week.name AS weekName, template.name AS templateName FROM workout_sessions as s
INNER JOIN lifts on lifts.id = s.lift_id
INNER JOIN cycles on cycles.id = s.cycle_id
LEFT JOIN supplemental_templates template on template.id = cycles.supplemental_template_id
INNER JOIN week_templates as week on week.id = s.week_template_id
 where planned_date = ${date}
` as SessionDb;

	// The arrows jump between training days rather than calendar days
	const { previous_date } = sql.get`SELECT MAX(planned_date) AS previous_date FROM workout_sessions
WHERE planned_date < ${date}` as { previous_date: string | null };
	const { next_date } = sql.get`SELECT MIN(planned_date) AS next_date FROM workout_sessions
WHERE planned_date > ${date}` as { next_date: string | null };
	const neighbours = { previousDate: previous_date, nextDate: next_date };

	if (!session) return { title: 'Økt', ...neighbours };

	const exercises =
		sql.all`SELECT * FROM assistance_exercises ORDER BY category, name` as AssistanceExerciseDb[];
	const plannedAssistance = sql.all`SELECT exercise_id, sets, reps FROM block_assistance
WHERE block_id = ${session.block_id} AND lift_id = ${session.lift_id}
ORDER BY position` as PlannedAssistance[];

	let history: SessionHistory | undefined;
	let tmCheck: TrainingMaxCheck = { kind: 'none' };
	// Lowering the training max makes an earlier TM test stop being the suggestion for the next
	// block, so the card says so before it is tapped
	let openTest: Pick<TrainingMaxTest, 'test_date' | 'training_max'> | undefined;

	if (session.status == 'completed') {
		history = {
			mainWork: sql.all`SELECT * FROM main_work
WHERE session_id = ${session.session_id}
ORDER BY set_number` as unknown as MainWorkDb[],
			assistanceWork:
				sql.all`SELECT assistance_work.*, assistance_exercises.name, assistance_exercises.category FROM assistance_work
INNER JOIN assistance_exercises ON assistance_exercises.id = assistance_work.exercise_id
WHERE assistance_work.session_id = ${session.session_id}` as unknown as (AssistanceWorkDb &
					Pick<AssistanceExerciseDb, 'name' | 'category'>)[]
		};

		const topSet = history.mainWork.at(-1);
		if (topSet)
			tmCheck = trainingMaxCheck({
				trainingMax: session.current_training_max,
				sessionTrainingMax: topSet.training_max ?? undefined,
				topSet: {
					percentage:
						topSet.set_number === 4 && session.set_4_percentage
							? session.set_4_percentage
							: session.set_3_percentage,
					plannedWeight: topSet.planned_weight,
					plannedReps: topSet.planned_reps,
					actualReps: topSet.actual_reps ?? topSet.planned_reps,
					isAmrap: Boolean(topSet.is_amrap)
				}
			});
		if (tmCheck.kind === 'missedReps' || tmCheck.kind === 'askIfHeavy') {
			const test = latestTrainingMaxTests().get(session.lift_id);
			const suggested =
				test &&
				defaultTrainingMaxSource(
					{ trainingMax: session.current_training_max, changedAt: session.updated_at },
					{ createdAt: test.created_at },
					lastBlockCreatedAt()
				) === 'test';
			if (suggested) openTest = { test_date: test.test_date, training_max: test.training_max };
		}
	}

	// A completed session keeps the weights it was done with, even after the training max changes
	const trainingMax = history?.mainWork.at(-1)?.training_max ?? session.current_training_max;

	const supplemental: SupplementalWork = {
		sets: session.sets ?? 0,
		reps: session.reps ?? 0,
		name: session.templateName,
		weight: supplementalWeight(
			{ weightCalculation: session.weight_calculation, fixedPercentage: session.fixed_percentage },
			{
				trainingMax,
				set1Percentage: session.set_1_percentage,
				set2Percentage: session.set_2_percentage
			}
		)
	};

	const mainLift: MainLift = {
		name: translateLiftName(session.liftName),
		warmupSets: [],
		sets: [
			{
				reps: session.set_1_reps,
				weight: normalizeWeight(trainingMax * session.set_1_percentage),
				isAmrap: false
			},
			{
				reps: session.set_2_reps,
				weight: normalizeWeight(trainingMax * session.set_2_percentage),
				isAmrap: false
			},
			{
				reps: Math.abs(session.set_3_reps),
				weight: normalizeWeight(trainingMax * session.set_3_percentage),
				isAmrap: session.set_3_reps < 0,
				recordsReps: session.set_3_reps < 0
			},
			...(session.set_4_reps && session.set_4_percentage
				? [
						{
							reps: Math.abs(session.set_4_reps),
							weight: normalizeWeight(trainingMax * session.set_4_percentage),
							isAmrap: session.set_4_reps < 0,
							// A missed rep at the full training max means it is too heavy
							recordsReps: session.set_4_reps < 0 || session.set_4_percentage >= 1
						}
					]
				: [])
		],
		supplemental
	};

	if (session.warmup_set_1_reps) {
		mainLift.warmupSets.push(
			...[
				{
					reps: session.warmup_set_1_reps,
					weight: normalizeWeight(trainingMax * session.warmup_set_1_percentage!),
					isAmrap: false
				},
				{
					reps: session.warmup_set_2_reps!,
					weight: normalizeWeight(trainingMax * session.warmup_set_2_percentage!),
					isAmrap: false
				},
				{
					reps: session.warmup_set_3_reps!,
					weight: normalizeWeight(trainingMax * session.warmup_set_3_percentage!),
					isAmrap: false
				}
			]
		);
	}

	const title = 'Økt';

	return {
		session,
		mainLift,
		title,
		exercises,
		plannedAssistance,
		history,
		tmCheck,
		openTest,
		trainingMax,
		...neighbours
	};
};
