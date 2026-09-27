import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { today } from '$lib/date';
import Page from './+page.svelte';

const activeBlock = {
	id: 1,
	name: 'Triumvirate',
	start_date: '2026-09-21',
	completed_date: undefined,
	end_date: '2026-11-08',
	template_name: 'Triumvirate',
	sessions_total: 28,
	sessions_completed: 7
};

describe('/+page.svelte', () => {
	describe('given an active block and a session planned today', () => {
		it('when rendered, then it links to the block and offers to start today’s session', async () => {
			// Arrange
			const data = {
				blocks: [activeBlock],
				upcoming: [
					{
						id: 5,
						planned_date: today(),
						status: 'planned' as const,
						liftName: 'Knebøy' as const,
						weekName: '5+',
						topSet: { reps: 5, weight: 102.5, isAmrap: true }
					}
				]
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			await expect.element(page.getByRole('heading', { level: 1 })).toBeInTheDocument();
			await expect.element(page.getByText('Start økt')).toBeInTheDocument();
			await expect
				.element(page.getByRole('link', { name: /Triumvirate/ }))
				.toHaveAttribute('href', '/blocks/1');
		});
	});

	describe('given no session planned today', () => {
		it('when rendered, then today is shown as a rest day', async () => {
			// Arrange
			const data = { blocks: [activeBlock], upcoming: [] };

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			await expect.element(page.getByText('Hviledag')).toBeInTheDocument();
		});
	});
});
