import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '$lib/server/db';
import { parseDecimal } from '$lib/format';
import { latestTrainingMaxTests } from '$lib/server/trainingMaxTests';
import { trainingMaxIncrement } from '$lib/trainingMax';
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

	// The manual way to apply the cycle raise, e.g. when the session card was missed or the
	// training max was held back for missed reps
	increaseTm: async ({ request }) => {
		const data = await request.formData();
		const liftId = Number(data.get('lift_id'));

		const lift = sql.get`SELECT name, current_training_max FROM lifts WHERE id = ${liftId}` as
			| Pick<LiftsDb, 'name' | 'current_training_max'>
			| undefined;
		if (!lift) return fail(400, { tmError: 'Fant ikke løftet' });
		// Raising from nothing would invent a training max rather than raise one
		if (!(lift.current_training_max > 0))
			return fail(400, { tmError: 'Sett en training max først' });

		const raised = lift.current_training_max + trainingMaxIncrement(lift.name);
		if (raised > MAX_TRAINING_MAX)
			return fail(400, { tmError: `Training max kan ikke over ${MAX_TRAINING_MAX} kg` });

		updateTrainingMaxes([{ liftId, trainingMax: raised }]);
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
