import type { PageServerLoad } from './$types';
import { normalizeWeight } from '$lib/core';
import { translateLiftName } from '$lib/helpers';
import { listBlocks } from '$lib/planning/db.server';
import { sql } from '$lib/server/db';
import type { LiftName, WorkoutSessionsDb } from '$lib/types';

export type UpcomingSession = Pick<WorkoutSessionsDb, 'id' | 'planned_date' | 'status'> & {
	liftName: LiftName;
	weekName: string;
	topSet: { reps: number; weight: number; isAmrap: boolean };
};

type UpcomingSessionRow = Pick<WorkoutSessionsDb, 'id' | 'planned_date' | 'status'> & {
	lift_name: string;
	week_name: string;
	current_training_max: number;
	set_3_percentage: number;
	set_3_reps: number;
};

export const load: PageServerLoad = async () => {
	// The server clock may be UTC, so start a day early and let the client pick out "today"
	const rows = sql.all`SELECT s.id, s.planned_date, s.status, l.name AS lift_name,
		l.current_training_max, w.name AS week_name, w.set_3_percentage, w.set_3_reps
	FROM workout_sessions AS s
	INNER JOIN lifts AS l ON l.id = s.lift_id
	INNER JOIN week_templates AS w ON w.id = s.week_template_id
	WHERE s.planned_date >= date('now', '-1 day')
	ORDER BY s.planned_date
	LIMIT 6` as UpcomingSessionRow[];

	const upcoming: UpcomingSession[] = rows.map((row) => ({
		id: row.id,
		planned_date: row.planned_date,
		status: row.status,
		liftName: translateLiftName(row.lift_name),
		weekName: row.week_name,
		topSet: {
			reps: Math.abs(row.set_3_reps),
			weight: normalizeWeight(row.current_training_max * row.set_3_percentage),
			isAmrap: row.set_3_reps < 0
		}
	}));

	return { blocks: listBlocks(), upcoming };
};
