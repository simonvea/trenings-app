import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '$lib/server/db';
import { parseDecimal } from '$lib/format';
import { latestTrainingMaxTests } from '$lib/server/trainingMaxTests';
import type { LiftsDb } from '$lib/types';
import { completeBlock, listBlocks, updateTrainingMaxes } from '$lib/planning/db.server';

// Catches a missing decimal comma (1025 for 102,5) before it changes every session's weights
const MAX_TRAINING_MAX = 500;

export const load: PageServerLoad = () => ({
	title: 'Planlegging',
	lifts: sql.all`SELECT * FROM lifts ORDER BY id` as LiftsDb[],
	blocks: listBlocks(),
	latestTests: [...latestTrainingMaxTests().values()]
});

export const actions = {
	updateTm: async ({ request }) => {
		const data = await request.formData();
		const trainingMaxes = data.getAll('lift_id').map((id) => ({
			liftId: Number(id),
			trainingMax: parseDecimal(String(data.get(`tm_${id}`) ?? ''))
		}));

		const valid = trainingMaxes.filter(
			(tm): tm is { liftId: number; trainingMax: number } =>
				tm.trainingMax !== null && tm.trainingMax >= 0 && tm.trainingMax <= MAX_TRAINING_MAX
		);
		if (valid.length !== trainingMaxes.length)
			return fail(400, {
				tmError: `Training max må være et tall fra 0 til ${MAX_TRAINING_MAX} kg`
			});

		updateTrainingMaxes(valid);
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
