import { page } from '@vitest/browser/context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { DayPlan, DayPlanEntry } from '$lib/dayPlan/types';
import Page from './+page.svelte';

const monday: DayPlanEntry[] = [
	{ start: '06:10', end: '06:25', kind: 'dog', label: 'Morgentur med hunden' },
	{ start: '08:00', end: '09:00', kind: 'training', label: 'Knebøy', note: 'Inkludert dusj' },
	{ start: '09:00', end: '11:30', kind: 'work', label: 'Jobb på kontoret' }
];

const plan: DayPlan = {
	monday,
	tuesday: [],
	wednesday: [],
	thursday: [],
	friday: [],
	saturday: [],
	sunday: []
};

describe('/day/+page.svelte', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('given it is Monday at 08:15 and squats are planned 08:00–09:00', () => {
		beforeEach(() => {
			vi.setSystemTime(new Date(2026, 8, 28, 8, 15));
		});

		it('when rendered, then squats are shown as now with the time left and work as next', async () => {
			// Arrange
			const data = { title: 'Dagsplan', plan, sessions: [] };

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			const now = page.getByRole('region', { name: /Nå/ });
			await expect.element(now.getByText('Knebøy')).toBeInTheDocument();
			await expect.element(now.getByText('45 min igjen')).toBeInTheDocument();
			await expect.element(now.getByText(/Neste:/)).toHaveTextContent('Jobb på kontoret');
		});

		it('when a squat session is planned that day, then the now card and the squat entry link to it', async () => {
			// Arrange
			const data = {
				title: 'Dagsplan',
				plan,
				sessions: [{ date: '2026-09-28', liftName: 'Knebøy' as const }]
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			const now = page.getByRole('region', { name: /Nå/ });
			await expect
				.element(now.getByRole('link', { name: 'Åpne økt' }))
				.toHaveAttribute('href', '/sessions/2026-09-28');
			await expect
				.element(page.getByRole('link', { name: 'Åpne økt · Knebøy' }))
				.toHaveAttribute('href', '/sessions/2026-09-28');
			await expect.element(page.getByText(/Planlagt økt/)).not.toBeInTheDocument();
		});

		it('when a deadlift session is planned that day, then it gets its own card instead of an entry link', async () => {
			// Arrange
			const data = {
				title: 'Dagsplan',
				plan,
				sessions: [{ date: '2026-09-28', liftName: 'Markløft' as const }]
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			await expect
				.element(page.getByRole('link', { name: /Planlagt økt: Markløft/ }))
				.toHaveAttribute('href', '/sessions/2026-09-28');
			const now = page.getByRole('region', { name: /Nå/ });
			await expect.element(now.getByRole('link', { name: 'Åpne økt' })).not.toBeInTheDocument();
		});
	});

	describe('given it is Sunday evening', () => {
		it('when Monday is picked, then tomorrow’s plan is shown without a now card', async () => {
			// Arrange
			vi.setSystemTime(new Date(2026, 9, 4, 21, 0));
			const data = { title: 'Dagsplan', plan, sessions: [] };

			// Act
			render(Page, { data, params: { weekday: 'monday' as const }, form: undefined });

			// Assert
			await expect.element(page.getByText('I morgen')).toBeInTheDocument();
			await expect
				.element(page.getByRole('heading', { name: 'Mandag 5. oktober' }))
				.toBeInTheDocument();
			await expect.element(page.getByRole('region', { name: /Nå/ })).not.toBeInTheDocument();
		});
	});
});
