import { describe, expect, it } from 'vitest';
import {
	MAX_TRAINING_MAX,
	estimateOneRepMax,
	currentOneRepMax,
	lowerTrainingMax,
	oneRepMaxFromTrainingMax,
	suggestedAmrapReps,
	defaultTrainingMaxSource,
	parseTestSet,
	trainingMaxCheck,
	trainingMaxFromTest,
	trainingMaxIncrease,
	trainingMaxIncrement
} from './trainingMax';

describe('estimateOneRepMax', () => {
	describe('given a set of several reps', () => {
		it('when estimating, then Wendler’s formula weight × reps × 0.0333 + weight is used', () => {
			// Arrange
			const set = { weight: 100, reps: 5 };

			// Act
			const oneRepMax = estimateOneRepMax(set);

			// Assert
			expect(oneRepMax).toBeCloseTo(116.65);
		});
	});

	describe('given a single rep', () => {
		it('when estimating, then the lifted weight is the one rep max', () => {
			// Arrange
			const set = { weight: 120, reps: 1 };

			// Act
			const oneRepMax = estimateOneRepMax(set);

			// Assert
			expect(oneRepMax).toBe(120);
		});
	});
});

describe('oneRepMaxFromTrainingMax', () => {
	describe('given a training max', () => {
		it('when estimating, then the one rep max is the training max divided by 85 %', () => {
			// Arrange
			const trainingMax = 85;

			// Act
			const oneRepMax = oneRepMaxFromTrainingMax(trainingMax);

			// Assert
			expect(oneRepMax).toBeCloseTo(100);
		});
	});
});

describe('currentOneRepMax', () => {
	describe('given a lift with a finished AMRAP set', () => {
		it('when estimating, then the estimate comes from that set, not from the training max', () => {
			// Arrange
			const lastAmrap = { weight: 50, reps: 8 };

			// Act
			const oneRepMax = currentOneRepMax({ trainingMax: 45, lastAmrap });

			// Assert
			expect(oneRepMax).toBeCloseTo(estimateOneRepMax(lastAmrap));
		});
	});

	describe('given a lift never done as an AMRAP set', () => {
		it('when estimating, then the training max stands in', () => {
			// Arrange
			const trainingMax = 85;

			// Act
			const oneRepMax = currentOneRepMax({ trainingMax });

			// Assert
			expect(oneRepMax).toBeCloseTo(oneRepMaxFromTrainingMax(trainingMax));
		});
	});
});

describe('suggestedAmrapReps', () => {
	describe('given the weight and reps of the last AMRAP set', () => {
		it('when suggesting for the same weight, then the same reps come back', () => {
			// Arrange
			const lastAmrap = { weight: 50, reps: 8 };

			// Act
			const reps = suggestedAmrapReps(50, estimateOneRepMax(lastAmrap));

			// Assert
			expect(reps).toBe(8);
		});

		it('when suggesting for a lighter weight, then more reps are suggested', () => {
			// Arrange
			const oneRepMax = estimateOneRepMax({ weight: 50, reps: 8 });

			// Act
			const reps = suggestedAmrapReps(45, oneRepMax);

			// Assert
			expect(reps).toBeGreaterThan(8);
		});
	});
});

describe('trainingMaxFromTest', () => {
	describe('given a test set', () => {
		it('when calculating, then the training max is 85 % of the estimated max rounded down to 0.5 kg', () => {
			// Arrange
			const set = { weight: 100, reps: 5 };

			// Act
			const trainingMax = trainingMaxFromTest(set);

			// Assert
			expect(trainingMax).toBe(99);
		});
	});

	describe('given a result exactly on a half kilo', () => {
		it('when calculating, then floating point error does not round it down another step', () => {
			// Arrange
			const set = { weight: 110, reps: 1 };

			// Act
			const trainingMax = trainingMaxFromTest(set);

			// Assert
			expect(trainingMax).toBe(93.5);
		});
	});
});

describe('lowerTrainingMax', () => {
	describe('given a training max that is too heavy', () => {
		it('when lowering, then it drops 10 % rounded down to 0.5 kg', () => {
			// Arrange
			const trainingMax = 97.5;

			// Act
			const lowered = lowerTrainingMax(trainingMax);

			// Assert
			expect(lowered).toBe(87.5);
		});
	});
});

