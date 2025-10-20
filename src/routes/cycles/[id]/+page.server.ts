import type {
	LiftsDb,
	SupplementalTemplateDb,
	TrainingBlockDb,
	TrainingCycleDb,
	WeekTemplateDb,
	WorkoutSessionsDb
} from '$lib/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type Cycle = TrainingCycleDb &
	SupplementalTemplateDb &
	TrainingBlockDb & { block_name: string; template_name: string };

export const load: PageServerLoad = async ({ platform, params }) => {
	const cycleId = params.id;

	const cycleStatment = platform?.env.trening
		.prepare(
			`SELECT *, tb.name AS block_name, st.name AS template_name FROM cycles AS c
     INNER JOIN training_blocks as tb ON tb.id = c.block_id
     LEFT JOIN supplemental_templates AS st on st.id = c.supplemental_template_id
where c.id = ?`
		)
		.bind(cycleId);

	const weekTemplatesStatement = platform?.env.trening.prepare('SELECT * FROM week_templates');

	// Consider joining with cycleStatement, just change the fROM to workout_sessions
	const sessionsStatement = platform?.env.trening
		.prepare('SELECT * FROM workout_sessions WHERE cycle_id = ?')
		.bind(cycleId);

	const liftsStatement = platform?.env.trening.prepare('SELECT * FROM lifts');

	const results = await platform?.env.trening.batch([
		cycleStatment!,
		weekTemplatesStatement!,
		sessionsStatement!,
		liftsStatement!
	]);

	const cycle = results?.[0].results[0] as Cycle;

	if (!cycle) error(404, 'Not found.');

	const weekTemplates = results?.[1].results as WeekTemplateDb[];
	const sessions = results?.[2].results as WorkoutSessionsDb[];
	const lifts = results?.[3].results as LiftsDb[];

	return { cycle, weekTemplates, sessions, lifts };
};
