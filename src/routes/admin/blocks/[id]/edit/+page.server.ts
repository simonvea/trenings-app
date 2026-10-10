import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '$lib/server/db';
import type { AssistanceExerciseDb, LiftsDb, TrainingBlockDb } from '$lib/types';
import { parseAssistanceForm } from '$lib/planning/assistanceForm';
import { loadBlockAssistance, replaceBlockAssistance } from '$lib/planning/db.server';

const loadBlock = (id: number): TrainingBlockDb => {
	const block = sql.get`SELECT * FROM training_blocks WHERE id = ${id}` as
		| TrainingBlockDb
		| undefined;
	if (!block) error(404, 'Fant ikke blokka');
	return block;
};

// In training day order
const blockLiftIds = (block: TrainingBlockDb): number[] =>
	[block.lift_day_1_id, block.lift_day_2_id, block.lift_day_3_id, block.lift_day_4_id].filter(
		(id): id is number => !!id
	);

export const load: PageServerLoad = ({ params }) => {
	const block = loadBlock(Number(params.id));

	return {
		title: `Rediger «${block.name}»`,
		block,
		liftIds: blockLiftIds(block),
		lifts: sql.all`SELECT * FROM lifts ORDER BY id` as LiftsDb[],
		exercises:
			sql.all`SELECT * FROM assistance_exercises ORDER BY category, name` as AssistanceExerciseDb[],
		assistance: loadBlockAssistance(block.id)
	};
};

export const actions = {
	assistance: async ({ params, request }) => {
		const block = loadBlock(Number(params.id));
		const result = parseAssistanceForm(await request.formData());
		if (!result.ok) return fail(400, { assistanceError: result.error });

		const liftIds = blockLiftIds(block);
		if (result.value.some((a) => !liftIds.includes(a.liftId)))
			return fail(400, { assistanceError: 'Assistanse for et løft som ikke er i blokka' });

		replaceBlockAssistance(block.id, result.value);
		return { assistanceSaved: true };
	}
} satisfies Actions;