describe('parseTestSet', () => {
	describe('given a weight with a decimal comma and whole reps', () => {
		it('when parsing, then the set is returned', () => {
			// Arrange
			const input = { weight: '82,5', reps: '4' };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: true, value: { weight: 82.5, reps: 4 } });
		});
	});

	describe('given no weight', () => {
		it('when parsing, then the weight is reported missing', () => {
			// Arrange
			const input = { weight: '', reps: '4' };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Skriv inn vekten du løftet' });
		});
	});

	describe('given ten reps', () => {
		it('when parsing, then the set is accepted', () => {
			// Arrange
			const input = { weight: '60', reps: '10' };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: true, value: { weight: 60, reps: 10 } });
		});
	});

	describe('given a weight that is missing its decimal comma', () => {
		it('when parsing, then it is rejected as too heavy', () => {
			// Arrange
			const input = { weight: '1025', reps: '3' };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Vekten kan ikke være over 500 kg' });
		});
	});

	describe('given reps written in a way that is not a plain whole number', () => {
		it.each(['', '0', '1e1', '+5', '5.0'])('when parsing "%s", then it is rejected', (reps) => {
			// Arrange
			const input = { weight: '60', reps };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Reps må være et heltall fra 1 til 10' });
		});
	});

	describe('given more than 10 reps', () => {
		it('when parsing, then it is rejected because the formula is unreliable', () => {
			// Arrange
			const input = { weight: '60', reps: '12' };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Reps må være et heltall fra 1 til 10' });
		});
	});

	describe('given fractional reps', () => {
		it('when parsing, then they are rejected', () => {
			// Arrange
			const input = { weight: '60', reps: '2,5' };

			// Act
			const result = parseTestSet(input);

			// Assert
			expect(result).toEqual({ ok: false, error: 'Reps må være et heltall fra 1 til 10' });
		});
	});
});

