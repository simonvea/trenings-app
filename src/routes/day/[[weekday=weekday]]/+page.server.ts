import type { PageServerLoad } from './$types';
import { loadDayPlan, upcomingSessions } from '$lib/dayPlan/db.server';

export const load: PageServerLoad = () => ({
	title: 'Dagsplan',
	plan: loadDayPlan(),
	sessions: upcomingSessions()
});
