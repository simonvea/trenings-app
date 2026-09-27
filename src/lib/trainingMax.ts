import { parseDecimal } from './format';

export type TestSet = { weight: number; reps: number };

// 90 % is the original 5/3/1 training max; the existing maxes were set this way
const TRAINING_MAX_SHARE = 0.9;
// Wendler's advice when a training max turns out too heavy
const TOO_HEAVY_SHARE = 0.9;
// Rep-based estimates drift badly above ten reps
const MAX_TEST_REPS = 10;
// Catches a missing decimal comma (1025 for 102,5) before it can become a block's training max
const MAX_TEST_WEIGHT = 500;

// Rounded down so a rounding step never makes the training max heavier than the test
const roundDownToHalfKg = (kg: number): number => Math.floor(kg * 2 + 1e-9) / 2;

export const estimateOneRepMax = ({ weight, reps }: TestSet): number =>
	reps === 1 ? weight : weight * reps * 0.0333 + weight;

export const trainingMaxFromTest = (set: TestSet): number =>
	roundDownToHalfKg(estimateOneRepMax(set) * TRAINING_MAX_SHARE);

export const lowerTrainingMax = (trainingMax: number): number =>
	roundDownToHalfKg(trainingMax * TOO_HEAVY_SHARE);

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const parseTestSet = (input: { weight: string; reps: string }): ParseResult<TestSet> => {
	const weight = parseDecimal(input.weight);
	if (weight === null || weight <= 0) return { ok: false, error: 'Skriv inn vekten du løftet' };
	if (weight > MAX_TEST_WEIGHT)
		return { ok: false, error: `Vekten kan ikke være over ${MAX_TEST_WEIGHT} kg` };

	const repsText = input.reps.trim();
	const reps = Number(repsText);
	if (!/^\d+$/.test(repsText) || reps < 1 || reps > MAX_TEST_REPS)
		return { ok: false, error: `Reps må være et heltall fra 1 til ${MAX_TEST_REPS}` };

	return { ok: true, value: { weight, reps } };
};

export type TrainingMaxSource = 'current' | 'test';

// Both timestamps are SQLite CURRENT_TIMESTAMP (UTC, same format), so they compare as text.
// A test logged after the last change is the better starting point for a new block.
export const defaultTrainingMaxSource = (
	lift: { trainingMax: number; changedAt: string },
	test: { createdAt: string } | undefined
): TrainingMaxSource => {
	if (!test) return 'current';
	if (!lift.trainingMax) return 'test';
	return test.createdAt > lift.changedAt ? 'test' : 'current';
};
