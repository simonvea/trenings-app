import { describe, expect, it } from 'vitest';
import { parseDecimal } from './format';

describe('parseDecimal', () => {
	it('when the value uses a Norwegian decimal comma, then it parses as a number', () => {
		// Arrange
		const typedOnPhone = '22,5';

		// Act
		const kg = parseDecimal(typedOnPhone);

		// Assert
		expect(kg).toBe(22.5);
	});

	it('when the value is empty, then it parses as zero', () => {
		// Arrange
		const empty = '';

		// Act
		const kg = parseDecimal(empty);

		// Assert
		expect(kg).toBe(0);
	});
});
