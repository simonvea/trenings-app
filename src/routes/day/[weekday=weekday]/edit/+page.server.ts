import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadDayPlan, replaceDayPlan } from '$lib/dayPlan/db.server';
import { parseDayPlanForm } from '$lib/dayPlan/form';
import { translateDay } from '$lib/helpers';

export const load: PageServerLoad = ({ params }) => {
	const { weekday } = params;
	return {
		title: `Rediger ${translateDay(weekday).toLowerCase()}`,
		weekday,
		entries: loadDayPlan()[weekday]
	};
};

export const actions = {
	default: async ({ params, request }) => {
		const { weekday } = params;
		const result = parseDayPlanForm(await request.formData());
		if (!result.ok) return fail(400, { errors: result.errors, rows: result.rows });

		replaceDayPlan(weekday, result.value);
		redirect(303, `/day/${weekday}`);
	}
} satisfies Actions;
