import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBlockForm } from '$lib/planning/blockForm';
import { planBlock } from '$lib/planning/schedule';
import {
	createBlock,
	listBlocks,
	loadPlanningOptions,
	mainWeekTemplateIds
} from '$lib/planning/db.server';
import { latestTrainingMaxTests } from '$lib/server/trainingMaxTests';

export const load: PageServerLoad = () => ({
	title: 'Ny blokk',
	...loadPlanningOptions(),
	weekTemplateIds: mainWeekTemplateIds(),
	latestTests: [...latestTrainingMaxTests().values()],
	// Training maxes are shared, so a new choice also changes the weights of a running block
	activeBlockName: listBlocks().find((b) => !b.completed_date)?.name
});

export const actions = {
	default: async ({ request }) => {
		const result = parseBlockForm(await request.formData());
		if (!result.ok) return fail(400, { errors: result.errors });

		const block = result.value;
		const cycles = planBlock({
			startDate: block.startDate,
			days: block.days,
			cycles: block.cycles,
			weekTemplateIds: mainWeekTemplateIds()
		});
		const blockId = createBlock(block, cycles);

		redirect(303, `/blocks/${blockId}`);
	}
} satisfies Actions;
