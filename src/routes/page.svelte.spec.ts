import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { addDays, formatDayHeading, today } from '$lib/date';
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
			const todayDate = today();
			const data = {
				blocks: [activeBlock],
				upcoming: [
					{
						id: 5,
						planned_date: todayDate,
						status: 'planned' as const,
						liftName: 'Knebøy' as const,
						weekName: '5+',
						isSeventhWeek: false,
						topSet: { reps: 5, weight: 102.5, isAmrap: true }
					}
				]
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			await expect
				.element(page.getByRole('heading', { name: formatDayHeading(todayDate) }))
				.toBeInTheDocument();
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

	describe('given no active block', () => {
		it('when rendered, then testing the training max is offered before the block list', async () => {
			// Arrange
			const data = { blocks: [], upcoming: [] };

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			const testLink = page.getByRole('link', { name: /Test training max/ });
			await expect.element(testLink).toHaveAttribute('href', '/tm-tests');
			const blocksHeading = page.getByRole('heading', { name: 'Blokker' });
			expect(
				testLink.element().compareDocumentPosition(blocksHeading.element()) &
					Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		});
	});

	describe('given an active block whose next session is in the 7th week', () => {
		it('when rendered, then testing the training max is offered before the upcoming sessions', async () => {
			// Arrange
			const data = {
				blocks: [activeBlock],
				upcoming: [
					{
						id: 9,
						planned_date: addDays(today(), 1),
						status: 'planned' as const,
						liftName: 'Benkpress' as const,
						weekName: 'TM-test',
						isSeventhWeek: true,
						topSet: { reps: 5, weight: 90, isAmrap: false }
					}
				]
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			const testLink = page.getByRole('link', { name: /Test training max/ });
			const upcomingHeading = page.getByRole('heading', { name: 'Kommende økter' });
			await expect.element(testLink).toBeInTheDocument();
			expect(
				testLink.element().compareDocumentPosition(upcomingHeading.element()) &
					Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		});
	});

	describe('given an active block that ended yesterday but is not marked complete', () => {
		it('when rendered, then testing the training max is offered before the block list', async () => {
			// Arrange
			const data = {
				blocks: [{ ...activeBlock, end_date: addDays(today(), -1) }],
				upcoming: []
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			const testLink = page.getByRole('link', { name: /Test training max/ });
			const blocksHeading = page.getByRole('heading', { name: 'Blokker' });
			await expect.element(testLink).toBeInTheDocument();
			expect(
				testLink.element().compareDocumentPosition(blocksHeading.element()) &
					Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		});
	});

	describe('given a rest day and a later session that is already completed', () => {
		it('when rendered, then "Neste" points at the next planned session', async () => {
			// Arrange
			const todayDate = today();
			const session = {
				planned_date: addDays(todayDate, 1),
				liftName: 'Knebøy' as const,
				weekName: '5+',
				isSeventhWeek: false,
				topSet: { reps: 5, weight: 100, isAmrap: true }
			};
			const data = {
				blocks: [activeBlock],
				upcoming: [
					{ ...session, id: 1, status: 'completed' as const, liftName: 'Benkpress' as const },
					{ ...session, id: 2, status: 'planned' as const, planned_date: addDays(todayDate, 2) }
				]
			};

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			await expect.element(page.getByText(/Neste: Knebøy/)).toBeInTheDocument();
		});
	});
});
