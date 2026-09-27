import { describe, expect, it } from 'vitest';
import { planBlock, type ScheduleInput } from './schedule';

const weekTemplateIds = [11, 12, 13] as const;

const fourDays: ScheduleInput['days'] = [
	{ weekday: 'monday', liftId: 1 },
	{ weekday: 'tuesday', liftId: 2 },
	{ weekday: 'thursday', liftId: 4 },
	{ weekday: 'friday', liftId: 3 }
];

const input = (overrides: Partial<ScheduleInput> = {}): ScheduleInput => ({
	startDate: '2026-10-05', // a Monday
	days: fourDays,
	cycles: [{ type: 'leader', supplementalTemplateId: 5 }],
	weekTemplateIds,
	...overrides
});

describe('planBlock', () => {
	describe('given a single leader cycle', () => {
		it('when planned, then the cycle spans three weeks from the start date', () => {
			// Arrange
			const schedule = input();

			// Act
			const [cycle] = planBlock(schedule);

			// Assert
			expect(cycle).toMatchObject({
				numberInBlock: 1,
				type: 'leader',
				supplementalTemplateId: 5,
				startDate: '2026-10-05',
				endDate: '2026-10-25'
			});
		});

		it('when planned, then each training day gets one session per week on its weekday', () => {
			// Arrange
			const schedule = input();

			// Act
			const [cycle] = planBlock(schedule);

			// Assert
			expect(cycle.sessions.filter((s) => s.weekNumberInCycle === 1)).toEqual([
				{ liftId: 1, weekNumberInCycle: 1, weekTemplateId: 11, plannedDate: '2026-10-05' },
				{ liftId: 2, weekNumberInCycle: 1, weekTemplateId: 11, plannedDate: '2026-10-06' },
				{ liftId: 4, weekNumberInCycle: 1, weekTemplateId: 11, plannedDate: '2026-10-08' },
				{ liftId: 3, weekNumberInCycle: 1, weekTemplateId: 11, plannedDate: '2026-10-09' }
			]);
		});

		it('when planned, then weeks two and three use their own week template a week apart', () => {
			// Arrange
			const schedule = input();

			// Act
			const [cycle] = planBlock(schedule);

			// Assert
			const mondays = cycle.sessions.filter((s) => s.liftId === 1);
			expect(mondays).toEqual([
				{ liftId: 1, weekNumberInCycle: 1, weekTemplateId: 11, plannedDate: '2026-10-05' },
				{ liftId: 1, weekNumberInCycle: 2, weekTemplateId: 12, plannedDate: '2026-10-12' },
				{ liftId: 1, weekNumberInCycle: 3, weekTemplateId: 13, plannedDate: '2026-10-19' }
			]);
		});
	});

	describe('given a weekend training day', () => {
		it('when planned, then the session lands on sunday of the same week', () => {
			// Arrange
			const schedule = input({ days: [{ weekday: 'sunday', liftId: 1 }] });

			// Act
			const [cycle] = planBlock(schedule);

			// Assert
			expect(cycle.sessions[0].plannedDate).toBe('2026-10-11');
		});
	});

	describe('given two leaders, a 7th week and an anchor', () => {
		const schedule = input({
			cycles: [
				{ type: 'leader', supplementalTemplateId: 5 },
				{ type: 'leader', supplementalTemplateId: 5 },
				{ type: '7th week', seventhWeekTemplateId: 20 },
				{ type: 'anchor', supplementalTemplateId: 1 }
			]
		});

		it('when planned, then cycles follow each other without gaps', () => {
			// Act
			const cycles = planBlock(schedule);

			// Assert
			expect(cycles.map((c) => [c.numberInBlock, c.startDate, c.endDate])).toEqual([
				[1, '2026-10-05', '2026-10-25'],
				[2, '2026-10-26', '2026-11-15'],
				[3, '2026-11-16', '2026-11-22'],
				[4, '2026-11-23', '2026-12-13']
			]);
		});

		it('when planned, then the 7th week has one week of sessions using its own template', () => {
			// Act
			const seventhWeek = planBlock(schedule)[2];

			// Assert
			expect(seventhWeek.sessions).toHaveLength(4);
			expect(seventhWeek.sessions.every((s) => s.weekNumberInCycle === 1)).toBe(true);
			expect(seventhWeek.sessions.every((s) => s.weekTemplateId === 20)).toBe(true);
		});
	});

	describe('given a start date that is not a monday', () => {
		it('when planned, then it throws naming the date', () => {
			// Arrange
			const schedule = input({ startDate: '2026-10-06' });

			// Act
			const act = () => planBlock(schedule);

			// Assert
			expect(act).toThrow('2026-10-06');
		});
	});

	describe('given a 7th week without a week template', () => {
		it('when planned, then it throws', () => {
			// Arrange
			const schedule = input({ cycles: [{ type: '7th week' }] });

			// Act
			const act = () => planBlock(schedule);

			// Assert
			expect(act).toThrow('7th week');
		});
	});
});
