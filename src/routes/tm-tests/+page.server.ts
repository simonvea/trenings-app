import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isIsoDate, today } from '$lib/date';
import { translateLiftName } from '$lib/helpers';
import { lastBlockCreatedAt } from '$lib/planning/db.server';
import { sql } from '$lib/server/db';
import {
	addTrainingMaxTest,
	deleteTrainingMaxTest,
	latestTrainingMaxTests,
	listTrainingMaxTests
} from '$lib/server/trainingMaxTests';
import { defaultTrainingMaxSource, parseTestSet } from '$lib/trainingMax';
import type { LiftsDb } from '$lib/types';

export const load: PageServerLoad = () => {
	const latest = latestTrainingMaxTests();
	const blockCreatedAt = lastBlockCreatedAt();
	const lifts = (
		sql.all`SELECT id, name, current_training_max, updated_at FROM lifts ORDER BY id` as Pick<
			LiftsDb,
			'id' | 'name' | 'current_training_max' | 'updated_at'
		>[]
	).map((lift) => {
		const test = latest.get(lift.id);
		return {
			id: lift.id,
			name: translateLiftName(lift.name),
			trainingMax: lift.current_training_max,
			// Tested since the training max was last set, i.e. the test would be picked for a new block
			tested:
				defaultTrainingMaxSource(
					{ trainingMax: lift.current_training_max, changedAt: lift.updated_at },
					test && { createdAt: test.created_at },
					blockCreatedAt
				) === 'test'
		};
	});
	const liftName = new Map(lifts.map((lift) => [lift.id, lift.name]));

	return {
		title: 'TM-test',
		lifts,
		tests: listTrainingMaxTests().map((test) => ({
			...test,
			liftName: liftName.get(test.lift_id)
		}))
	};
};

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const liftId = Number(data.get('lift_id'));
		const set = parseTestSet({
			weight: String(data.get('weight') ?? ''),
			reps: String(data.get('reps') ?? '')
		});
		// The phone sends its own calendar day; the server clock may be UTC
		const sentDate = String(data.get('test_date') ?? '');
		const testDate = isIsoDate(sentDate) ? sentDate : today();

		if (!sql.get`SELECT id FROM lifts WHERE id = ${liftId}`)
			return fail(400, { error: 'Velg et løft' });
		if (!set.ok) return fail(400, { error: set.error });

		addTrainingMaxTest(liftId, testDate, set.value);
		return { saved: true };
	},

	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('test_id'));
		if (!id) return fail(400, { error: 'Mangler test-id' });

		deleteTrainingMaxTest(id);
		return { deleted: true };
	}
} satisfies Actions;
