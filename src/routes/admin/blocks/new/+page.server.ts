import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseBlockForm, type BlockFormField } from '$lib/planning/blockForm';
import { overlappingBlock, planBlock } from '$lib/planning/schedule';
import { formatShortDate } from '$lib/date';
import {
	createBlock,
	listBlocks,
	loadPlanningOptions,
	mainWeekTemplateIds
} from '$lib/planning/db.server';
import { latestTrainingMaxTests } from '$lib/server/trainingMaxTests';

type BlockFormErrors = Partial<Record<BlockFormField, string>>;

const runningBlocks = () =>
	listBlocks()
		.filter((b) => !b.completed_date && b.end_date)
		.map((b) => ({ name: b.name, startDate: b.start_date, endDate: b.end_date! }));

export const load: PageServerLoad = () => ({
	title: 'Ny blokk',
	...loadPlanningOptions(),
	weekTemplateIds: mainWeekTemplateIds(),
	latestTests: [...latestTrainingMaxTests().values()],
	// Training maxes are shared, so a new choice also changes the weights of a running block
	activeBlock: runningBlocks()[0]
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
		const endDate = cycles.at(-1)!.endDate;
		const overlap = overlappingBlock({ startDate: block.startDate, endDate }, runningBlocks());
		if (overlap) {
			const errors: BlockFormErrors = {
				start_date: `Overlapper med «${overlap.name}» (${formatShortDate(overlap.startDate)} – ${formatShortDate(overlap.endDate)})`
			};
			return fail(400, { errors });
		}

		const blockId = createBlock(block, cycles);

		redirect(303, `/blocks/${blockId}`);
	}
} satisfies Actions;
