import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';
import type { LiftsDb, TrainingBlockDb, TrainingCycleDb } from '$lib/types';

export const load: PageServerLoad = async ({ platform, params }) => {
	const blockId = params.id;

	const blockResult = await platform?.env.trening
		.prepare(
			`
SELECT b.*  FROM training_blocks as b
INNER JOIN lifts as lift_one on lift_one.id = b.lift_day_1_id
INNER JOIN lifts as lift_two on lift_two.id = b.lift_day_2_id
INNER JOIN lifts as lift_three on lift_three.id = b.lift_day_3_id
INNER JOIN lifts as lift_four on lift_four.id = b.lift_day_4_id
where b.id = ?`
		)
		.bind(blockId)
		.run();

	const trainingBlock = blockResult?.results[0];

	if (!trainingBlock) return error(404, 'Not found.');

	const cyclesResult = await platform?.env.trening
		.prepare(
			`SELECT c.*, supplemental.name as supplemental_name, seventh_week.name as seventh_week_name from cycles as c 
INNER JOIN supplemental_templates as supplemental on supplemental.id = c.supplemental_template_id
INNER JOIN supplemental_templates as seventh_week on seventh_week.id = c.seventh_week_template_id
where block_id = ?`
		)
		.bind(blockId)
		.run();

	const cycles = (cyclesResult?.results as TrainingCycleDb[]) || [];

	const liftsResult = await platform?.env.trening.prepare('SELECT * from lifts').run();

	const lifts = (liftsResult?.results as LiftsDb[]) || [];

	return {
		block: trainingBlock as TrainingBlockDb,
		cycles,
		lifts
	};
};
