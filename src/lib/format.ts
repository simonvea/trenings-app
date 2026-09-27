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
