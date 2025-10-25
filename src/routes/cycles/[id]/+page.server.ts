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
import { sql } from '$lib/server/db';

type Cycle = TrainingCycleDb &
	SupplementalTemplateDb &
	TrainingBlockDb & { block_name: string; template_name: string };

export const load: PageServerLoad = async ({ params }) => {
	const cycleId = params.id;

	const cycle = sql.get`SELECT *, tb.name AS block_name, st.name AS template_name FROM cycles AS c
     INNER JOIN training_blocks as tb ON tb.id = c.block_id
     LEFT JOIN supplemental_templates AS st on st.id = c.supplemental_template_id
where c.id = ${cycleId}` as Cycle;

	if (!cycle) error(404, 'Not found.');

	const weekTemplates = sql.all`SELECT * FROM week_templates` as WeekTemplateDb[];
	// TODO: Consider joining with cycleStatement, just change the fROM to workout_sessions
	const sessions =
		sql.all`SELECT * FROM workout_sessions WHERE cycle_id = ${cycleId}` as WorkoutSessionsDb[];
	const lifts = sql.all`SELECT * FROM lifts` as LiftsDb[];

	return { cycle, weekTemplates, sessions, lifts };
};
