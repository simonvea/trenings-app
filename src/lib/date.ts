// Dates are passed around as local calendar days (YYYY-MM-DD). `Date.toJSON()` is UTC and
// gives yesterday's date between midnight and 02:00 in Norway, so it must not be used here.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number): string => String(n).padStart(2, '0');

export const toIsoDate = (date: Date): string =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseIsoDate = (iso: string): Date => {
	const match = ISO_DATE.exec(iso);
	if (!match) throw new Error(`Not an ISO date: ${iso}`);
	const [, year, month, day] = match.map(Number);
	return new Date(year, month - 1, day);
};

export const today = (): string => toIsoDate(new Date());

export const addDays = (iso: string, days: number): string => {
	const date = parseIsoDate(iso);
	date.setDate(date.getDate() + days);
	return toIsoDate(date);
};

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const formatDayHeading = (iso: string): string =>
	capitalize(
		parseIsoDate(iso).toLocaleDateString('nb', { weekday: 'long', day: 'numeric', month: 'long' })
	);

export const formatShortDate = (iso: string): string =>
	parseIsoDate(iso).toLocaleDateString('nb', { day: 'numeric', month: 'short' });
