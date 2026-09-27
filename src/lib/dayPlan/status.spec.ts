import { describe, expect, it } from 'vitest';
import { dayFocus, dayStatus, entryPhase, sessionEntry } from './status';
import type { DayPlanEntry } from './types';

const walk: DayPlanEntry = { start: '06:10', end: '06:25', kind: 'dog', label: 'Morgentur' };
const squat: DayPlanEntry = { start: '08:00', end: '09:00', kind: 'training', label: 'Knebøy' };
const work: DayPlanEntry = { start: '09:00', end: '11:30', kind: 'work', label: 'Jobb' };
const run: DayPlanEntry = { start: '17:05', end: '18:05', kind: 'training', label: 'Løpetur' };

const at = (time: string): number => {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
};

describe('dayStatus', () => {
	describe('given a day without entries', () => {
		it('when checked at any time, then the day is empty', () => {
			// Arrange, Act
			const status = dayStatus([], at('10:00'));

			// Assert
			expect(status).toEqual({ state: 'empty' });
		});
	});

	describe('given a planned day', () => {
		const entries = [walk, squat, work, run];

		it('when checked before the first entry, then it is waiting for that entry', () => {
			// Arrange, Act
			const status = dayStatus(entries, at('05:40'));

			// Assert
			expect(status).toEqual({ state: 'before', next: walk, minutesUntil: 30 });
		});

		it('when checked inside an entry, then that entry is current with the time left and the next entry', () => {
			// Arrange, Act
			const status = dayStatus(entries, at('08:15'));

			// Assert
			expect(status).toEqual({
				state: 'active',
				current: squat,
				next: work,
				remainingMinutes: 45,
				progress: 0.25
			});
		});

		it('when checked at the exact end of one entry and start of the next, then the next is current', () => {
			// Arrange, Act
			const status = dayStatus(entries, at('09:00'));

			// Assert
			expect(status).toMatchObject({ state: 'active', current: work, progress: 0 });
		});

		it('when checked between two entries, then it is a gap until the next one', () => {
			// Arrange, Act
			const status = dayStatus(entries, at('07:00'));

			// Assert
			expect(status).toEqual({ state: 'gap', next: squat, minutesUntil: 60 });
		});

		it('when checked inside the last entry, then there is no next entry', () => {
			// Arrange, Act
			const status = dayStatus(entries, at('17:35'));

			// Assert
			expect(status).toEqual({
				state: 'active',
				current: run,
				remainingMinutes: 30,
				progress: 0.5
			});
		});

		it('when checked at the end of the last entry, then the day is done', () => {
			// Arrange, Act
			const status = dayStatus(entries, at('18:05'));

			// Assert
			expect(status).toEqual({ state: 'done' });
		});
	});

	describe('given entries out of order', () => {
		it('when checked, then they are read in time order', () => {
			// Arrange
			const entries = [work, walk];

			// Act
			const status = dayStatus(entries, at('07:00'));

			// Assert
			expect(status).toEqual({ state: 'gap', next: work, minutesUntil: 120 });
		});
	});
});

describe('entryPhase', () => {
	it.each([
		['07:59', 'upcoming'],
		['08:00', 'current'],
		['08:59', 'current'],
		['09:00', 'past']
	])('when an 08:00–09:00 entry is checked at %s, then it is %s', (time, expected) => {
		// Arrange, Act
		const phase = entryPhase(squat, at(time));

		// Assert
		expect(phase).toBe(expected);
	});
});

describe('dayFocus', () => {
	it('when a day has training entries, then their labels are the focus in time order', () => {
		// Arrange
		const entries = [run, walk, squat, work];

		// Act
		const focus = dayFocus(entries);

		// Assert
		expect(focus).toEqual(['Knebøy', 'Løpetur']);
	});

	it('when a day has no training, then there is no focus', () => {
		// Arrange, Act
		const focus = dayFocus([walk, work]);

		// Assert
		expect(focus).toEqual([]);
	});
});

describe('sessionEntry', () => {
	const bench: DayPlanEntry = {
		start: '08:00',
		end: '09:00',
		kind: 'training',
		label: 'Benkpress'
	};

	describe('given several training entries', () => {
		it('when one is named after the lift, then the session belongs to that one', () => {
			// Arrange
			const entries = [walk, run, bench];

			// Act
			const entry = sessionEntry(entries, 'Benkpress');

			// Assert
			expect(entry).toBe(bench);
		});

		it('when none is named after the lift, then the session belongs to the first one', () => {
			// Arrange
			const entries = [run, walk, squat];

			// Act
			const entry = sessionEntry(entries, 'Markløft');

			// Assert
			expect(entry).toBe(squat);
		});
	});

	describe('given no training entries', () => {
		it('when the session is placed, then it belongs to none of them', () => {
			// Arrange, Act
			const entry = sessionEntry([walk, work], 'Knebøy');

			// Assert
			expect(entry).toBeUndefined();
		});
	});
});
