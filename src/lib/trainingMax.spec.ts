import { describe, expect, it } from 'vitest';
import { calculateTM } from './trainingMax';
import type { TrainingMax } from './types';

describe('calculateTM', () => {
	describe('given a training max last updated long enough ago', () => {
		const createOldTM = (): TrainingMax => ({
			Knebøy: 100,
			Benkpress: 80,
			Markløft: 120,
			Skulderpress: 50,
			updatedAt: '2000-01-01'
		});

		it('when calculating a new training max, then the old training max is left unchanged', () => {
			// Arrange
			const oldTM = createOldTM();

			// Act
			calculateTM(oldTM);

			// Assert
			expect(oldTM).toEqual(createOldTM());
		});

		it('when calculating a new training max, then lower body lifts increase by 5 and upper body lifts by 2.5', () => {
			// Arrange
			const oldTM = createOldTM();

			// Act
			const newTM = calculateTM(oldTM);

			// Assert
			expect(newTM).toMatchObject({
				Knebøy: 105,
				Benkpress: 82.5,
				Markløft: 125,
				Skulderpress: 52.5
			});
		});
	});
});
