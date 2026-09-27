import type { SupplementalWork } from './types';

export const formatKg = (kg: number): string => `${kg.toLocaleString('nb')} kg`;

// Phone keyboards in a Norwegian locale type a decimal comma
export const parseDecimal = (value: string): number => Number(value.trim().replace(',', '.'));

export const formatSupplemental = ({ sets, reps, weight }: SupplementalWork): string =>
	`${sets} × ${reps}${weight === undefined ? '' : ` @ ${formatKg(weight)}`}`;
