import type { ParamMatcher } from '@sveltejs/kit';
import { isWeekday } from '$lib/dayPlan/time';

export const match = isWeekday satisfies ParamMatcher;
