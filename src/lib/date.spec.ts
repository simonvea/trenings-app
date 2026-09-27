import { describe, expect, it } from 'vitest';
import { addDays, formatDayHeading, formatShortDate, formatWeekdayShort, toIsoDate } from './date';

describe('toIsoDate', () => {
	it('when given a local date just after midnight, then it returns that local calendar day', () => {
		// Arrange
		const justAfterMidnight = new Date(2026, 8, 28, 0, 30);

		// Act
		const iso = toIsoDate(justAfterMidnight);

		// Assert
		expect(iso).toBe('2026-09-28');
	});
});

describe('addDays', () => {
	it('when adding one day to the last day of a month, then it rolls over to the next month', () => {
		// Arrange
		const lastOfSeptember = '2026-09-30';

		// Act
		const next = addDays(lastOfSeptember, 1);

		// Assert
		expect(next).toBe('2026-10-01');
	});

	it('when subtracting a day across the daylight saving change, then it lands on the previous day', () => {
		// Arrange
		const dayAfterDstEnds = '2026-10-26';

		// Act
		const previous = addDays(dayAfterDstEnds, -1);

		// Assert
		expect(previous).toBe('2026-10-25');
	});
});

describe('formatDayHeading', () => {
	it('when given an iso date, then it returns the Norwegian weekday, day and month', () => {
		// Arrange
		const sunday = '2026-09-27';

		// Act
		const heading = formatDayHeading(sunday);

		// Assert
		expect(heading).toBe('Søndag 27. september');
	});
});

describe('formatShortDate', () => {
	it('when given an iso date, then it returns day and abbreviated month', () => {
		// Arrange
		const date = '2026-10-04';

		// Act
		const short = formatShortDate(date);

		// Assert
		expect(short).toBe('4. okt.');
	});
});

describe('formatWeekdayShort', () => {
	it('when given an iso date, then it returns the abbreviated Norwegian weekday', () => {
		// Arrange
		const monday = '2026-09-28';

		// Act
		const weekday = formatWeekdayShort(monday);

		// Assert
		expect(weekday).toBe('man.');
	});
});
