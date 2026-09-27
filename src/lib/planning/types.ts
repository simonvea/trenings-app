export const weekdays = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
] as const;
export type Weekday = (typeof weekdays)[number];

export const cycleTypes = ['leader', 'anchor', '7th week'] as const;
export type CycleType = (typeof cycleTypes)[number];

export type TrainingDay = { weekday: Weekday; liftId: number };

export type CyclePlan = {
	type: CycleType;
	supplementalTemplateId?: number;
	seventhWeekTemplateId?: number;
};

export type AssistancePlan = {
	liftId: number;
	position: number;
	exerciseId: number;
	sets: number;
	reps: number;
};

export type TrainingMaxPlan = { liftId: number; trainingMax: number };

export type NewBlock = {
	name: string;
	goals?: string;
	programTemplateId?: number;
	startDate: string;
	days: TrainingDay[];
	cycles: CyclePlan[];
	assistance: AssistancePlan[];
	// Written to the lifts when the block is created
	trainingMaxes: TrainingMaxPlan[];
};

export type PlannedSession = {
	liftId: number;
	weekNumberInCycle: number;
	weekTemplateId: number;
	plannedDate: string;
};

export type PlannedCycle = CyclePlan & {
	numberInBlock: number;
	startDate: string;
	endDate: string;
	sessions: PlannedSession[];
};

export type ProgramTemplate = {
	id: number;
	name: string;
	description?: string;
	supplementalTemplateId?: number;
	cycles: CyclePlan[];
	assistance: AssistancePlan[];
};
