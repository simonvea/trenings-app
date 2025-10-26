import type {
	LiftsDb,
	SupplementalTemplateDb,
	TrainingBlockDb,
	TrainingCycleDb,
	WeekTemplateDb
} from '$lib/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sql } from '$lib/server/db';

type Cycle = TrainingCycleDb &
	SupplementalTemplateDb &
	TrainingBlockDb & { block_name: string; template_name: string };

export type Session = WeekTemplateDb & {
	lift_name: string;
	id: string;
	lift_id: number;
	week_number_in_cycle: number;
	current_training_max: number;
};

export const load: PageServerLoad = async ({ params }) => {
	const cycleId = params.id;

	const cycle = sql.get`SELECT *, tb.name AS block_name, st.name AS template_name FROM cycles AS c
     INNER JOIN training_blocks as tb ON tb.id = c.block_id
     LEFT JOIN supplemental_templates AS st on st.id = c.supplemental_template_id
where c.id = ${cycleId}` as Cycle;

	if (!cycle) error(404, 'Not found.');

	const sessions =
		sql.all`SELECT s.id, s.lift_id, s.week_number_in_cycle, l.name AS lift_name, l.current_training_max, w.*  FROM workout_sessions as s
            LEFT JOIN lifts as l ON l.id = s.lift_id
            LEFT JOIN week_templates as w ON w.id = s.week_template_id
            WHERE cycle_id = ${cycleId}
            ORDER BY s.planned_date
` as Session[];
	const lifts = sql.all`SELECT * FROM lifts` as LiftsDb[];

	return { cycle, sessions, lifts };
};
