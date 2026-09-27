import { weekdays, type CyclePlan, type PlannedCycle, type TrainingDay } from './types';

export type ScheduleInput = {
	startDate: string;
	days: TrainingDay[];
	cycles: CyclePlan[];
	/** Week templates for weeks 1–3 of a leader or anchor cycle */
	weekTemplateIds: readonly [number, number, number];
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Dates are handled as UTC midnight so local timezone and DST never shift a day.
const parseDate = (date: string): Date => new Date(date + 'T00:00:00Z');
const formatDate = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (date: string, days: number): string =>
	formatDate(new Date(parseDate(date).getTime() + days * DAY_MS));

export const isMonday = (date: string): boolean => parseDate(date).getUTCDay() === 1;

const weeksIn = (cycle: CyclePlan): number => (cycle.type === '7th week' ? 1 : 3);

const weekTemplateFor = (
	cycle: CyclePlan,
	week: number,
	weekTemplateIds: ScheduleInput['weekTemplateIds']
): number => {
	if (cycle.type !== '7th week') return weekTemplateIds[week - 1];
	if (cycle.seventhWeekTemplateId === undefined)
		throw new Error('A 7th week cycle needs a week template');
	return cycle.seventhWeekTemplateId;
};

export const planBlock = ({
	startDate,
	days,
	cycles,
	weekTemplateIds
}: ScheduleInput): PlannedCycle[] => {
	if (!isMonday(startDate)) throw new Error(`Block must start on a Monday, got ${startDate}`);

	let cycleStart = startDate;
	return cycles.map((cycle, index) => {
		const weeks = weeksIn(cycle);
		const sessions = Array.from({ length: weeks }, (_, w) => w + 1).flatMap((week) =>
			days.map(({ weekday, liftId }) => ({
				liftId,
				weekNumberInCycle: week,
				weekTemplateId: weekTemplateFor(cycle, week, weekTemplateIds),
				plannedDate: addDays(cycleStart, (week - 1) * 7 + weekdays.indexOf(weekday))
			}))
		);
		const planned: PlannedCycle = {
			...cycle,
			numberInBlock: index + 1,
			startDate: cycleStart,
			endDate: addDays(cycleStart, weeks * 7 - 1),
			sessions
		};
		cycleStart = addDays(cycleStart, weeks * 7);
		return planned;
	});
};
