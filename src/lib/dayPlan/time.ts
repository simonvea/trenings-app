import { addDays, parseIsoDate } from '$lib/date';
import { weekdays, type Weekday } from '$lib/planning/types';

const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isClockTime = (value: string): boolean => CLOCK_TIME.test(value);

export const toMinutes = (time: string): number => {
	if (!isClockTime(time)) throw new Error(`Not a clock time (HH:MM): ${time}`);
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
};

export const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export const formatDuration = (minutes: number): string => {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} min`;
	return rest === 0 ? `${hours} t` : `${hours} t ${rest} min`;
};

// Date.getDay() counts from Sunday; the app's weeks start on Monday
export const weekdayOf = (iso: string): Weekday => weekdays[(parseIsoDate(iso).getDay() + 6) % 7];

export const datesOfWeek = (iso: string): Record<Weekday, string> => {
	const monday = addDays(iso, -weekdays.indexOf(weekdayOf(iso)));
	return Object.fromEntries(weekdays.map((day, i) => [day, addDays(monday, i)])) as Record<
		Weekday,
		string
	>;
};
