import { isClockTime, toMinutes } from './time';
import { entryKinds, type DayPlanEntry, type EntryKind } from './types';

/** One row as typed into the edit form, before validation */
export type DayPlanRow = { start: string; end: string; kind: string; label: string; note: string };

export type RowError = { field: 'times' | 'label' | 'kind'; message: string };

export type DayPlanFormErrors = {
	/** Keyed by the row's index in the submitted form */
	rows: Record<number, RowError>;
	form?: string;
};

export type DayPlanFormResult =
	| { ok: true; value: DayPlanEntry[] }
	| { ok: false; errors: DayPlanFormErrors; rows: DayPlanRow[] };

const texts = (data: FormData, key: string): string[] => data.getAll(key).map(String);

const readRows = (data: FormData): DayPlanRow[] => {
	const [starts, ends, kinds, labels, notes] = ['start', 'end', 'kind', 'label', 'note'].map(
		(key) => texts(data, key)
	);
	return starts.map((start, i) => ({
		start: start.trim(),
		end: (ends[i] ?? '').trim(),
		kind: kinds[i] ?? '',
		label: (labels[i] ?? '').trim(),
		note: (notes[i] ?? '').trim()
	}));
};

// A row added and left untouched; the kind select always has a value, so it doesn't count
const isBlank = (row: DayPlanRow): boolean => !row.start && !row.end && !row.label && !row.note;

const rowError = (row: DayPlanRow): RowError | undefined => {
	if (!isClockTime(row.start) || !isClockTime(row.end))
		return { field: 'times', message: 'Fyll inn start og slutt' };
	if (toMinutes(row.end) <= toMinutes(row.start))
		return { field: 'times', message: 'Slutt må være etter start' };
	if (!row.label) return { field: 'label', message: 'Skriv hva som skal skje' };
	if (!entryKinds.includes(row.kind as EntryKind))
		return { field: 'kind', message: 'Velg en type' };
	return undefined;
};

const toEntry = (row: DayPlanRow): DayPlanEntry => ({
	start: row.start,
	end: row.end,
	kind: row.kind as EntryKind,
	label: row.label,
	...(row.note && { note: row.note })
});

const describeEntry = (e: DayPlanEntry): string => `${e.label} (${e.start}–${e.end})`;

export const overlapError = (sorted: DayPlanEntry[]): string | undefined => {
	const i = sorted.findIndex((e, i) => i > 0 && e.start < sorted[i - 1].end);
	return i > 0
		? `${describeEntry(sorted[i - 1])} overlapper med ${describeEntry(sorted[i])}`
		: undefined;
};

export const parseDayPlanForm = (data: FormData): DayPlanFormResult => {
	const rows = readRows(data);
	const filled = rows.map((row, index) => ({ row, index })).filter(({ row }) => !isBlank(row));

	const rowErrors = Object.fromEntries(
		filled.flatMap(({ row, index }) => {
			const error = rowError(row);
			return error ? [[index, error]] : [];
		})
	);
	if (Object.keys(rowErrors).length > 0) return { ok: false, errors: { rows: rowErrors }, rows };

	const entries = filled
		.map(({ row }) => toEntry(row))
		.toSorted((a, b) => a.start.localeCompare(b.start));
	const form = overlapError(entries);
	if (form) return { ok: false, errors: { rows: {}, form }, rows };

	return { ok: true, value: entries };
};
