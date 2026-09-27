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
	set_4_percentage: number | null;
	set_4_reps: number | null;
};

export const load: PageServerLoad = async () => {
	// A week back, so missed sessions can still be reached. The server clock may be UTC,
	// so the client decides which of these are past, today and upcoming.
	const rows = sql.all`SELECT s.id, s.planned_date, s.status, l.name AS lift_name,
		l.current_training_max, w.name AS week_name, w.set_3_percentage, w.set_3_reps,
		w.set_4_percentage, w.set_4_reps
	FROM workout_sessions AS s
	INNER JOIN lifts AS l ON l.id = s.lift_id
	INNER JOIN week_templates AS w ON w.id = s.week_template_id
	INNER JOIN cycles AS c ON c.id = s.cycle_id
	INNER JOIN training_blocks AS b ON b.id = c.block_id
	WHERE s.planned_date >= date('now', '-7 day') AND b.completed_date IS NULL
	ORDER BY s.planned_date
	LIMIT 12` as UpcomingSessionRow[];

	const upcoming: UpcomingSession[] = rows.map((row) => {
		// 7th week templates have a fourth set, which is then the top set
		const [reps, percentage] =
			row.set_4_reps && row.set_4_percentage
				? [row.set_4_reps, row.set_4_percentage]
				: [row.set_3_reps, row.set_3_percentage];
		return {
			id: row.id,
			planned_date: row.planned_date,
			status: row.status,
			liftName: translateLiftName(row.lift_name),
			weekName: row.week_name,
			topSet: {
				reps: Math.abs(reps),
				weight: normalizeWeight(row.current_training_max * percentage),
				isAmrap: reps < 0
			}
		};
	});

	return { blocks: listBlocks(), upcoming };
};
