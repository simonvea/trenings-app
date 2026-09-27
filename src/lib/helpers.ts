import type { MainLifts } from './types';

const liftTranslations: Record<string, MainLifts> = {
	Squat: 'Knebøy',
	Deadlift: 'Markløft',
	'Overhead Press': 'Skulderpress',
	'Bench Press': 'Benkpress'
};

export function translateLiftName(lift: string): MainLifts {
	if (!(lift in liftTranslations)) throw new Error('Unknown lift name!');
	return liftTranslations[lift];
}

const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const dayTranslations: Record<string, string> = {
	monday: 'Mandag',
	tuesday: 'Tirsdag',
	wednesday: 'Onsdag',
	thursday: 'Torsdag',
	friday: 'Fredag',
	saturday: 'Lørdag',
	sunday: 'Søndag'
};
export function translateDay(day: string): string {
	const d = day.toLowerCase();
	if (!(d in dayTranslations)) throw new Error('Unknown day!');
	return dayTranslations[d];
}

const cycleTypeTranslations: Record<string, string> = {
	leader: 'Leder',
	anchor: 'Anker',
	'7th week': 'Mellomuke'
};

export function translateCycleType(cycleType: string) {
	const c = cycleType.toLowerCase();
	if (!(c in cycleTypeTranslations)) throw new Error('Unknown cycle type!');
	return cycleTypeTranslations[c]! as 'Leder' | 'Anker' | 'Mellomuke';
}
