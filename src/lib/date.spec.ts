import { describe, expect, it } from 'vitest';
import {
	addDays,
	formatDayHeading,
	formatShortDate,
	formatWeekdayShort,
	isIsoDate,
	localDateOfUtcTimestamp,
	toIsoDate
} from './date';

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

describe('isIsoDate', () => {
	it.each(['2026-09-27', '2028-02-29'])(
		'when given the real day %s, then it is accepted',
		(iso) => {
			// Arrange, Act
			const valid = isIsoDate(iso);

			// Assert
			expect(valid).toBe(true);
		}
	);

	it.each(['2026-13-45', '2026-02-29', '27.09.2026', ''])(
		'when given "%s", then it is rejected',
		(iso) => {
			// Arrange, Act
			const valid = isIsoDate(iso);

			// Assert
			expect(valid).toBe(false);
		}
	);
});

describe('localDateOfUtcTimestamp', () => {
	it('when given a late evening UTC timestamp, then it returns the local calendar day of that moment', () => {
		// Arrange
		const timestamp = '2026-09-27 22:30:00';

		// Act
		const date = localDateOfUtcTimestamp(timestamp);

		// Assert
		expect(date).toBe(toIsoDate(new Date(Date.UTC(2026, 8, 27, 22, 30))));
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
