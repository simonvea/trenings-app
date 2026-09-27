import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	describe('given one training block', () => {
		it('when rendered, then it shows the heading and links to the block', async () => {
			// Arrange
			const data = { blocks: [{ id: 1, name: 'Triumvirate' }] };

			// Act
			render(Page, { data, params: {}, form: undefined });

			// Assert
			await expect.element(page.getByRole('heading', { level: 1 })).toBeInTheDocument();
			await expect
				.element(page.getByRole('link', { name: 'Triumvirate' }))
				.toHaveAttribute('href', '/blocks/1');
		});
	});
});
