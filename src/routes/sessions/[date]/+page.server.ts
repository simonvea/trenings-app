import { normalizeWeight } from '$lib/core';
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
import type { Actions } from '@sveltejs/kit';
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
		const setNumber = 3;

		// Main work
		const plannedWeight = Number(data.get('set_3_weight'));
		const plannedReps = Number(data.get('set_3_reps'));
		const actualReps = Number(data.get('set_3_actual_reps'));
		const isAmrap = data.get('set_3_amrap') == 'true';
		const hasDoneSupplemental = data.get('supplemental_sets_done') == 'true';

		// Assistance work, one slot per planned exercise
		const assistance = data.getAll('assistance_slot').map((slot) => ({
			exerciseId: Number(data.get(`${slot}`)),
			weight: Number(data.get(`${slot}-weight`)),
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
			hasDoneSupplemental
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
	let { date } = params;
	if (!date) date = 'now';

	const session =
		sql.get`SELECT *, s.id AS session_id, lifts.name AS liftName, week.name AS weekName, template.name AS templateName FROM workout_sessions as s
INNER JOIN lifts on lifts.id = s.lift_id
INNER JOIN cycles on cycles.id = s.cycle_id
LEFT JOIN supplemental_templates template on template.id = cycles.supplemental_template_id
INNER JOIN week_templates as week on week.id = s.week_template_id
 where planned_date = ${date}
` as SessionDb;

	if (!session) return {};

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
		weight: normalizeWeight(calculateSupplementalWeight(session))
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
			}
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

	const title = `Uke ${session.week_number_in_cycle}`;

	return { session, mainLift, title, exercises, plannedAssistance, history };
};

function calculateSupplementalWeight({
	weight_calculation,
	current_training_max,
	set_1_percentage,
	fixed_percentage
}: SessionDb) {
	if (weight_calculation == 'first_set') return current_training_max * set_1_percentage;
	if (weight_calculation == 'fixed_percentage') return current_training_max * fixed_percentage!;
	// the 'custom' option. Not defined how to use yet..
	return current_training_max;
}
