import { normalizeWeight } from './core';
import type { SupplementalTemplateDb } from './types';

type Template = {
	weightCalculation: SupplementalTemplateDb['weight_calculation'];
	fixedPercentage?: number | null;
};

type Week = { trainingMax: number; set1Percentage: number; set2Percentage: number };

// Undefined when the template has no rule for the weight ('custom' is not defined yet)
export const supplementalWeight = (
	{ weightCalculation, fixedPercentage }: Template,
	{ trainingMax, set1Percentage, set2Percentage }: Week
): number | undefined => {
	switch (weightCalculation) {
		case 'first_set':
			return normalizeWeight(trainingMax * set1Percentage);
		case 'second_set':
			return normalizeWeight(trainingMax * set2Percentage);
		case 'fixed_percentage':
			return fixedPercentage == null ? undefined : normalizeWeight(trainingMax * fixedPercentage);
		case 'custom':
			return undefined;
	}
};
