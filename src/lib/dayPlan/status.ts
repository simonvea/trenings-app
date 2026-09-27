import { toMinutes } from './time';
import type { DayPlanEntry } from './types';

export type DayStatus =
	| { state: 'empty' }
	| { state: 'before'; next: DayPlanEntry; minutesUntil: number }
	| {
			state: 'active';
			current: DayPlanEntry;
			next?: DayPlanEntry;
			remainingMinutes: number;
			/** Share of the current entry that has passed, 0 to 1 */
			progress: number;
	  }
	| { state: 'gap'; next: DayPlanEntry; minutesUntil: number }
	| { state: 'done' };

export type EntryPhase = 'past' | 'current' | 'upcoming';

const byStart = (a: DayPlanEntry, b: DayPlanEntry): number => a.start.localeCompare(b.start);

// An entry covers [start, end): at its end time the next entry takes over
export const entryPhase = (entry: DayPlanEntry, nowMinutes: number): EntryPhase => {
	if (nowMinutes < toMinutes(entry.start)) return 'upcoming';
	return nowMinutes < toMinutes(entry.end) ? 'current' : 'past';
};

/** Where the day stands at `nowMinutes`. Entries may come in any order but must not overlap. */
export const dayStatus = (entries: DayPlanEntry[], nowMinutes: number): DayStatus => {
	const sorted = entries.toSorted(byStart);
	if (sorted.length === 0) return { state: 'empty' };

	const currentIndex = sorted.findIndex((e) => entryPhase(e, nowMinutes) === 'current');
	if (currentIndex >= 0) {
		const current = sorted[currentIndex];
		const start = toMinutes(current.start);
		const end = toMinutes(current.end);
		const next = sorted[currentIndex + 1];
		return {
			state: 'active',
			current,
			...(next && { next }),
			remainingMinutes: end - nowMinutes,
			progress: (nowMinutes - start) / (end - start)
		};
	}

	const next = sorted.find((e) => entryPhase(e, nowMinutes) === 'upcoming');
	if (!next) return { state: 'done' };

	const minutesUntil = toMinutes(next.start) - nowMinutes;
	return next === sorted[0]
		? { state: 'before', next, minutesUntil }
		: { state: 'gap', next, minutesUntil };
};

export const dayFocus = (entries: DayPlanEntry[]): string[] =>
	entries
		.filter((e) => e.kind === 'training')
		.toSorted(byStart)
		.map((e) => e.label);
