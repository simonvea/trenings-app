import { normalizeWeight } from './core';
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
// The same guard for a training max typed in or raised, before it changes every session's weights
export const MAX_TRAINING_MAX = 500;

// Wendler's 1RM estimate adds this share of the weight per rep
const REP_FACTOR = 0.0333;

// Rounded down so a rounding step never makes the training max heavier than the test
const roundDownToHalfKg = (kg: number): number => Math.floor(kg * 2 + 1e-9) / 2;

export const estimateOneRepMax = ({ weight, reps }: TestSet): number =>
	reps === 1 ? weight : weight * reps * REP_FACTOR + weight;

export const oneRepMaxFromTrainingMax = (trainingMax: number): number =>
	trainingMax / TRAINING_MAX_SHARE;

// The latest AMRAP set shows today's strength; the training max only lags behind it
export const currentOneRepMax = ({
	trainingMax,
	lastAmrap
}: {
	trainingMax: number;
	lastAmrap?: TestSet;
}): number => (lastAmrap ? estimateOneRepMax(lastAmrap) : oneRepMaxFromTrainingMax(trainingMax));

// Inverse of estimateOneRepMax, so the same weight suggests the reps the estimate came from
export const suggestedAmrapReps = (weight: number, oneRepMax: number): number =>
	Math.round((oneRepMax / weight - 1) / REP_FACTOR);

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

// All timestamps are SQLite CURRENT_TIMESTAMP (UTC, same format), so they compare as text.
// A test logged after the last change is the better starting point for a new block, unless
// it was already offered, and turned down, when the last block was created.
export const defaultTrainingMaxSource = (
	lift: { trainingMax: number; changedAt: string },
	test: { createdAt: string } | undefined,
	lastBlockCreatedAt = ''
): TrainingMaxSource => {
	if (!test) return 'current';
	if (!lift.trainingMax) return 'test';
	const decidedAt = lift.changedAt > lastBlockCreatedAt ? lift.changedAt : lastBlockCreatedAt;
	return test.createdAt > decidedAt ? 'test' : 'current';
};

export type TopSetResult = {
	percentage: number;
	plannedWeight: number;
	plannedReps: number;
	actualReps: number;
	isAmrap: boolean;
};

export type TrainingMaxCheck =
	| { kind: 'none' }
	| { kind: 'missedReps'; actualReps: number; minimumReps: number; lowered: number }
	| { kind: 'askIfHeavy'; lowered: number }
	| { kind: 'changed'; trainingMax: number };

// Wendler: missing the minimum reps on the + set, or a 100 % set in the 7th week that
// felt too heavy, means the training max is too heavy.
export const trainingMaxCheck = ({
	trainingMax,
	sessionTrainingMax,
	topSet
}: {
	trainingMax: number;
	// Stored since migration 004; older sessions fall back to the planned weight
	sessionTrainingMax?: number;
	topSet: TopSetResult;
}): TrainingMaxCheck => {
	const atFullTrainingMax = !topSet.isAmrap && topSet.percentage >= 1;
	const missedReps =
		(topSet.isAmrap || atFullTrainingMax) && topSet.actualReps < topSet.plannedReps;
	if (!missedReps && !atFullTrainingMax) return { kind: 'none' };

	const changed =
		sessionTrainingMax === undefined
			? // The planned weight came from the training max at the time. Rounding to 2.5 kg
				// hides small changes, which is why the training max itself is stored now.
				normalizeWeight(trainingMax * topSet.percentage) !== topSet.plannedWeight
			: sessionTrainingMax !== trainingMax;
	if (changed) return { kind: 'changed', trainingMax };

	const lowered = lowerTrainingMax(trainingMax);
	return missedReps
		? {
				kind: 'missedReps',
				actualReps: topSet.actualReps,
				minimumReps: topSet.plannedReps,
				lowered
			}
		: { kind: 'askIfHeavy', lowered };
};

const LOWER_BODY_LIFTS = new Set(['Squat', 'Deadlift']);

// Wendler: 10 lb for the lower body, 5 lb for the upper body, in kg
export const trainingMaxIncrement = (liftName: string): number =>
	LOWER_BODY_LIFTS.has(liftName) ? 5 : 2.5;

const CYCLE_WEEKS = 3;

// actualReps is null when the set was skipped
export type CycleTopSet = { plannedReps: number; actualReps: number | null };

export type TrainingMaxIncrease =
	| { kind: 'none' }
	| { kind: 'raise'; from: number; to: number }
	| { kind: 'hold'; missedSets: number };

// Wendler raises the training max by the normal amount after every cycle. The 7th week test
// only checks it afterwards, so a raise never waits for that week. Missed or skipped reps in
// the cycle hold it back: the training max is then not too light. Only the lift's latest
// completed session offers it, so an old cycle's page cannot raise the training max twice.
export const trainingMaxIncrease = ({
	liftName,
	trainingMax,
	sessionTrainingMax,
	cycleType,
	weekNumber,
	topSets,
	isLatestCompletedSession
}: {
	liftName: string;
	trainingMax: number;
	// Undefined for sessions from before it was stored, which could have been done at another one
	sessionTrainingMax: number | undefined;
	cycleType: 'leader' | 'anchor' | '7th week';
	weekNumber: number;
	// One top set per week; fewer means weeks of the cycle were never logged
	topSets: CycleTopSet[];
	isLatestCompletedSession: boolean;
}): TrainingMaxIncrease => {
	const lastWeekOfCycle = cycleType !== '7th week' && weekNumber === CYCLE_WEEKS;
	// A changed training max was already decided on, by raising it, lowering it or typing it in
	const unchanged = sessionTrainingMax === trainingMax;
	const wholeCycleLogged = topSets.length === CYCLE_WEEKS;
	if (!lastWeekOfCycle || !unchanged || !(trainingMax > 0)) return { kind: 'none' };
	if (!wholeCycleLogged || !isLatestCompletedSession) return { kind: 'none' };

	const missedSets = topSets.filter(
		(set) => set.actualReps === null || set.actualReps < set.plannedReps
	).length;
	if (missedSets > 0) return { kind: 'hold', missedSets };

	const raised = trainingMax + trainingMaxIncrement(liftName);
	if (raised > MAX_TRAINING_MAX) return { kind: 'none' };
	return { kind: 'raise', from: trainingMax, to: raised };
};
