export type PlanType = 'Leder' | 'Anker' | '7th';
export type PlanFocus = 'Volum' | 'Intensitet' | 'PR' | 'Deload' | 'TM test';
export type SupplementalTemplateName = 'FSL' | 'TM test' | 'Deload';
export type Structure = '5/3/1' | '3/5/1';
export type MainLifts = 'Knebøy' | 'Markløft' | 'Benkpress' | 'Skulderpress';
// Rows can replace a main lift in a block, but are not part of the classic four
export type LiftName = MainLifts | 'Roing';
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
	// Reps are typed in rather than ticked: AMRAP sets, and the 7th week set at 100 %
	recordsReps?: boolean;
};
export type SupplementalWork = {
	sets: number;
	reps: number;
	weight: number | undefined;
	name: string;
};
export type MainLift = {
	name: LiftName;
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
} & { updatedAt: string };

export type LiftsDb = {
	id: number;
	name: string;
	current_training_max: number;
	one_rep_max?: number;
	created_at: string;
	updated_at: string;
};

export type TrainingBlockDb = {
	id: number;
	name: string;
	program_template_id?: number;
	start_date: string;
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
	created_at?: string;
	completed_date?: string;
};

export type TrainingCycleDb = {
	id: number;
	block_id: number;
	cycle_number_in_block: number;
	cycle_type: 'leader' | 'anchor' | '7th week';
	seventh_week_template_id?: number;
	seventh_week_name?: string;
	supplemental_template_id?: number;
	supplemental_name?: string;
	start_date: string;
	end_date?: string;
	completed_date?: string;
	notes?: string;
	created_at: string;
};

export type WeekTemplateDb = {
	id: number;
	week_number: number;
	name: string;
	warmup_set_1_percentage?: number;
	warmup_set_1_reps?: number;
	warmup_set_2_percentage?: number;
	warmup_set_2_reps?: number;
	warmup_set_3_percentage?: number;
	warmup_set_3_reps?: number;
	set_1_percentage: number;
	set_1_reps: number;
	set_2_percentage: number;
	set_2_reps: number;
	set_3_percentage: number;
	set_3_reps: number; // negative means AMRAP (as many reps as possible)
	set_4_percentage?: number; // Set only applicable for "7th week"
	set_4_reps?: number;
};

export type SupplementalTemplateDb = {
	id: number;
	name: string;
	description?: string;
	sets: number;
	reps: number;
	weight_calculation: 'first_set' | 'second_set' | 'fixed_percentage' | 'custom';
	fixed_percentage?: number;
	notes?: string;
	created_at: string;
};

export type WorkoutSessionsDb = {
	id: number;
	cycle_id: number;
	lift_id: number;
	week_number_in_cycle: number;
	week_template_id: number;
	planned_date: string;
	completed_date?: string;
	status: 'planned' | 'completed' | 'skipped';
	notes?: string;
	created_at: string;
};

export type MainWorkDb = {
	id: number;
	session_id: number;
	set_number: number;
	planned_weight: number;
	planned_reps: number;
	actual_weight?: number;
	actual_reps?: number | null;
	is_amrap?: boolean;
	supplemental_done: boolean;
	training_max?: number | null;
	rpe?: number;
	notes?: string;
};

export type SupplementalWorkDb = {
	id: number;
	session_id: number;
	lift_id: number; // Ususall same as main lift, but could differ
	template_id: number;
	set_number: number;
	planned_weight: number;
	planned_reps: number;
	actual_weight?: number;
	actual_reps?: number;
	notes: string;
};

export type AssistanceWorkDb = {
	id: number;
	session_id: number;
	exercise_id: number;
	sets?: number;
	reps?: number;
	weight?: number;
	notes?: string;
};

export type AssistanceExerciseDb = {
	id: number;
	name: string;
	category?: string;
	description?: string;
	created_at: string;
};