describe('trainingMaxCheck', () => {
	const amrapWeek = {
		trainingMax: 100,
		topSet: { percentage: 0.85, plannedWeight: 85, plannedReps: 5, actualReps: 5, isAmrap: true }
	};
	const seventhWeek = {
		trainingMax: 100,
		topSet: { percentage: 1, plannedWeight: 100, plannedReps: 1, actualReps: 1, isAmrap: false }
	};

	describe('given an AMRAP set that reached the minimum reps', () => {
		it('when checking, then there is nothing to do', () => {
			// Arrange
			const session = amrapWeek;

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'none' });
		});
	});

	describe('given an AMRAP set below the minimum reps', () => {
		it('when checking, then a 10 % lower training max is suggested', () => {
			// Arrange
			const session = { ...amrapWeek, topSet: { ...amrapWeek.topSet, actualReps: 3 } };

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({
				kind: 'missedReps',
				actualReps: 3,
				minimumReps: 5,
				lowered: 90,
				basis: 'tenPercent'
			});
		});
	});

	describe('given a 7th week top set at the full training max', () => {
		it('when checking, then the lifter is asked whether it felt too heavy', () => {
			// Arrange
			const session = seventhWeek;

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'askIfHeavy', lowered: 90 });
		});
	});

	describe('given a training max changed after the session', () => {
		it('when checking, then nothing is suggested so it is not lowered twice', () => {
			// Arrange
			const session = {
				trainingMax: 90,
				topSet: { ...amrapWeek.topSet, actualReps: 3 }
			};

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'changed', trainingMax: 90 });
		});
	});
	describe('given a PR week AMRAP set at 100 % below the minimum reps', () => {
		it('when checking, then a training max from the estimated max is suggested', () => {
			// Arrange
			const session = {
				trainingMax: 100,
				topSet: { percentage: 1, plannedWeight: 100, plannedReps: 3, actualReps: 2, isAmrap: true }
			};

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({
				kind: 'missedReps',
				actualReps: 2,
				minimumReps: 3,
				lowered: 90.5,
				basis: 'estimatedMax'
			});
		});
	});

	describe('given a TM-test week set at 100 % planned for five reps', () => {
		const testWeek = {
			trainingMax: 100,
			topSet: { percentage: 1, plannedWeight: 100, plannedReps: 5, actualReps: 3, isAmrap: false }
		};

		it('when three reps were done, then it counts as passed', () => {
			// Arrange
			const session = testWeek;

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'askIfHeavy', lowered: 90 });
		});

		it('when only two reps were done, then the training max is lowered from the estimated max', () => {
			// Arrange
			const session = { ...testWeek, topSet: { ...testWeek.topSet, actualReps: 2 } };

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({
				kind: 'missedReps',
				actualReps: 2,
				minimumReps: 3,
				lowered: 90.5,
				basis: 'estimatedMax'
			});
		});

		it('when no rep was done, then the estimate is the weight itself, so 85 % of it', () => {
			// Arrange
			const session = { ...testWeek, topSet: { ...testWeek.topSet, actualReps: 0 } };

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toMatchObject({ kind: 'missedReps', lowered: 85, basis: 'estimatedMax' });
		});
	});

	describe('given a 7th week deload set at 100 % planned for one rep', () => {
		it('when the rep was missed, then the minimum stays at the planned one rep', () => {
			// Arrange
			const session = {
				...seventhWeek,
				topSet: { ...seventhWeek.topSet, actualReps: 0 }
			};

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toMatchObject({ kind: 'missedReps', minimumReps: 1 });
		});
	});

	describe('given a plain top set below 100 %', () => {
		it('when checking, then there is nothing to ask', () => {
			// Arrange
			const session = {
				trainingMax: 100,
				topSet: {
					percentage: 0.9,
					plannedWeight: 90,
					plannedReps: 5,
					actualReps: 5,
					isAmrap: false
				}
			};

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'none' });
		});
	});

	describe('given the stored session training max differs from the current one', () => {
		it('when the change is too small to show in the rounded weights, then it is still seen as changed', () => {
			// Arrange
			const session = { ...seventhWeek, trainingMax: 99, sessionTrainingMax: 100 };

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'changed', trainingMax: 99 });
		});
	});

	describe('given the stored session training max equals the current one', () => {
		it('when checking a 7th week, then the question is asked', () => {
			// Arrange
			const session = { ...seventhWeek, sessionTrainingMax: 100 };

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'askIfHeavy', lowered: 90 });
		});
	});
});

describe('defaultTrainingMaxSource', () => {
	const lift = { trainingMax: 100, changedAt: '2026-09-20 18:00:00' };

	describe('given no test', () => {
		it('when choosing, then the current training max is used', () => {
			// Arrange
			const test = undefined;

			// Act
			const source = defaultTrainingMaxSource(lift, test);

			// Assert
			expect(source).toBe('current');
		});
	});

	describe('given a test logged after the training max was changed', () => {
		it('when choosing, then the test is used', () => {
			// Arrange
			const test = { createdAt: '2026-09-27 17:30:00' };

			// Act
			const source = defaultTrainingMaxSource(lift, test);

			// Assert
			expect(source).toBe('test');
		});
	});

	describe('given the training max was changed after the test, on the same day', () => {
		it('when choosing, then the newer current training max is used', () => {
			// Arrange
			const changedLater = { trainingMax: 100, changedAt: '2026-09-27 19:00:00' };
			const test = { createdAt: '2026-09-27 17:30:00' };

			// Act
			const source = defaultTrainingMaxSource(changedLater, test);

			// Assert
			expect(source).toBe('current');
		});
	});

	describe('given a test that was already offered when the last block was created', () => {
		it('when choosing for the next block, then the current training max is used', () => {
			// Arrange
			const test = { createdAt: '2026-09-27 17:30:00' };
			const lastBlockCreatedAt = '2026-09-28 20:00:00';

			// Act
			const source = defaultTrainingMaxSource(lift, test, lastBlockCreatedAt);

			// Assert
			expect(source).toBe('current');
		});
	});

	describe('given no current training max and an older test', () => {
		it('when choosing, then the test is used since there is nothing else', () => {
			// Arrange
			const unset = { trainingMax: 0, changedAt: '2026-09-27 19:00:00' };
			const test = { createdAt: '2026-09-01 17:30:00' };

			// Act
			const source = defaultTrainingMaxSource(unset, test);

			// Assert
			expect(source).toBe('test');
		});
	});
});

