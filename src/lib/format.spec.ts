import { describe, expect, it } from 'vitest';
import {
	formatChange,
	formatClock,
	formatDuration,
	formatReps,
	parseDecimal,
	parseWholeNumber
} from './format';

describe('parseDecimal', () => {
	it('when the value uses a Norwegian decimal comma, then it parses as a number', () => {
		// Arrange
		const typedOnPhone = '22,5';

		// Act
		const kg = parseDecimal(typedOnPhone);

		// Assert
		expect(kg).toBe(22.5);
	});

	it('when the value is empty, then there is no weight', () => {
		// Arrange
		const empty = '';

		// Act
		const kg = parseDecimal(empty);

		// Assert
		expect(kg).toBeNull();
	});

	it('when the value is not a number, then there is no weight', () => {
		// Arrange
		const garbage = '2x';

		// Act
		const kg = parseDecimal(garbage);

		// Assert
		expect(kg).toBeNull();
	});
});

describe('formatReps', () => {
	it.each([
		[1, '1 rep'],
		[5, '5 reps'],
		[0, '0 reps']
	])('when given %i, then it reads "%s"', (count, expected) => {
		// Arrange, Act
		const text = formatReps(count);

		// Assert
		expect(text).toBe(expected);
	});
});

describe('parseWholeNumber', () => {
	it.each([
		['7', 7],
		[' 12 ', 12],
		['', null],
		['2,5', null],
		['1e1', null]
	])('when given "%s", then it returns %s', (typed, expected) => {
		// Arrange, Act
		const value = parseWholeNumber(typed);

		// Assert
		expect(value).toBe(expected);
	});
});

describe('formatChange', () => {
	describe('given a new training max below the current one', () => {
		it('when formatting, then kilos and percent carry a minus sign', () => {
			// Arrange
			const from = 150;
			const to = 109.5;

			// Act
			const text = formatChange(from, to);

			// Assert
			expect(text).toBe('−40,5 kg · −27 %');
		});
	});

	describe('given a higher training max', () => {
		it('when formatting, then it carries a plus sign', () => {
			// Arrange, Act
			const text = formatChange(90, 94);

			// Assert
			expect(text).toBe('+4 kg · +4 %');
		});
	});

	describe('given no current training max', () => {
		it('when formatting, then there is no percentage', () => {
			// Arrange, Act
			const text = formatChange(0, 94);

			// Assert
			expect(text).toBe('+94 kg');
		});
	});
});

describe('formatClock', () => {
	it('when under a minute, then it shows minutes and padded seconds', () => {
		// Act
		const text = formatClock(7_000);

		// Assert
		expect(text).toBe('0:07');
	});

	it('when over an hour, then it shows hours, minutes and seconds', () => {
		// Act
		const text = formatClock((3600 + 2 * 60 + 10) * 1000);

		// Assert
		expect(text).toBe('1:02:10');
	});

	it('when exactly an hour has passed, then the hours are shown', () => {
		// Act
		const text = formatClock(3_600_000);

		// Assert
		expect(text).toBe('1:00:00');
	});

	it('when part of a second has passed, then the second is not counted yet', () => {
		// Act
		const text = formatClock(102_999);

		// Assert
		expect(text).toBe('1:42');
	});
});

describe('formatDuration', () => {
	it('when under an hour, then it shows whole minutes', () => {
		// Act
		const text = formatDuration(52 * 60 + 40);

		// Assert
		expect(text).toBe('53 min');
	});

	it('when it rounds up to a whole hour, then no zero minutes are shown', () => {
		// Act
		const text = formatDuration(59 * 60 + 40);

		// Assert
		expect(text).toBe('1 t');
	});

	it('when over an hour, then it shows hours and minutes', () => {
		// Act
		const text = formatDuration(65 * 60);

		// Assert
		expect(text).toBe('1 t 5 min');
	});
});
