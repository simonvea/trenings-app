import type { SupplementalWork } from './types';

export const formatKg = (kg: number): string => `${kg.toLocaleString('nb')} kg`;

// Phone keyboards in a Norwegian locale type a decimal comma. Null means "no weight given".
export const parseDecimal = (value: string): number | null => {
	const trimmed = value.trim();
	if (trimmed === '') return null;
	const number = Number(trimmed.replace(',', '.'));
	return Number.isFinite(number) ? number : null;
};

export const formatSupplemental = ({ sets, reps, weight }: SupplementalWork): string =>
	`${sets} × ${reps}${weight === undefined ? '' : ` @ ${formatKg(weight)}`}`;

export const formatReps = (count: number): string => `${count} ${count === 1 ? 'rep' : 'reps'}`;

// Null means "not given"; Number('') would otherwise read an empty field as 0 reps
export const parseWholeNumber = (value: string): number | null => {
	const trimmed = value.trim();
	return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
};
