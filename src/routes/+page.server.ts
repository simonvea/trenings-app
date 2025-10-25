import type { PageServerLoad } from './$types';
import type { TrainingBlockDb } from '$lib/types';
import { sql } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const blocks =
		(sql.all`SELECT name, id FROM training_blocks` as Pick<TrainingBlockDb, 'id' | 'name'>[]) || [];
	return {
		blocks
	};
};
