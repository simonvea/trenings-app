import { describe, expect, it } from 'vitest';
import {
	durationSeconds,
	isSessionTimer,
	logSet,
	restMs,
	restoreTimer,
	startTimer,
	totalMs,
	type SessionTimer
} from './sessionTimer';

const idle: SessionTimer = { kind: 'idle' };
const minute = 60_000;

describe('startTimer', () => {
	it('when the timer is idle, then it runs from now with no set logged', () => {
		// Act
		const timer = startTimer(idle, 1000);

		// Assert
		expect(timer).toEqual({ kind: 'running', startedAt: 1000, lastSetAt: undefined });
	});

	it('when the timer is already running, then it keeps its start', () => {
		// Arrange
		const running = startTimer(idle, 1000);

		// Act
		const timer = startTimer(running, 5000);

		// Assert
		expect(timer).toBe(running);
	});
});

describe('logSet', () => {
	it('when a set is logged before the timer is started, then the timer starts at that set', () => {
		// Act
		const timer = logSet(idle, 1000);

		// Assert
		expect(timer).toEqual({ kind: 'running', startedAt: 1000, lastSetAt: 1000 });
	});

	it('when a set is logged on a running timer, then the rest restarts from that set', () => {
		// Arrange
		const running = startTimer(idle, 0);

		// Act
		const timer = logSet(running, 2 * minute);

		// Assert
		expect(restMs(timer, 3 * minute)).toBe(minute);
		expect(totalMs(timer, 3 * minute)).toBe(3 * minute);
	});
});

describe('restMs', () => {
	it('when no set has been logged yet, then the rest counts from the start', () => {
		// Arrange
		const running = startTimer(idle, 0);

		// Act
		const rest = restMs(running, minute);

		// Assert
		expect(rest).toBe(minute);
	});

	it('when the clock reads before the last set, then the rest is zero rather than negative', () => {
		// Arrange
		const timer = logSet(startTimer(idle, 0), minute);

		// Act
		const rest = restMs(timer, minute - 500);

		// Assert
		expect(rest).toBe(0);
	});

	it('when the timer is idle, then there is no rest time', () => {
		// Act
		const rest = restMs(idle, minute);

		// Assert
		expect(rest).toBeUndefined();
	});
});

describe('durationSeconds', () => {
	it('when sets have been logged, then the duration runs from the start to the last set', () => {
		// Arrange
		const timer = logSet(logSet(startTimer(idle, 0), 10 * minute), 52 * minute + 400);

		// Act
		const seconds = durationSeconds(timer);

		// Assert
		expect(seconds).toBe(52 * 60);
	});

	it('when no set has been logged, then there is no duration', () => {
		// Arrange
		const running = startTimer(idle, 0);

		// Act
		const seconds = durationSeconds(running);

		// Assert
		expect(seconds).toBeUndefined();
	});

	it('when the only set logged is the one that started the timer, then there is no duration', () => {
		// Arrange
		const timer = logSet(idle, 1000);

		// Act
		const seconds = durationSeconds(timer);

		// Assert
		expect(seconds).toBeUndefined();
	});

	it('when the timer is idle, then there is no duration', () => {
		// Act
		const seconds = durationSeconds(idle);

		// Assert
		expect(seconds).toBeUndefined();
	});
});

describe('isSessionTimer', () => {
	it('when a stored timer is running with timestamps, then it is accepted', () => {
		// Arrange
		const stored: unknown = JSON.parse(JSON.stringify(logSet(idle, 1000)));

		// Act
		const valid = isSessionTimer(stored);

		// Assert
		expect(valid).toBe(true);
	});

	it('when a running timer has not logged a set, then it survives a JSON round trip', () => {
		// Arrange
		const stored: unknown = JSON.parse(JSON.stringify(startTimer(idle, 1000)));

		// Act
		const valid = isSessionTimer(stored);

		// Assert
		expect(valid).toBe(true);
	});

	it('when a stored timer has its last set before its start, then it is rejected', () => {
		// Arrange
		const stored: unknown = { kind: 'running', startedAt: 2000, lastSetAt: 1000 };

		// Act
		const valid = isSessionTimer(stored);

		// Assert
		expect(valid).toBe(false);
	});

	it('when nothing or an unknown kind is stored, then it is rejected', () => {
		// Act
		const valid = [null, 'running', { kind: 'paused', startedAt: 1000 }].map(isSessionTimer);

		// Assert
		expect(valid).toEqual([false, false, false]);
	});

	it('when a stored timer is running without a start, then it is rejected', () => {
		// Arrange
		const stored: unknown = { kind: 'running', lastSetAt: 1000 };

		// Act
		const valid = isSessionTimer(stored);

		// Assert
		expect(valid).toBe(false);
	});
});

describe('restoreTimer', () => {
	const at = (hour: number, day = 10): number => new Date(2026, 9, day, hour).getTime();

	it('when the saved timer started today, then it keeps running', () => {
		// Arrange
		const saved: unknown = JSON.parse(JSON.stringify(logSet(startTimer(idle, at(17)), at(18))));

		// Act
		const timer = restoreTimer(saved, '2026-10-10');

		// Assert
		expect(timer).toEqual({ kind: 'running', startedAt: at(17), lastSetAt: at(18) });
	});

	it('when the saved timer started on an earlier day, then it is not started', () => {
		// Arrange
		const saved: unknown = startTimer(idle, at(23, 9));

		// Act
		const timer = restoreTimer(saved, '2026-10-10');

		// Assert
		expect(timer).toEqual(idle);
	});

	it('when nothing valid was saved, then it is not started', () => {
		// Act
		const timer = restoreTimer({ kind: 'running', startedAt: 'x' }, '2026-10-10');

		// Assert
		expect(timer).toEqual(idle);
	});
});
