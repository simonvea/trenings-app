import type { PageServerLoad } from './$types';

type Plan = {
	id: number;
	name?: string;
	training_day_1: string;
	training_day_2: string;
	training_day_3: string;
	training_day_4?: string;
	lift_day_1_id: number;
	lift_day_2_id: number;
	lift_day_3_id: number;
	lift_day_4_id?: number;
	goals?: string;
	notes?: string;
	created_at?: Date;
	completed_date: Date;
};

export const load: PageServerLoad = async ({ platform }) => {
	const result = await platform?.env.trening.prepare('SELECT * FROM training_blocks').run();
	const plans = (result?.results as Plan[]) || [];
	return {
		plans
	};
};
