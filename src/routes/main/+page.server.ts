import type { PageServerLoad } from './$types';
import { getPlanForLift, getCurrentCycle, getPlanForDay, getWeekStructure } from '$lib/data';
import { getTrainingMax } from '$lib/trainingMax';
import type { Days, MainLifts } from '$lib/types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const params = url.searchParams;
	const day = params.get('day') as Days;
	const lift = params.get('lift') as MainLifts;
	const weekParam = params.get('week');
	const week = (weekParam != null ? Number.parseInt(weekParam) : 1) as 1 | 2 | 3;

	if (week < 0 || week > 3) error(400, 'Week must be between 1 and 3');

	const plan = getCurrentCycle();
	const trainingMax = getTrainingMax();
	const structure = plan.structure;
	const weekStructure = getWeekStructure();
	const mainLift =
		lift != undefined
			? getPlanForLift({ structure, week, lift, trainingMax })
			: getPlanForDay({ structure, week, day, trainingMax, weekStructure });
	return {
		mainLift
	};
};
