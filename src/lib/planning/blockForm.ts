import { isMonday } from './schedule';
import {
	cycleTypes,
	weekdays,
	type AssistancePlan,
	type CyclePlan,
	type CycleType,
	type NewBlock,
	type TrainingDay,
	type Weekday
} from './types';

export type BlockFormField = 'name' | 'start_date' | 'days' | 'cycles' | 'assistance';

export type BlockFormResult =
	| { ok: true; value: NewBlock }
	| { ok: false; errors: Partial<Record<BlockFormField, string>> };

const TRAINING_DAYS = 4;

const text = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();
const optionalId = (value: string): number | undefined => (value ? Number(value) : undefined);
const texts = (data: FormData, key: string): string[] => data.getAll(key).map(String);
const isPositiveInteger = (n: number): boolean => Number.isInteger(n) && n > 0;
const hasDuplicates = <T>(values: T[]): boolean => new Set(values).size !== values.length;

const parseDays = (data: FormData): TrainingDay[] =>
	Array.from({ length: TRAINING_DAYS }, (_, i) => ({
		weekday: text(data, `day_${i + 1}_weekday`) as Weekday,
		liftId: Number(text(data, `day_${i + 1}_lift`))
	}));

const parseCycles = (data: FormData): CyclePlan[] => {
	const supplemental = texts(data, 'cycle_supplemental');
	const seventhWeek = texts(data, 'cycle_seventh_week');
	return texts(data, 'cycle_type').map((type, i) =>
		type === '7th week'
			? { type, seventhWeekTemplateId: optionalId(seventhWeek[i]) }
			: { type: type as CycleType, supplementalTemplateId: optionalId(supplemental[i]) }
	);
};

const parseAssistance = (data: FormData): AssistancePlan[] => {
	const lifts = texts(data, 'assistance_lift');
	const positions = texts(data, 'assistance_position');
	const sets = texts(data, 'assistance_sets');
	const reps = texts(data, 'assistance_reps');
	return texts(data, 'assistance_exercise')
		.map((exercise, i) => ({
			liftId: Number(lifts[i]),
			position: Number(positions[i]),
			exerciseId: Number(exercise),
			sets: Number(sets[i]),
			reps: Number(reps[i])
		}))
		.filter((a) => a.exerciseId);
};

const dropUndefined = <T extends object>(obj: T): T =>
	Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

export const parseBlockForm = (data: FormData): BlockFormResult => {
	const name = text(data, 'name');
	const startDate = text(data, 'start_date');
	const days = parseDays(data);
	const cycles = parseCycles(data).map(dropUndefined);
	const assistance = parseAssistance(data);

	const errors: Partial<Record<BlockFormField, string>> = {};

	if (!name) errors.name = 'Blokka må ha et navn';

	if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.start_date = 'Velg en startdato';
	else if (!isMonday(startDate)) errors.start_date = 'Blokka må starte på en mandag';

	if (days.some((d) => !weekdays.includes(d.weekday) || !isPositiveInteger(d.liftId)))
		errors.days = 'Velg ukedag og løft for alle treningsdager';
	else if (hasDuplicates(days.map((d) => d.weekday)))
		errors.days = 'To treningsdager kan ikke ha samme ukedag';
	else if (hasDuplicates(days.map((d) => d.liftId)))
		errors.days = 'Hvert løft kan bare trenes én dag i uka';

	if (cycles.length === 0) errors.cycles = 'Blokka må ha minst én syklus';
	else if (cycles.some((c) => !cycleTypes.includes(c.type)))
		errors.cycles = 'Ukjent syklustype';
	else if (cycles.some((c) => c.type === '7th week' && !c.seventhWeekTemplateId))
		errors.cycles = 'En 7. uke må ha en ukemal (f.eks. Deload)';

	if (assistance.some((a) => !isPositiveInteger(a.sets) || !isPositiveInteger(a.reps)))
		errors.assistance = 'Sett og reps må være positive heltall';

	if (Object.keys(errors).length > 0) return { ok: false, errors };

	return {
		ok: true,
		value: dropUndefined({
			name,
			goals: text(data, 'goals') || undefined,
			programTemplateId: optionalId(text(data, 'program_template_id')),
			startDate,
			days,
			cycles,
			assistance
		})
	};
};
