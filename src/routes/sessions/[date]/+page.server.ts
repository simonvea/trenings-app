import { normalizeWeight } from '$lib/core';
import { isIsoDate } from '$lib/date';
import { parseDecimal } from '$lib/format';
import { supplementalWeight } from '$lib/supplemental';
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
import { error, type Actions } from '@sveltejs/kit';
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
	default: async ({ request }) => {
		const data = await request.formData();

		const sessionId = Number(data.get('session_id'));
		// The last main set is the one recorded: set 3, or set 4 in a 7th week
		const setNumber = Number(data.get('top_set_number'));

		// Main work
		const plannedWeight = Number(data.get('top_set_weight'));
		const plannedReps = Number(data.get('top_set_reps'));
		const actualReps = Number(data.get('top_set_actual_reps'));
		const isAmrap = data.get('top_set_amrap') == 'true';
		const hasDoneSupplemental = data.get('supplemental_sets_done') == 'true';
		const notes = String(data.get('comment') ?? '').trim();

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
			actualReps: isAmrap ? actualReps : plannedReps,
			isAmrap,
			hasDoneSupplemental,
			notes
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
	}

	const supplemental: SupplementalWork = {
		sets: session.sets ?? 0,
		reps: session.reps ?? 0,
		name: session.templateName,
		weight: supplementalWeight(
			{ weightCalculation: session.weight_calculation, fixedPercentage: session.fixed_percentage },
			{
				trainingMax: session.current_training_max,
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
				weight: normalizeWeight(session.current_training_max * session.set_1_percentage),
				isAmrap: false
			},
			{
				reps: session.set_2_reps,
				weight: normalizeWeight(session.current_training_max * session.set_2_percentage),
				isAmrap: false
			},
			{
				reps: Math.abs(session.set_3_reps),
				weight: normalizeWeight(session.current_training_max * session.set_3_percentage),
				isAmrap: session.set_3_reps < 0
			},
			...(session.set_4_reps && session.set_4_percentage
				? [
						{
							reps: Math.abs(session.set_4_reps),
							weight: normalizeWeight(session.current_training_max * session.set_4_percentage),
							isAmrap: session.set_4_reps < 0
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
					weight: normalizeWeight(session.current_training_max * session.warmup_set_1_percentage!),
					isAmrap: false
				},
				{
					reps: session.warmup_set_2_reps!,
					weight: normalizeWeight(session.current_training_max * session.warmup_set_2_percentage!),
					isAmrap: false
				},
				{
					reps: session.warmup_set_3_reps!,
					weight: normalizeWeight(session.current_training_max * session.warmup_set_3_percentage!),
					isAmrap: false
				}
			]
		);
	}

	const title = 'Økt';

	return { session, mainLift, title, exercises, plannedAssistance, history, ...neighbours };
};
