import { describe, expect, it } from 'vitest';
import {
	formatDuration,
	isClockTime,
	isWeekday,
	minutesOfDay,
	nextDateOf,
	toMinutes,
	weekdayOf
} from './time';

describe('isClockTime', () => {
	it.each(['00:00', '06:25', '23:59'])('when given %s, then it is accepted', (time) => {
		// Arrange, Act
		const valid = isClockTime(time);

		// Assert
		expect(valid).toBe(true);
	});

	it.each(['24:00', '6:25', '06:60', '06.25', ''])(
		'when given "%s", then it is rejected',
		(time) => {
			// Arrange, Act
			const valid = isClockTime(time);

			// Assert
			expect(valid).toBe(false);
		}
	);
});

describe('toMinutes', () => {
	it('when given a clock time, then it returns the minutes since midnight', () => {
		// Arrange, Act
		const minutes = toMinutes('06:25');

		// Assert
		expect(minutes).toBe(385);
	});

	it('when given something that is not a clock time, then it throws naming the input', () => {
		// Arrange, Act, Assert
		expect(() => toMinutes('25:00')).toThrow('25:00');
	});
});

describe('minutesOfDay', () => {
	it('when given a local date and time, then it returns the local minutes since midnight', () => {
		// Arrange
		const date = new Date(2026, 8, 28, 13, 10, 45);

		// Act
		const minutes = minutesOfDay(date);

		// Assert
		expect(minutes).toBe(790);
	});
});

describe('formatDuration', () => {
	it.each([
		[5, '5 min'],
		[60, '1 t'],
		[80, '1 t 20 min'],
		[235, '3 t 55 min']
	])('when given %i minutes, then it reads "%s"', (minutes, expected) => {
		// Arrange, Act
		const text = formatDuration(minutes);

		// Assert
		expect(text).toBe(expected);
	});
});

describe('weekdayOf', () => {
	it.each([
		['2026-09-28', 'monday'],
		['2026-10-01', 'thursday'],
		['2026-10-04', 'sunday']
	])('when given %s, then it is a %s', (iso, expected) => {
		// Arrange, Act
		const weekday = weekdayOf(iso);

		// Assert
		expect(weekday).toBe(expected);
	});
});

describe('isWeekday', () => {
	it.each([
		['monday', true],
		['sunday', true],
		['Monday', false],
		['', false]
	])('when given "%s", then it returns %s', (value, expected) => {
		// Arrange, Act
		const valid = isWeekday(value);

		// Assert
		expect(valid).toBe(expected);
	});
});

describe('nextDateOf', () => {
	describe('given today is Sunday 4 October', () => {
		const sunday = '2026-10-04';

		it('when asked for Monday, then it is tomorrow', () => {
			// Arrange, Act
			const date = nextDateOf('monday', sunday);

			// Assert
			expect(date).toBe('2026-10-05');
		});

		it('when asked for Sunday, then it is today', () => {
			// Arrange, Act
			const date = nextDateOf('sunday', sunday);

			// Assert
			expect(date).toBe('2026-10-04');
		});

		it('when asked for Saturday, then it is six days ahead', () => {
			// Arrange, Act
			const date = nextDateOf('saturday', sunday);

			// Assert
			expect(date).toBe('2026-10-10');
		});
	});

	describe('given a week that crosses the end of daylight saving time', () => {
		it('when asked for that Sunday, then it is still six calendar days ahead', () => {
			// Arrange
			const monday = '2026-10-19';

			// Act
			const date = nextDateOf('sunday', monday);

			// Assert
			expect(date).toBe('2026-10-25');
		});
	});
});
