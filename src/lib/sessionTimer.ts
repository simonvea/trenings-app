import { toIsoDate } from './date';

// Rest between sets and total session time. Timestamps rather than running counters, so the
// timer is still right after iOS kills the PWA or the screen locks between sets.

export type SessionTimer =
	| { kind: 'idle' }
	| { kind: 'running'; startedAt: number; lastSetAt: number | undefined };

export const startTimer = (timer: SessionTimer, now: number): SessionTimer =>
	timer.kind === 'running' ? timer : { kind: 'running', startedAt: now, lastSetAt: undefined };

// Logging a set without pressing start still times the session, from that set
export const logSet = (timer: SessionTimer, now: number): SessionTimer => ({
	kind: 'running',
	startedAt: timer.kind === 'running' ? timer.startedAt : now,
	lastSetAt: now
});

// A display clock read a moment before the latest set would otherwise count backwards
const since = (from: number, now: number): number => Math.max(0, now - from);

export const restMs = (timer: SessionTimer, now: number): number | undefined =>
	timer.kind === 'running' ? since(timer.lastSetAt ?? timer.startedAt, now) : undefined;

export const totalMs = (timer: SessionTimer, now: number): number | undefined =>
	timer.kind === 'running' ? since(timer.startedAt, now) : undefined;

// Ends at the last set, not at submit, so finishing the form at home does not stretch it.
// A single set that started the timer itself measured nothing, so it has no duration.
export const durationSeconds = (timer: SessionTimer): number | undefined => {
	if (timer.kind !== 'running' || timer.lastSetAt === undefined) return undefined;
	const seconds = Math.round((timer.lastSetAt - timer.startedAt) / 1000);
	return seconds > 0 ? seconds : undefined;
};

const isTimestamp = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

export const isSessionTimer = (value: unknown): value is SessionTimer => {
	const timer = value as Record<string, unknown> | null;
	if (typeof timer !== 'object' || timer === null) return false;
	if (timer.kind === 'idle') return true;
	return (
		timer.kind === 'running' &&
		isTimestamp(timer.startedAt) &&
		// JSON drops an undefined property
		(timer.lastSetAt === undefined ||
			(isTimestamp(timer.lastSetAt) && timer.lastSetAt >= timer.startedAt))
	);
};

// A timer left from another day (a session opened by mistake, or never finished) would show hours
// of rest and give a duration the server throws away
export const restoreTimer = (saved: unknown, today: string): SessionTimer =>
	isSessionTimer(saved) && (saved.kind === 'idle' || toIsoDate(new Date(saved.startedAt)) === today)
		? saved
		: { kind: 'idle' };
