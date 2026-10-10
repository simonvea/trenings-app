import type { AssistancePlan } from './types';

export type AssistanceFormResult =
	| { ok: true; value: AssistancePlan[] }
	| { ok: false; error: string };

const ASSISTANCE_POSITIONS = [1, 2];
const EMPTY_SLOT = { exerciseId: 0, sets: 5, reps: 10 };

const texts = (data: FormData, key: string): string[] => data.getAll(key).map(String);
const isPositiveInteger = (n: number): boolean => Number.isInteger(n) && n > 0;

export const parseAssistanceForm = (data: FormData): AssistanceFormResult => {
	const lifts = texts(data, 'assistance_lift');
	const positions = texts(data, 'assistance_position');
	const sets = texts(data, 'assistance_sets');
	const reps = texts(data, 'assistance_reps');
	// Rows with no exercise chosen are empty slots, so their sets and reps are not checked
	const assistance = texts(data, 'assistance_exercise')
		.map((exercise, i) => ({
			liftId: Number(lifts[i]),
			position: Number(positions[i]),
			exerciseId: Number(exercise),
			sets: Number(sets[i]),
			reps: Number(reps[i])
		}))
		.filter((a) => a.exerciseId);

	if (assistance.some((a) => !isPositiveInteger(a.sets) || !isPositiveInteger(a.reps)))
		return { ok: false, error: 'Sett og reps må være positive heltall' };

	const slotKeys = assistance.map((a) => `${a.liftId}-${a.position}`);
	if (new Set(slotKeys).size !== slotKeys.length)
		return { ok: false, error: 'Hver assistanseplass kan bare brukes én gang' };

	return { ok: true, value: assistance };
};

/** Every assistance slot for the lifts, in lift order, filled from the plan where it has one. */
export const assistanceSlots = (liftIds: number[], planned: AssistancePlan[]): AssistancePlan[] =>
	liftIds.flatMap((liftId) =>
		ASSISTANCE_POSITIONS.map((position) => ({
			liftId,
			position,
			...EMPTY_SLOT,
			...planned.find((a) => a.liftId === liftId && a.position === position)
		}))
	);
