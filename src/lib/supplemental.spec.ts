import { describe, expect, it } from 'vitest';
import { supplementalWeight } from './supplemental';

const week = { trainingMax: 100, set1Percentage: 0.65, set2Percentage: 0.75 };

describe('supplementalWeight', () => {
	it('when the template uses the first set (FSL), then it returns the first set weight', () => {
		// Arrange
		const template = { weightCalculation: 'first_set' as const };

		// Act
		const weight = supplementalWeight(template, week);

		// Assert
		expect(weight).toBe(65);
	});

	it('when the template uses the second set (SSL), then it returns the second set weight', () => {
		// Arrange
		const template = { weightCalculation: 'second_set' as const };

		// Act
		const weight = supplementalWeight(template, week);

		// Assert
		expect(weight).toBe(75);
	});

	it('when the template uses a fixed percentage (BBB), then it returns that share of the training max rounded up to 2.5 kg', () => {
		// Arrange
		const template = { weightCalculation: 'fixed_percentage' as const, fixedPercentage: 0.51 };

		// Act
		const weight = supplementalWeight(template, week);

		// Assert
		expect(weight).toBe(52.5);
	});

	it('when the template uses a custom calculation, then there is no weight to suggest', () => {
		// Arrange
		const template = { weightCalculation: 'custom' as const };

		// Act
		const weight = supplementalWeight(template, week);

		// Assert
		expect(weight).toBeUndefined();
	});
});
