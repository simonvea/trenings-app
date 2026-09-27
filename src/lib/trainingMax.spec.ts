import { describe, expect, it } from 'vitest';
import {
	estimateOneRepMax,
	lowerTrainingMax,
	defaultTrainingMaxSource,
	parseTestSet,
	trainingMaxCheck,
	trainingMaxFromTest
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

describe('trainingMaxFromTest', () => {
	describe('given a test set', () => {
		it('when calculating, then the training max is 90 % of the estimated max rounded down to 0.5 kg', () => {
			// Arrange
			const set = { weight: 100, reps: 5 };

			// Act
			const trainingMax = trainingMaxFromTest(set);

			// Assert
			expect(trainingMax).toBe(104.5);
		});
	});

	describe('given a result exactly on a half kilo', () => {
		it('when calculating, then floating point error does not round it down another step', () => {
			// Arrange
			const set = { weight: 115, reps: 1 };

			// Act
			const trainingMax = trainingMaxFromTest(set);

			// Assert
			expect(trainingMax).toBe(103.5);
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
			expect(check).toEqual({ kind: 'missedReps', actualReps: 3, minimumReps: 5, lowered: 90 });
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
		it('when checking, then a lower training max is suggested', () => {
			// Arrange
			const session = {
				trainingMax: 100,
				topSet: { percentage: 1, plannedWeight: 100, plannedReps: 3, actualReps: 2, isAmrap: true }
			};

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'missedReps', actualReps: 2, minimumReps: 3, lowered: 90 });
		});
	});

	describe('given a TM Test week set at 100 % with fewer reps than planned', () => {
		it('when checking, then a lower training max is suggested', () => {
			// Arrange
			const session = {
				trainingMax: 100,
				topSet: { percentage: 1, plannedWeight: 100, plannedReps: 5, actualReps: 3, isAmrap: false }
			};

			// Act
			const check = trainingMaxCheck(session);

			// Assert
			expect(check).toEqual({ kind: 'missedReps', actualReps: 3, minimumReps: 5, lowered: 90 });
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
