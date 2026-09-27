import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '$lib/server/db';
import type { LiftsDb } from '$lib/types';
import { completeBlock, listBlocks, updateTrainingMaxes } from '$lib/planning/db.server';

export const load: PageServerLoad = () => ({
	title: 'Admin',
	lifts: sql.all`SELECT * FROM lifts ORDER BY id` as LiftsDb[],
	blocks: listBlocks()
});

export const actions = {
	updateTm: async ({ request }) => {
		const data = await request.formData();
		const trainingMaxes = data.getAll('lift_id').map((id) => ({
			liftId: Number(id),
			trainingMax: Number(data.get(`tm_${id}`))
		}));

		if (trainingMaxes.some((tm) => !(tm.trainingMax >= 0)))
			return fail(400, { tmError: 'Training max må være 0 eller mer' });

		updateTrainingMaxes(trainingMaxes);
		return { tmSaved: true };
	},

	completeBlock: async ({ request }) => {
		const data = await request.formData();
		const blockId = Number(data.get('block_id'));
		if (!blockId) return fail(400, { blockError: 'Mangler blokk-id' });

		completeBlock(blockId);
		return { blockCompleted: true };
	}
} satisfies Actions;
