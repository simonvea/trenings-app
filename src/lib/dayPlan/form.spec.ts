import { describe, expect, it } from 'vitest';
import { parseDayPlanForm } from './form';

type Row = { start: string; end: string; kind: string; label: string; note: string };

const row = (overrides: Partial<Row> = {}): Row => ({
	start: '08:00',
	end: '09:00',
	kind: 'training',
	label: 'Knebøy',
	note: '',
	...overrides
});

const toFormData = (rows: Row[]): FormData => {
	const data = new FormData();
	for (const r of rows) {
		for (const [key, value] of Object.entries(r)) data.append(key, value);
	}
	return data;
};

const parse = (rows: Row[]) => parseDayPlanForm(toFormData(rows));

const errorsFor = (rows: Row[]) => {
	const result = parse(rows);
	if (result.ok) throw new Error('Expected the form to be invalid');
	return result.errors;
};

describe('parseDayPlanForm', () => {
	describe('given valid rows out of order', () => {
		it('when parsed, then it returns the entries sorted by start time with trimmed text', () => {
			// Arrange
			const rows = [
				row({ start: '09:00', end: '11:30', kind: 'work', label: ' Jobb ', note: ' kontor ' }),
				row()
			];

			// Act
			const result = parse(rows);

			// Assert
			expect(result).toEqual({
				ok: true,
				value: [
					{ start: '08:00', end: '09:00', kind: 'training', label: 'Knebøy' },
					{ start: '09:00', end: '11:30', kind: 'work', label: 'Jobb', note: 'kontor' }
				]
			});
		});
	});

	describe('given no rows', () => {
		it('when parsed, then the day is cleared', () => {
			// Arrange, Act
			const result = parse([]);

			// Assert
			expect(result).toEqual({ ok: true, value: [] });
		});
	});

	describe('given a row left completely blank', () => {
		it('when parsed, then the row is ignored', () => {
			// Arrange
			const rows = [row(), row({ start: '', end: '', kind: 'routine', label: '', note: '' })];

			// Act
			const result = parse(rows);

			// Assert
			expect(result).toEqual({ ok: true, value: [expect.objectContaining({ label: 'Knebøy' })] });
		});
	});

	describe('given an invalid row', () => {
		it('when a time is missing, then that row’s times are reported', () => {
			// Arrange, Act
			const errors = errorsFor([row(), row({ start: '09:00', end: '' })]);

			// Assert
			expect(errors.rows).toEqual({ 1: { field: 'times', message: 'Fyll inn start og slutt' } });
		});

		it('when the end is not after the start, then that row’s times are reported', () => {
			// Arrange, Act
			const errors = errorsFor([row({ start: '09:00', end: '09:00' })]);

			// Assert
			expect(errors.rows).toEqual({ 0: { field: 'times', message: 'Slutt må være etter start' } });
		});

		it('when the label is blank, then that row’s label is reported', () => {
			// Arrange, Act
			const errors = errorsFor([row({ label: '  ', note: 'dusj' })]);

			// Assert
			expect(errors.rows).toEqual({ 0: { field: 'label', message: 'Skriv hva som skal skje' } });
		});

		it('when the kind is unknown, then that row’s kind is reported', () => {
			// Arrange, Act
			const errors = errorsFor([row({ kind: 'nap' })]);

			// Assert
			expect(errors.rows).toEqual({ 0: { field: 'kind', message: 'Velg en type' } });
		});
	});

	describe('given two rows that overlap', () => {
		it('when parsed, then the form error names both rows by their times', () => {
			// Arrange
			const rows = [
				row({ start: '08:30', end: '09:30', kind: 'work', label: 'Jobb' }),
				row({ start: '08:00', end: '09:00' })
			];

			// Act
			const errors = errorsFor(rows);

			// Assert
			expect(errors.form).toBe('Knebøy (08:00–09:00) overlapper med Jobb (08:30–09:30)');
		});
	});

	describe('given an invalid form', () => {
		it('when parsed, then the submitted rows are returned so no input is lost', () => {
			// Arrange
			const rows = [row({ label: '', note: 'dusj' })];

			// Act
			const result = parse(rows);

			// Assert
			expect(result).toMatchObject({ ok: false, rows });
		});
	});
});
