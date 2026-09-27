<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import { today } from '$lib/date';

	let { children }: LayoutProps = $props();

	const title = $derived(page.data.title ?? 'Trening');
	const showNav = $derived(page.url.pathname !== '/login');
	// Re-read on every navigation so an app left open overnight links to the new day
	const todayDate = $derived.by(() => {
		void page.url;
		return today();
	});
	const current = (active: boolean): 'page' | undefined => (active ? 'page' : undefined);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{title === 'Trening' ? title : `${title} · Trening`}</title>
</svelte:head>

{#snippet navLinks(withIcons: boolean)}
	<a href={resolve('/')} aria-current={current(page.url.pathname === '/')}>
		{#if withIcons}
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
			</svg>
		{/if}
		<span>Hjem</span>
	</a>
	<a
		href={resolve('/sessions/[date]', { date: todayDate })}
		aria-current={current(page.url.pathname.startsWith('/sessions'))}
	>
		{#if withIcons}
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M2 10h2v4H2zM20 10h2v4h-2zM5 7h3v10H5zM16 7h3v10h-3zM8 11h8v2H8z" />
			</svg>
		{/if}
		<span>Økt</span>
	</a>
	<a href={resolve('/admin')} aria-current={current(page.url.pathname.startsWith('/admin'))}>
		{#if withIcons}
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zM5 9h14v11H5z"
				/>
			</svg>
		{/if}
		<span>Planlegg</span>
	</a>
{/snippet}

<header class="header">
	<div class="header-inner">
		<span class="title">{title}</span>
		{#if showNav}
			<nav class="top-nav" aria-label="Hovedmeny">{@render navLinks(false)}</nav>
		{/if}
	</div>
</header>

<main class="main" class:with-tabbar={showNav}>
	{@render children?.()}
</main>

{#if showNav}
	<nav class="tabbar" aria-label="Hovedmeny">{@render navLinks(true)}</nav>
{/if}

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--header-bg);
		color: var(--on-header);
		border-bottom: 1px solid var(--border);
		padding-top: env(safe-area-inset-top);
	}

	.header-inner {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 1100px;
		height: var(--header-height);
		margin: 0 auto;
		padding: 0 max(1rem, env(safe-area-inset-right)) 0 max(1rem, env(safe-area-inset-left));
	}

	.title {
		flex: 1;
		font-size: 1.15rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.top-nav {
		display: none;
		gap: 0.25rem;
	}

	.top-nav a {
		padding: 0.4rem 0.8rem;
		border-radius: var(--radius-sm);
		color: inherit;
		text-decoration: none;
		font-weight: 600;
		opacity: 0.85;
	}

	.top-nav a:hover,
	.top-nav a[aria-current='page'] {
		opacity: 1;
		background: rgb(255 255 255 / 0.16);
	}

	.main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1rem max(1rem, env(safe-area-inset-right)) 2rem max(1rem, env(safe-area-inset-left));
	}

	.main.with-tabbar {
		padding-bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 1.5rem);
	}

	.tabbar {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 10;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		height: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: var(--surface);
		border-top: 1px solid var(--border);
	}

	.tabbar a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.tabbar a[aria-current='page'] {
		color: var(--accent);
	}

	.tabbar svg {
		width: 24px;
		height: 24px;
		fill: currentColor;
	}

	@media (min-width: 768px) {
		.top-nav {
			display: flex;
		}

		.tabbar {
			display: none;
		}

		.main.with-tabbar {
			padding-bottom: 2rem;
		}
	}
</style>
