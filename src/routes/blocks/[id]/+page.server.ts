import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { LiftsDb, TrainingBlockDb, TrainingCycleDb } from '$lib/types';
import { sql } from '$lib/server/db';

export type BlockCycle = TrainingCycleDb & { sessions_total: number; sessions_completed: number };

export const load: PageServerLoad = async ({ params }) => {
	const blockId = params.id;

	const block = sql.get`SELECT * FROM training_blocks WHERE id = ${blockId}` as
		| TrainingBlockDb
		| undefined;

	if (!block) error(404, 'Fant ikke blokka');

	const cycles = sql.all`SELECT c.*, supplemental.name AS supplemental_name,
		seventh_week.name AS seventh_week_name,
		COUNT(s.id) AS sessions_total,
		COUNT(CASE WHEN s.status = 'completed' THEN 1 END) AS sessions_completed
	FROM cycles AS c
	LEFT JOIN supplemental_templates AS supplemental ON supplemental.id = c.supplemental_template_id
	LEFT JOIN week_templates AS seventh_week ON seventh_week.id = c.seventh_week_template_id
	LEFT JOIN workout_sessions AS s ON s.cycle_id = c.id
	WHERE c.block_id = ${blockId}
	GROUP BY c.id
	ORDER BY c.cycle_number_in_block ASC` as BlockCycle[];

	const lifts = sql.all`SELECT * FROM lifts` as LiftsDb[];

	return { title: block.name, block, cycles, lifts };
};
