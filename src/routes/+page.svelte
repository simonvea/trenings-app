<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatDayHeading, formatShortDate, formatWeekdayShort, today } from '$lib/date';
	import { formatKg } from '$lib/format';
	import type { PageProps } from './$types';
	import type { UpcomingSession } from './+page.server';

	const { data }: PageProps = $props();

	// SSR runs on the server clock; correct to the phone's calendar day once hydrated
	let todayDate = $state(today());
	onMount(() => (todayDate = today()));

	const todaySession = $derived(data.upcoming.find((s) => s.planned_date === todayDate));
	const later = $derived(data.upcoming.filter((s) => s.planned_date > todayDate).slice(0, 4));
	const activeBlock = $derived(data.blocks.find((b) => !b.completed_date));
	const finishedBlocks = $derived(data.blocks.filter((b) => b.completed_date));

	const percent = (done: number, total: number): number =>
		total ? Math.round((done / total) * 100) : 0;
</script>

{#snippet topSet(session: UpcomingSession)}
	{session.topSet.reps}{session.topSet.isAmrap ? '+' : ''} × {formatKg(session.topSet.weight)}
{/snippet}

<h1 class="date">{formatDayHeading(todayDate)}</h1>

<a class="card today" href={resolve('/sessions/[date]', { date: todayDate })}>
	{#if todaySession}
		<span class="eyebrow">Dagens økt · {todaySession.weekName}</span>
		<span class="lift">{todaySession.liftName}</span>
		<span class="muted num">Toppsett {@render topSet(todaySession)}</span>
		{#if todaySession.status === 'completed'}
			<span class="status done">Fullført</span>
		{:else}
			<span class="btn">Start økt</span>
		{/if}
	{:else}
		<span class="eyebrow">I dag</span>
		<span class="lift">Hviledag</span>
		{#if later[0]}
			<span class="muted">
				Neste: {later[0].liftName}, {formatDayHeading(later[0].planned_date).toLowerCase()}
			</span>
		{/if}
	{/if}
</a>

{#if later.length > 0}
	<section>
		<h2>Kommende økter</h2>
		<ul class="card list">
			{#each later as session (session.id)}
				<li>
					<a href={resolve('/sessions/[date]', { date: session.planned_date })}>
						<span class="when">
							<span class="weekday">{formatWeekdayShort(session.planned_date)}</span>
							<span class="muted">{formatShortDate(session.planned_date)}</span>
						</span>
						<span class="what">
							<strong>{session.liftName}</strong>
							<span class="muted num">{@render topSet(session)}</span>
						</span>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" />
						</svg>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section>
	<h2>Blokker</h2>
	{#if activeBlock}
		<a class="card block" href={resolve('/blocks/[id]', { id: String(activeBlock.id) })}>
			<span class="block-name">{activeBlock.name}</span>
			<span class="muted num">
				{activeBlock.sessions_completed} av {activeBlock.sessions_total} økter
				{#if activeBlock.end_date}· slutter {formatShortDate(activeBlock.end_date)}{/if}
			</span>
			<span
				class="progress"
				role="progressbar"
				aria-label="Fremdrift i blokka"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent(activeBlock.sessions_completed, activeBlock.sessions_total)}
			>
				<span style:width="{percent(activeBlock.sessions_completed, activeBlock.sessions_total)}%"
				></span>
			</span>
		</a>
	{:else}
		<p class="card empty">
			Ingen aktiv blokk. <a href={resolve('/admin/blocks/new')}>Planlegg en ny</a>.
		</p>
	{/if}
	{#if finishedBlocks.length > 0}
		<ul class="card list">
			{#each finishedBlocks as block (block.id)}
				<li>
					<a href={resolve('/blocks/[id]', { id: String(block.id) })}>
						<span class="what"><strong>{block.name}</strong></span>
						<span class="muted">Fullført</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.date {
		margin: 0.25rem 0.25rem 1rem;
		font-size: 1.6rem;
		font-weight: 800;
	}

	.today {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 1.1rem;
		color: inherit;
		text-decoration: none;
	}

	.eyebrow,
	h2 {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.lift {
		font-size: 1.9rem;
		font-weight: 800;
	}

	.today .btn {
		align-self: stretch;
		margin-top: 0.75rem;
		min-height: 52px;
		font-size: 1.1rem;
	}

	.status.done {
		margin-top: 0.5rem;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		background: var(--success-soft);
		color: var(--success);
		font-weight: 700;
	}

	section {
		margin-top: 1.75rem;
	}

	h2 {
		margin: 0 0.25rem 0.5rem;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: hidden;
	}

	.list li + li {
		border-top: 1px solid var(--border);
	}

	.list a {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		min-height: 60px;
		padding: 0.6rem 1rem;
		color: inherit;
		text-decoration: none;
	}

	.list a:active {
		background: var(--surface-2);
	}

	.when {
		display: flex;
		flex-direction: column;
		width: 3.75rem;
		flex-shrink: 0;
		font-size: 0.85rem;
		line-height: 1.25;
	}

	.weekday {
		font-size: 1rem;
		font-weight: 700;
		text-transform: capitalize;
	}

	.what {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	.what .muted {
		font-size: 0.9rem;
	}

	.list svg {
		width: 22px;
		height: 22px;
		fill: var(--text-muted);
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 0.75rem;
		padding: 1rem;
		color: inherit;
		text-decoration: none;
	}

	.block-name {
		font-size: 1.15rem;
		font-weight: 700;
	}

	.progress {
		height: 8px;
		margin-top: 0.4rem;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}

	.progress span {
		display: block;
		height: 100%;
		background: var(--accent);
	}

	.empty {
		padding: 1rem;
		margin: 0 0 0.75rem;
	}
</style>