describe('trainingMaxIncrement', () => {
	describe.each([
		['Squat', 5],
		['Deadlift', 5],
		['Bench Press', 2.5],
		['Overhead Press', 2.5],
		['Barbell Row', 2.5]
	])('given %s', (liftName, expected) => {
		it(`when asking for the increment, then it is ${expected} kg`, () => {
			// Arrange / Act
			const increment = trainingMaxIncrement(liftName);

			// Assert
			expect(increment).toBe(expected);
		});
	});
});

describe('trainingMaxIncrease', () => {
	const hit = { plannedReps: 5, actualReps: 5 };
	const lastWeekOfLeader = {
		liftName: 'Squat',
		trainingMax: 100,
		sessionTrainingMax: 100,
		cycleType: 'leader' as const,
		weekNumber: 3,
		topSets: [hit, hit, hit],
		isLatestCompletedSession: true
	};

	describe('given the last week of a leader cycle where every top set reached its reps', () => {
		it('when deciding, then the training max rises by the lift’s increment', () => {
			// Arrange
			const cycle = lastWeekOfLeader;

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'raise', from: 100, to: 105 });
		});
	});

	describe('given the last week of an anchor cycle on an upper body lift', () => {
		it('when deciding, then the training max rises by 2.5 kg', () => {
			// Arrange
			const cycle = {
				...lastWeekOfLeader,
				liftName: 'Bench Press',
				trainingMax: 80,
				sessionTrainingMax: 80,
				cycleType: 'anchor' as const
			};

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'raise', from: 80, to: 82.5 });
		});
	});

	describe('given a top set in the cycle below its planned reps', () => {
		it('when deciding, then the training max is held and the missed sets are counted', () => {
			// Arrange
			const missed = { plannedReps: 5, actualReps: 3 };
			const cycle = { ...lastWeekOfLeader, topSets: [hit, missed, missed] };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'hold', missedSets: 2 });
		});
	});

	describe('given a skipped top set in the cycle', () => {
		it('when deciding, then it counts as missed and the training max is held', () => {
			// Arrange
			const skipped = { plannedReps: 5, actualReps: null };
			const cycle = { ...lastWeekOfLeader, topSets: [skipped, hit, hit] };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'hold', missedSets: 1 });
		});
	});

	describe('given a cycle where only the last week was logged', () => {
		it('when deciding, then nothing is offered after a single session', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, topSets: [hit] };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe('given a later session of the same lift was completed', () => {
		it('when deciding, then nothing is offered, since a later cycle already ran at this training max', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, isLatestCompletedSession: false };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe('given a raise that would pass the highest allowed training max', () => {
		it('when deciding, then nothing is offered, so the card never offers what is refused', () => {
			// Arrange
			const cycle = {
				...lastWeekOfLeader,
				trainingMax: MAX_TRAINING_MAX - 1,
				sessionTrainingMax: MAX_TRAINING_MAX - 1
			};

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe('given a 7th week', () => {
		it('when deciding, then nothing is offered, since the test only checks the training max', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, cycleType: '7th week' as const, weekNumber: 1 };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe.each([1, 2])('given week %i of a cycle', (weekNumber) => {
		it('when deciding, then nothing is offered before the cycle is done', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, weekNumber };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe('given the training max changed after the session', () => {
		it('when deciding, then nothing is offered, so an accepted raise does not come back', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, trainingMax: 105 };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe('given a session that did not store its training max', () => {
		it('when deciding, then nothing is offered, since a change cannot be ruled out', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, sessionTrainingMax: undefined };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});

	describe('given a lift without a training max', () => {
		it('when deciding, then nothing is offered', () => {
			// Arrange
			const cycle = { ...lastWeekOfLeader, trainingMax: 0, sessionTrainingMax: 0 };

			// Act
			const increase = trainingMaxIncrease(cycle);

			// Assert
			expect(increase).toEqual({ kind: 'none' });
		});
	});
});
