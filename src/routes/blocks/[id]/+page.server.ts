import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { LiftsDb, TrainingBlockDb, TrainingCycleDb } from '$lib/types';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const blockId = params.id;

	const block = sql.get`
SELECT b.*  FROM training_blocks as b
INNER JOIN lifts as lift_one on lift_one.id = b.lift_day_1_id
INNER JOIN lifts as lift_two on lift_two.id = b.lift_day_2_id
INNER JOIN lifts as lift_three on lift_three.id = b.lift_day_3_id
INNER JOIN lifts as lift_four on lift_four.id = b.lift_day_4_id
where b.id = ${blockId}` as TrainingBlockDb;

	if (!block) return error(404, 'Not found.');

	const cycles =
		sql.all`SELECT c.*, supplemental.name as supplemental_name, seventh_week.name as seventh_week_name from cycles as c 
LEFT JOIN supplemental_templates as supplemental on supplemental.id = c.supplemental_template_id
LEFT JOIN week_templates as seventh_week on seventh_week.id = c.seventh_week_template_id
where block_id = ${blockId}
ORDER BY c.cycle_number_in_block ASC
` as TrainingCycleDb[];

	const lifts = sql.all`SELECT * from lifts` as LiftsDb[];

	return {
		block,
		cycles,
		lifts
	};
};
