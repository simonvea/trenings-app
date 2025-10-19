import { normalizeWeight } from '$lib/core';
import type {
	LiftsDb,
	MainLift,
	MainLifts,
	SupplementalTemplateDb,
	SupplementalWork,
	TrainingCycleDb,
	WeekTemplateDb,
	WorkoutSessionsDb
} from '$lib/types';
import type { Actions } from '@sveltejs/kit';
import type { PageServerData } from './$types';

type SessionDb = WorkoutSessionsDb &
	TrainingCycleDb &
	WeekTemplateDb &
	LiftsDb &
	SupplementalTemplateDb & { weekName: string; templateName: string; liftName: string };

export const actions = {
	default: async ({ request, platform }) => {
		const data = await request.formData();

		const sessionId = Number(data.get('session_id'));
		const setNumber = 3;
		// const liftId = data.get('lift_id');

		const plannedWeight = Number(data.get('set_3_weight'));
		const plannedReps = Number(data.get('set_3_reps'));
		const actualReps = Number(data.get('set_3_actual_reps'));
		const isAmrap = data.get('set_3_amrap') == 'true';
		const supplementalSetsDone = data.get('supplemental_sets_done') == 'true';

		const result = await platform?.env.trening
			.prepare(
				`
     INSERT INTO main_work (session_id, set_number, planned_weight, planned_reps, actual_weight, actual_reps, is_amrap, supplemental_done)
     VALUES (?,?,?,?,?,?,?,?);

     UPDATE workout_sessions SET status = 'completed' WHERE id = ?;
`
			)
			.bind(
				sessionId,
				setNumber,
				plannedWeight,
				plannedReps,
				plannedWeight,
				isAmrap ? actualReps : plannedReps,
				isAmrap,
				supplementalSetsDone,
				sessionId
			)
			.run();

		return { success: result?.success };
	}
} satisfies Actions;

export const load: PageServerData = async ({ platform, params }) => {
	let { date } = params;
	if (!date) date = 'now';

	const sessionResult = await platform?.env.trening
		.prepare(
			`SELECT *, lifts.name AS liftName, week.name AS weekName, template.name AS templateName FROM workout_sessions as s
INNER JOIN lifts on lifts.id = s.lift_id
INNER JOIN cycles on cycles.id = s.cycle_id
LEFT JOIN supplemental_templates template on template.id = cycles.supplemental_template_id
INNER JOIN week_templates as week on week.id = s.week_template_id
 where planned_date = ?
`
		)
		.bind(date)
		.run();

	const session = sessionResult?.results?.[0] as SessionDb;

	if (!session) return {};

	// TODO: handle non-supplemental weeks
	const supplemental: SupplementalWork = {
		sets: session.sets,
		reps: session.reps,
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

	return { session, mainLift };
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

const liftTranslations: Record<string, MainLifts> = {
	Squat: 'Knebøy',
	Deadlift: 'Markløft',
	'Overhead Press': 'Skulderpress',
	'Bench Press': 'Benkpress'
};

function translateLiftName(lift: string): MainLifts {
	if (!(lift in liftTranslations)) throw new Error('Unknown lift name!');
	return liftTranslations[lift];
}
