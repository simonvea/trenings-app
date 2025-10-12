export type PlanType = 'Leder' | 'Anker' | '7th';
export type PlanFocus = 'Volum' | 'Intensitet' | 'PR' | 'Deload' | 'TM test';
export type SupplementalTemplateName = 'FSL' | 'TM test' | 'Deload';
export type Structure = '5/3/1' | '3/5/1';
export type MainLifts = 'Knebøy' | 'Markløft' | 'Benkpress' | 'Skulderpress';
export type Days = 'Mandag' | 'Tirsdag' | 'Torsdag' | 'Fredag';
export type Week = { day: Days; lift: MainLifts }[];

export type Cycle = {
	plan: PlanType;
	template: SupplementalTemplateName;
	focus: PlanFocus;
	done: boolean;
	structure: '5/3/1' | '3/5/1';
};
export type Plan = Cycle[];

export type Set = {
	reps: number;
	weight: number;
	isAmrap: boolean;
};
export type SupplementalWork = {
	sets: number;
	reps: number;
	weight: number;
	name: string;
};
export type MainLift = {
	name: MainLifts;
	warmupSets: Set[];
	sets: Set[];
	supplemental: SupplementalWork;
	comment?: string;
};

export type Fractions = { fraction: number; isAmrap: boolean }[];
export type SupplementalTemplate = {
	reps: number;
	sets: number;
	name: SupplementalTemplateName;
	weightFunction: (mainFractions: Fractions, trainingMax: number) => number;
};

export type TrainingMax = {
	[key in MainLifts]: number;
} & { updatedAt: Date };
