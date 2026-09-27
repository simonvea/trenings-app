import type { Weekday } from '$lib/planning/types';

export const entryKinds = [
	'routine',
	'dog',
	'work',
	'commute',
	'training',
	'meal',
	'social'
] as const;
export type EntryKind = (typeof entryKinds)[number];

/** A planned block of the day. Times are 'HH:MM' on the same day, start before end. */
export type DayPlanEntry = {
	start: string;
	end: string;
	kind: EntryKind;
	label: string;
	note?: string;
};

export type DayPlan = Record<Weekday, DayPlanEntry[]>;
