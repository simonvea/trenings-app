import { sql } from './db';

export function completeMainWorkout({
	sessionId,
	setNumber,
	plannedReps,
	plannedWeight,
	actualWeight,
	actualReps,
	isAmrap,
	hasDoneSupplemental
}: {
	sessionId: number;
	setNumber: number;
	plannedWeight: number;
	plannedReps: number;
	actualWeight: number;
	actualReps: number;
	isAmrap: boolean;
	hasDoneSupplemental: boolean;
}) {
	const amrap = isAmrap ? 1 : 0;
	const supplementalDone = hasDoneSupplemental ? 1 : 0;
	sql.run`
     INSERT INTO main_work (session_id, set_number, planned_weight, planned_reps, actual_weight, actual_reps, is_amrap, supplemental_done)
     VALUES (${sessionId},${setNumber},${plannedWeight},${plannedReps},${actualWeight},${actualReps},${amrap},${supplementalDone})
`;

	sql.run`UPDATE workout_sessions SET status = 'completed', completed_date = date('now') WHERE id = ${sessionId}`;
}

export function addAssistanceWork({
	sessionId,
	exerciseId,
	sets,
	reps,
	weight
}: {
	sessionId: number;
	exerciseId: number;
	sets: number;
	reps: number;
	weight: number;
	notes?: string;
}) {
	sql.run`INSERT INTO assistance_work (session_id, exercise_id, sets, reps, weight)
            VALUES (${sessionId}, ${exerciseId}, ${sets}, ${reps}, ${weight})`;
}
