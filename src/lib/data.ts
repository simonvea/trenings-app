import type {
	Plan,
	SupplementalTemplate,
	Fractions,
	MainLifts,
	MainLift,
	Structure,
	Days,
	TrainingMax,
	Week
} from '$lib/types';

export const plan: Plan = [
	{
		plan: 'Leder',
		template: 'FSL',
		focus: 'Volum',
		done: false,
		structure: '5/3/1'
	}
];

export const getCurrentCycle = () => plan[0];

const normalizeWeight = (weight: number): number => Math.ceil(weight / 2.5) * 2.5;
const FSLTemplate: SupplementalTemplate = {
	name: 'FSL',
	reps: 5,
	sets: 5,
	weightFunction: (mainFractions, trainingMax) =>
		normalizeWeight(mainFractions[0].fraction * trainingMax)
};

// Fractions in order of first set to last
const warmupFractions: Fractions = [
	{ fraction: 0.4, isAmrap: false },
	{ fraction: 0.5, isAmrap: false },
	{ fraction: 0.6, isAmrap: false }
];
// Last set is always AMRAP for working sets
const fiverWeekFractions: Fractions = [
	{ fraction: 0.65, isAmrap: false },
	{ fraction: 0.75, isAmrap: false },
	{ fraction: 0.85, isAmrap: true }
];
const threesWeekFractions: Fractions = [
	{ fraction: 0.7, isAmrap: false },
	{ fraction: 0.8, isAmrap: false },
	{ fraction: 0.9, isAmrap: true }
];
const fiveThreeOneWeekFractions: Fractions = [
	{ fraction: 0.75, isAmrap: false },
	{ fraction: 0.85, isAmrap: false },
	{ fraction: 0.95, isAmrap: true }
];

export const calculateMainLift = ({
	liftName,
	warmupFractions,
	trainingMax,
	fractions,
	supplementalTemplate
}: {
	liftName: MainLifts;
	trainingMax: TrainingMax;
	warmupFractions: Fractions;
	fractions: Fractions;
	supplementalTemplate: SupplementalTemplate;
}): MainLift => {
	const tm = trainingMax[liftName];
	return {
		name: liftName,
		warmupSets: warmupFractions.map((f) => ({
			reps: 5,
			weight: normalizeWeight(f.fraction * tm),
			isAmrap: f.isAmrap
		})),
		sets: fractions.map((f) => ({
			reps: 5,
			weight: normalizeWeight(f.fraction * tm),
			isAmrap: f.isAmrap
		})),
		supplemental: {
			sets: supplementalTemplate.sets,
			reps: supplementalTemplate.reps,
			weight: supplementalTemplate.weightFunction(fractions, tm),
			name: supplementalTemplate.name
		}
	};
};

const getCyclePlan = (structure: Structure) =>
	structure == '5/3/1'
		? [fiverWeekFractions, threesWeekFractions, fiveThreeOneWeekFractions]
		: [threesWeekFractions, fiverWeekFractions, fiveThreeOneWeekFractions];

const weekStructure: Week = [
	{ day: 'Mandag', lift: 'Knebøy' },
	{ day: 'Tirsdag', lift: 'Benkpress' },
	{ day: 'Torsdag', lift: 'Skulderpress' },
	{ day: 'Fredag', lift: 'Markløft' }
];
export const getWeekStructure = () => weekStructure;
export const getPlanForWeek = ({
	structure,
	week,
	weekStructure,
	trainingMax
}: {
	structure: Structure;
	week: 1 | 2 | 3;
	weekStructure: Week;
	trainingMax: TrainingMax;
}) => {
	const weeklyPlan = getCyclePlan(structure);
	const fractions = weeklyPlan[week];
	return weekStructure.map(({ day, lift }) => {
		return {
			...calculateMainLift({
				liftName: lift,
				trainingMax: trainingMax,
				warmupFractions: warmupFractions,
				fractions,
				supplementalTemplate: FSLTemplate
			}),
			day
		};
	});
};

export const getPlanForDay = ({
	structure,
	week,
	weekStructure,
	day,
	trainingMax
}: {
	structure: Structure;
	week: 1 | 2 | 3;
	weekStructure: Week;
	trainingMax: TrainingMax;
	day: Days;
}) => {
	const weeklyPlan = getCyclePlan(structure);
	const fractions = weeklyPlan[week];
	const lift = weekStructure.find((d) => d.day == day)?.lift;
	if (!lift) throw Error('Unable to find the day!');
	return calculateMainLift({
		liftName: lift,
		trainingMax: trainingMax,
		warmupFractions: warmupFractions,
		fractions,
		supplementalTemplate: FSLTemplate
	});
};

export const getPlanForLift = ({
	structure,
	week,
	lift,
	trainingMax
}: {
	structure: Structure;
	week: 1 | 2 | 3;
	lift: MainLifts;
	trainingMax: TrainingMax;
}) => {
	const weeklyPlan = getCyclePlan(structure);
	const fractions = weeklyPlan[week];
	return calculateMainLift({
		liftName: lift,
		trainingMax: trainingMax,
		warmupFractions: warmupFractions,
		fractions,
		supplementalTemplate: FSLTemplate
	});
};
