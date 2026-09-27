import assert from 'node:assert';
import { sql } from './db';
import { trainingMaxFromTest, type TestSet } from '$lib/trainingMax';

export type TrainingMaxTest = {
	id: number;
	lift_id: number;
	test_date: string;
	weight: number;
	reps: number;
	training_max: number;
};

export function addTrainingMaxTest(liftId: number, testDate: string, set: TestSet): void {
	const lift = sql.get`SELECT id FROM lifts WHERE id = ${liftId}`;
	assert(lift, `Unknown lift ${liftId}`);

	sql.run`INSERT INTO training_max_tests (lift_id, test_date, weight, reps, training_max)
		VALUES (${liftId}, ${testDate}, ${set.weight}, ${set.reps}, ${trainingMaxFromTest(set)})`;
}

export function deleteTrainingMaxTest(id: number): void {
	sql.run`DELETE FROM training_max_tests WHERE id = ${id}`;
}

export function listTrainingMaxTests(): TrainingMaxTest[] {
	return sql.all`SELECT id, lift_id, test_date, weight, reps, training_max
		FROM training_max_tests
		ORDER BY test_date DESC, id DESC` as TrainingMaxTest[];
}

/** The most recent test per lift, keyed by lift id */
export function latestTrainingMaxTests(): Map<number, TrainingMaxTest> {
	const latest = new Map<number, TrainingMaxTest>();
	for (const test of listTrainingMaxTests()) {
		if (!latest.has(test.lift_id)) latest.set(test.lift_id, test);
	}
	return latest;
}
