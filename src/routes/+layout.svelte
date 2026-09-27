<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children }: LayoutProps = $props();
	let menuOpen = $state(false);
	const today = new Date().toJSON().slice(0, 10);

	const appTitle = page.data.title;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header class="header">
		<button class="hamburger" onclick={toggleMenu} aria-label="Menu">
			<span class:open={menuOpen}></span>
			<span class:open={menuOpen}></span>
			<span class:open={menuOpen}></span>
		</button>
		<div class="header-spacer"></div>
		<h1 class="app-title">{appTitle}</h1>
	</header>

	<aside class="sidebar" class:open={menuOpen}>
		<nav class="nav">
			<a href={resolve('/')} onclick={closeMenu}>Hjem</a>
			<a href={resolve('/sessions/[date]', { date: today })} onclick={closeMenu}>Dagens økt</a>
			<a href={resolve('/admin')} onclick={closeMenu}>Admin</a>
			<form method="POST" action={resolve('/logout')}>
				<button type="submit">Logg ut</button>
			</form>
		</nav>
	</aside>

	<!-- Overlay -->
	{#if menuOpen}
		<div class="overlay" onclick={closeMenu} onkeydown={closeMenu} role="button" tabindex="0"></div>
	{/if}

	<main class="main">
		{@render children?.()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		overflow-x: hidden;
	}

	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
		background: #f5f5f5;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		padding: 0 1rem;
		height: 56px;
		background: #2563eb;
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		position: relative;
		z-index: 100;
	}

	.app-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.header-spacer {
		width: 40px;
	}

	/* Hamburger */
	.hamburger {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		width: 40px;
		height: 40px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 5px;
	}

	.hamburger span {
		display: block;
		width: 24px;
		height: 2px;
		background: white;
		transition: all 0.3s ease;
		border-radius: 2px;
	}

	.hamburger span:nth-child(1).open {
		transform: translateY(7px) rotate(45deg);
	}

	.hamburger span:nth-child(2).open {
		opacity: 0;
	}

	.hamburger span:nth-child(3).open {
		transform: translateY(-7px) rotate(-45deg);
	}

	/* Sidebar */
	.sidebar {
		position: fixed;
		top: 56px;
		left: -280px;
		width: 280px;
		height: calc(100vh - 56px);
		height: calc(100dvh - 56px);
		background: white;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
		transition: left 0.3s ease;
		z-index: 99;
		overflow-y: auto;
	}

	.sidebar.open {
		left: 0;
	}

	.nav {
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
	}

	.nav a {
		padding: 1rem 1.5rem;
		color: #333;
		text-decoration: none;
		transition: background 0.2s ease;
		border-left: 3px solid transparent;
	}

	.nav button {
		width: 100%;
		padding: 1rem 1.5rem;
		background: none;
		border: none;
		border-left: 3px solid transparent;
		color: #333;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.nav button:hover,
	.nav a:hover {
		background: #f0f0f0;
	}

	.nav a:active {
		background: #e0e0e0;
	}

	.nav a:focus {
		outline: 2px solid #2563eb;
		outline-offset: -2px;
	}

	/* Overlay */
	.overlay {
		position: fixed;
		top: 56px;
		left: 0;
		right: 0;
		bottom: 60px;
		background: rgba(0, 0, 0, 0.5);
		z-index: 98;
		cursor: pointer;
	}

	/* Main Content */
	.main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem;
		-webkit-overflow-scrolling: touch;
	}

	/* Footer */
	.footer {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		height: 60px;
		background: white;
		border-top: 1px solid #e0e0e0;
		box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
	}

	.footer-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: none;
		border: 1px solid #d0d0d0;
		border-radius: 8px;
		color: #333;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.footer-btn:hover {
		background: #f5f5f5;
		border-color: #2563eb;
		color: #2563eb;
	}

	.footer-btn:active {
		transform: scale(0.95);
		background: #e8e8e8;
	}

	/* PWA Safe Areas */
	@supports (padding: max(0px)) {
		.header {
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
		}

		.main {
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
		}

		.footer {
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
			padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
		}
	}
</style>
