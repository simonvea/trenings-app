import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '$lib/server/db';
import { parseDecimal } from '$lib/format';
import { latestTrainingMaxTests } from '$lib/server/trainingMaxTests';
import { MAX_TRAINING_MAX, trainingMaxIncrement } from '$lib/trainingMax';
import type { LiftsDb } from '$lib/types';
import { completeBlock, listBlocks, updateTrainingMaxes } from '$lib/planning/db.server';

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
		// The training max the button was showing, so a double tap or a resent form cannot raise twice
		const from = Number(data.get(`from_${liftId}`));

		const lift = sql.get`SELECT name, current_training_max FROM lifts WHERE id = ${liftId}` as
			| Pick<LiftsDb, 'name' | 'current_training_max'>
			| undefined;
		if (!lift) return fail(400, { raiseError: 'Fant ikke løftet' });
		if (lift.current_training_max !== from)
			return fail(409, { raiseError: 'Training max er allerede endret' });
		// Raising from nothing would invent a training max rather than raise one
		if (!(lift.current_training_max > 0))
			return fail(400, { raiseError: 'Sett en training max først' });

		const raised = lift.current_training_max + trainingMaxIncrement(lift.name);
		if (raised > MAX_TRAINING_MAX)
			return fail(400, { raiseError: `Training max kan ikke være over ${MAX_TRAINING_MAX} kg` });

		updateTrainingMaxes([{ liftId, trainingMax: raised }]);
		return { raised: { liftId, to: raised } };
	},

	completeBlock: async ({ request }) => {
		const data = await request.formData();
		const blockId = Number(data.get('block_id'));
		if (!blockId) return fail(400, { blockError: 'Mangler blokk-id' });

		completeBlock(blockId);
		return { blockCompleted: true };
	}
} satisfies Actions;
