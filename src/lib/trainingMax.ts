import type { TrainingMax } from '$lib/types';

const trainingMax: TrainingMax = {
	Knebøy: 61.2,
	Benkpress: 55.8,
	Markløft: 88.2,
	Skulderpress: 31.5,
	updatedAt: new Date('2025-10-12')
};

export const getTrainingMax = () => trainingMax;

const canUpdateTM = (oldTM: TrainingMax) => {
	const minimumDaysSinceUpdate = 19;
	const today = new Date();
	const lastUpdated = oldTM.updatedAt;
	const daysDifference = (today.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24);

	return daysDifference > minimumDaysSinceUpdate;
};

export const calculateTM = (oldTM: TrainingMax): TrainingMax => {
	const upperBodyIncrement = 2.5;
	const lowerBodyIncrement = 5;
	if (!canUpdateTM(oldTM)) throw new Error('Too early to update TM!!');

	return {
		Knebøy: (oldTM.Knebøy += lowerBodyIncrement),
		Benkpress: (oldTM.Benkpress += upperBodyIncrement),
		Markløft: (oldTM.Markløft += lowerBodyIncrement),
		Skulderpress: (oldTM.Skulderpress += upperBodyIncrement),
		updatedAt: new Date()
	};
};
