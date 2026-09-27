import assert from 'node:assert';
import { translateLiftName } from '$lib/helpers';
import { weekdays, type Weekday } from '$lib/planning/types';
import { sql, transaction } from '$lib/server/db';
import type { LiftName } from '$lib/types';
import { isClockTime } from './time';
import { entryKinds, type DayPlan, type DayPlanEntry, type EntryKind } from './types';

type EntryRow = {
	weekday: Weekday;
	start_time: string;
	end_time: string;
	kind: EntryKind;
	label: string;
	note: string | null;
};

export type PlannedSession = { date: string; liftName: LiftName };

const toEntry = (row: EntryRow): DayPlanEntry => ({
	start: row.start_time,
	end: row.end_time,
	kind: row.kind,
	label: row.label,
	...(row.note && { note: row.note })
});

export function loadDayPlan(): DayPlan {
	const rows = sql.all`SELECT weekday, start_time, end_time, kind, label, note
		FROM day_plan_entries ORDER BY start_time` as EntryRow[];
	return Object.fromEntries(
		weekdays.map((day) => [day, rows.filter((r) => r.weekday === day).map(toEntry)])
	) as DayPlan;
}

/** Replaces all entries of one weekday. Entries must already be validated by `parseDayPlanForm`. */
export function replaceDayPlan(weekday: Weekday, entries: DayPlanEntry[]): void {
	assert(weekdays.includes(weekday), `Unknown weekday: ${weekday}`);
	for (const e of entries) {
		assert(
			isClockTime(e.start) && isClockTime(e.end) && e.start < e.end,
			`Invalid times on ${weekday}: ${e.start}–${e.end}`
		);
		assert(entryKinds.includes(e.kind), `Unknown kind on ${weekday}: ${e.kind}`);
	}

	transaction(() => {
		sql.run`DELETE FROM day_plan_entries WHERE weekday = ${weekday}`;
		for (const e of entries) {
			sql.run`INSERT INTO day_plan_entries (weekday, start_time, end_time, kind, label, note)
				VALUES (${weekday}, ${e.start}, ${e.end}, ${e.kind}, ${e.label}, ${e.note ?? null})`;
		}
	});
}

// A week either side of today covers the current week whichever day it is
export function sessionsAroundToday(): PlannedSession[] {
	const rows = sql.all`SELECT s.planned_date, l.name AS lift_name
		FROM workout_sessions AS s
		INNER JOIN lifts AS l ON l.id = s.lift_id
		INNER JOIN cycles AS c ON c.id = s.cycle_id
		INNER JOIN training_blocks AS b ON b.id = c.block_id
		WHERE s.planned_date BETWEEN date('now', 'localtime', '-7 day') AND date('now', 'localtime', '+7 day')
			AND b.completed_date IS NULL
		ORDER BY s.planned_date` as { planned_date: string; lift_name: string }[];
	return rows.map((r) => ({ date: r.planned_date, liftName: translateLiftName(r.lift_name) }));
}
