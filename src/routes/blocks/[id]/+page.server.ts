import { error } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';
import type { TrainingBlockDb } from '$lib/types';

export const load: PageServerLoad = async ({ platform, params }) => {
	const blockId = params.id;

	const result = await platform?.env.trening
		.prepare('SELECT * FROM training_blocks where id = ?')
		.bind(blockId)
		.run();
	const trainingBlock = result?.results[0];

	if (trainingBlock)
		return {
			block: trainingBlock as TrainingBlockDb
		};

	error(404, 'Not found');
};
