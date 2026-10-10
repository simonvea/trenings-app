import { describe, expect, it } from 'vitest';
import { assistanceSlots, parseAssistanceForm } from './assistanceForm';

type Fields = Record<string, string[]>;

const validFields = (): Fields => ({
	assistance_lift: ['1', '1', '2'],
	assistance_position: ['1', '2', '1'],
	assistance_exercise: ['9', '12', '3'],
	assistance_sets: ['5', '5', '3'],
	assistance_reps: ['15', '10', '8']
});

const toFormData = (fields: Fields): FormData => {
	const data = new FormData();
	for (const [key, values] of Object.entries(fields)) {
		for (const v of values) data.append(key, v);
	}
	return data;
};

describe('parseAssistanceForm', () => {
	describe('given complete assistance rows', () => {
		it('when parsed, then it returns one plan per row', () => {
			// Arrange
			const data = toFormData(validFields());

			// Act
			const result = parseAssistanceForm(data);

			// Assert
			expect(result).toEqual({
				ok: true,
				value: [
					{ liftId: 1, position: 1, exerciseId: 9, sets: 5, reps: 15 },
					{ liftId: 1, position: 2, exerciseId: 12, sets: 5, reps: 10 },
					{ liftId: 2, position: 1, exerciseId: 3, sets: 3, reps: 8 }
				]
			});
		});
	});

	describe('given a row without exercise', () => {
		it('when parsed, then the row is left out', () => {
			// Arrange
			const data = toFormData({ ...validFields(), assistance_exercise: ['9', '0', ''] });

			// Act
			const result = parseAssistanceForm(data);

			// Assert
			expect(result.ok && result.value.map((a) => a.exerciseId)).toEqual([9]);
		});

		it('when its sets are not positive, then it is still left out without an error', () => {
			// Arrange
			const data = toFormData({
				...validFields(),
				assistance_exercise: ['9', '0', '3'],
				assistance_sets: ['5', '0', '3']
			});

			// Act
			const result = parseAssistanceForm(data);

			// Assert
			expect(result.ok).toBe(true);
		});
	});

	describe('given a row with an exercise', () => {
		it('when sets are not a positive integer, then it is rejected', () => {
			// Arrange
			const data = toFormData({ ...validFields(), assistance_sets: ['0', '5', '3'] });

			// Act
			const result = parseAssistanceForm(data);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Sett og reps må være positive heltall' });
		});

		it('when reps are not a whole number, then it is rejected', () => {
			// Arrange
			const data = toFormData({ ...validFields(), assistance_reps: ['15', '7.5', '8'] });

			// Act
			const result = parseAssistanceForm(data);

			// Assert
			expect(result.ok).toBe(false);
		});
	});

	describe('given two rows for the same lift and position', () => {
		it('when parsed, then it is rejected', () => {
			// Arrange
			const data = toFormData({ ...validFields(), assistance_position: ['1', '1', '1'] });

			// Act
			const result = parseAssistanceForm(data);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Hver assistanseplass kan bare brukes én gang' });
		});
	});
});

describe('assistanceSlots', () => {
	describe('given lifts with no planned assistance', () => {
		it('when slots are made, then each lift gets two empty 5×10 slots', () => {
			// Arrange
			const liftIds = [1, 2];

			// Act
			const slots = assistanceSlots(liftIds, []);

			// Assert
			expect(slots).toEqual([
				{ liftId: 1, position: 1, exerciseId: 0, sets: 5, reps: 10 },
				{ liftId: 1, position: 2, exerciseId: 0, sets: 5, reps: 10 },
				{ liftId: 2, position: 1, exerciseId: 0, sets: 5, reps: 10 },
				{ liftId: 2, position: 2, exerciseId: 0, sets: 5, reps: 10 }
			]);
		});
	});

	describe('given planned assistance for some slots', () => {
		it('when slots are made, then planned slots are filled and the rest stay empty', () => {
			// Arrange
			const planned = [{ liftId: 2, position: 2, exerciseId: 7, sets: 3, reps: 12 }];

			// Act
			const slots = assistanceSlots([1, 2], planned);

			// Assert
			expect(slots.filter((s) => s.exerciseId)).toEqual(planned);
			expect(slots).toHaveLength(4);
		});

		it('when a plan is for a lift not asked for, then it is left out', () => {
			// Arrange
			const planned = [{ liftId: 5, position: 1, exerciseId: 7, sets: 3, reps: 12 }];

			// Act
			const slots = assistanceSlots([1], planned);

			// Assert
			expect(slots.map((s) => s.liftId)).toEqual([1, 1]);
		});
	});
});
