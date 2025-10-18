import type { TrainingCycleDb, WorkoutSessionsDb } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type WeekTemplateDb = {
	id: number;
	week_number: number;
	name: string;
	warmup_set_1_percentage?: number;
	warmup_set_1_reps?: number;
	warmup_set_2_percentage?: number;
	warmup_set_2_reps?: number;
	warmup_set_3_percentage?: number;
	warmup_set_3_reps?: number;
	set_1_percentage: number;
	set_1_reps: number;
	set_2_percentage: number;
	set_2_reps: number;
	set_3_percentage: number;
	set_3_reps: number; // negative means AMRAP (as many reps as possible)
	set_4_percentage?: number; // Set only applicable for "7th week"
	set_4_reps?: number;
};

export const load: PageServerLoad = async ({ platform, params }) => {
	const cycleId = params.id;

	const cycleResult = await platform?.env.trening
		.prepare('SELECT * FROM cycles where id = ?')
		.bind(cycleId)
		.run();

	const cycle = cycleResult?.results[0] as TrainingCycleDb;

	if (!cycle) error(404, 'Not found.');

	const sessionsResult = await platform?.env.trening
		.prepare(`SELECT * from workout_sessions where cycle_id = ?`)
		.bind(cycleId)
		.run();

	const sessions = (sessionsResult?.results as WorkoutSessionsDb[]) || [];
	const weekTemplates = [] as WeekTemplateDb[];

	if (cycle.cycle_type !== '7th week') {
		const weekNumbersInSessions = new Set(sessions.map((s) => s.week_number_in_cycle));

		const templatesResult = await platform?.env.trening
			.prepare('SELECT * FROM week_templates where week_number IN (?)')
			.bind(weekNumbersInSessions)
			.run();

		weekTemplates.push(...((templatesResult?.results as WeekTemplateDb[]) || []));
	}

	let supplementalTemplateResult, seventhWeekTemplateResult;

	const supplementalTemplateId = cycle.supplemental_template_id;
	const seventWeekTemplateId = cycle.seventh_week_template_id;

	if (supplementalTemplateId) {
		supplementalTemplateResult = await platform?.env.trening
			.prepare('SELECT * FROM supplemental_templates where id = ?')
			.bind(supplementalTemplateId)
			.run();
	}
	if (seventWeekTemplateId) {
		seventhWeekTemplateResult = await platform?.env.trening
			.prepare('SELECT * FROM week_templates where id = ?')
			.bind(seventWeekTemplateId)
			.run();

		weekTemplates.push(seventhWeekTemplateResult?.results[0] as WeekTemplateDb);
	}

	const supplementalTemplate = supplementalTemplateResult?.results[0];

	return { cycle, sessions, weekTemplates, supplementalTemplate };
};
