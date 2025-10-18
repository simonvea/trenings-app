import type { PageServerLoad } from './$types';
import type { TrainingBlockDb } from '$lib/types';

export const load: PageServerLoad = async ({ platform }) => {
	const result = await platform?.env.trening.prepare('SELECT name, id FROM training_blocks').run();
	const blocks = (result?.results as Pick<TrainingBlockDb, 'id' | 'name'>[]) || [];
	return {
		blocks
	};
};
