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

export type TrainingBlockDb = {
	id: number;
	name?: string;
	training_day_1: string;
	training_day_2: string;
	training_day_3: string;
	training_day_4?: string;
	lift_day_1_id: number;
	lift_day_2_id: number;
	lift_day_3_id: number;
	lift_day_4_id?: number;
	goals?: string;
	notes?: string;
	created_at?: Date;
	completed_date: Date;
};

export type TrainingCycleDb = {
	id: number;
	block_id: number;
	cycle_number_in_block: number;
	cycle_type: 'leader' | 'anchor' | '7th week';
	seventh_week_template_id?: number;
	supplemental_template_id?: number;
	start_date: Date;
	end_date?: Date;
	completed_date?: Date;
	notes?: string;
	created_at: Date;
};

export type WorkoutSessionsDb = {
	id: number;
	cycle_id: number;
	lift_id: number;
	week_number_in_cycle: number;
	week_template_id: number;
	planned_date: Date;
	completed_date?: Date;
	status: 'planned' | 'completed' | 'skipped';
	notes?: string;
	created_at: Date;
};
