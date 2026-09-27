import { describe, expect, it } from 'vitest';
import { parseBlockForm } from './blockForm';

type Fields = Record<string, string | string[]>;

const validFields = (): Fields => ({
	name: 'Høst 2026',
	goals: 'Komme i gang igjen',
	program_template_id: '1',
	start_date: '2026-10-05',
	day_1_weekday: 'monday',
	day_1_lift: '1',
	day_2_weekday: 'tuesday',
	day_2_lift: '2',
	day_3_weekday: 'thursday',
	day_3_lift: '4',
	day_4_weekday: 'friday',
	day_4_lift: '3',
	cycle_type: ['leader', '7th week'],
	cycle_supplemental: ['5', ''],
	cycle_seventh_week: ['', '4'],
	assistance_lift: ['1', '1'],
	assistance_position: ['1', '2'],
	assistance_exercise: ['9', '12'],
	assistance_sets: ['5', '5'],
	assistance_reps: ['15', '10']
});

const toFormData = (fields: Fields): FormData => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
	}
	return data;
};

const errorsFor = (fields: Fields): Record<string, string> => {
	const result = parseBlockForm(toFormData(fields));
	if (result.ok) throw new Error('Expected form to be invalid');
	return result.errors;
};

describe('parseBlockForm', () => {
	describe('given a complete form', () => {
		it('when parsed, then it returns the new block', () => {
			// Arrange
			const data = toFormData(validFields());

			// Act
			const result = parseBlockForm(data);

			// Assert
			expect(result).toEqual({
				ok: true,
				value: {
					name: 'Høst 2026',
					goals: 'Komme i gang igjen',
					programTemplateId: 1,
					startDate: '2026-10-05',
					days: [
						{ weekday: 'monday', liftId: 1 },
						{ weekday: 'tuesday', liftId: 2 },
						{ weekday: 'thursday', liftId: 4 },
						{ weekday: 'friday', liftId: 3 }
					],
					cycles: [
						{ type: 'leader', supplementalTemplateId: 5 },
						{ type: '7th week', seventhWeekTemplateId: 4 }
					],
					assistance: [
						{ liftId: 1, position: 1, exerciseId: 9, sets: 5, reps: 15 },
						{ liftId: 1, position: 2, exerciseId: 12, sets: 5, reps: 10 }
					]
				}
			});
		});
	});

	describe('given optional fields left empty', () => {
		it('when parsed, then goals and program template are left out', () => {
			// Arrange
			const data = toFormData({ ...validFields(), goals: '', program_template_id: '' });

			// Act
			const result = parseBlockForm(data);

			// Assert
			expect(result.ok && result.value.goals).toBeUndefined();
			expect(result.ok && result.value.programTemplateId).toBeUndefined();
		});
	});

	describe('given an assistance row without exercise', () => {
		it('when parsed, then the row is skipped', () => {
			// Arrange
			const data = toFormData({ ...validFields(), assistance_exercise: ['9', ''] });

			// Act
			const result = parseBlockForm(data);

			// Assert
			expect(result.ok && result.value.assistance.map((a) => a.exerciseId)).toEqual([9]);
		});
	});

	describe('given an invalid form', () => {
		it('when the name is blank, then name has an error', () => {
			expect(errorsFor({ ...validFields(), name: '  ' })).toHaveProperty('name');
		});

		it('when the start date is not a monday, then start_date has an error', () => {
			expect(errorsFor({ ...validFields(), start_date: '2026-10-06' })).toHaveProperty(
				'start_date'
			);
		});

		it('when the start date is missing, then start_date has an error', () => {
			expect(errorsFor({ ...validFields(), start_date: '' })).toHaveProperty('start_date');
		});

		it('when two days share a weekday, then days has an error', () => {
			expect(errorsFor({ ...validFields(), day_2_weekday: 'monday' })).toHaveProperty('days');
		});

		it('when two days share a lift, then days has an error', () => {
			expect(errorsFor({ ...validFields(), day_2_lift: '1' })).toHaveProperty('days');
		});

		it('when a weekday is unknown, then days has an error', () => {
			expect(errorsFor({ ...validFields(), day_1_weekday: 'someday' })).toHaveProperty('days');
		});

		it('when there are no cycles, then cycles has an error', () => {
			const fields = validFields();
			delete fields.cycle_type;
			delete fields.cycle_supplemental;
			delete fields.cycle_seventh_week;
			expect(errorsFor(fields)).toHaveProperty('cycles');
		});

		it('when a 7th week has no week template, then cycles has an error', () => {
			expect(errorsFor({ ...validFields(), cycle_seventh_week: ['', ''] })).toHaveProperty(
				'cycles'
			);
		});

		it('when assistance sets are not positive, then assistance has an error', () => {
			expect(errorsFor({ ...validFields(), assistance_sets: ['0', '5'] })).toHaveProperty(
				'assistance'
			);
		});
	});
});
