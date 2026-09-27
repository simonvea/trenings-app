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
	const missed = $derived(
		data.upcoming.filter((s) => s.planned_date < todayDate && s.status === 'planned')
	);
	const activeBlock = $derived(data.blocks.find((b) => !b.completed_date));
	const finishedBlocks = $derived(data.blocks.filter((b) => b.completed_date));
	const nextPlanned = $derived(later.find((s) => s.status === 'planned'));
	// A block can end days before it is marked complete on the desktop
	const blockOver = $derived(
		!activeBlock || (activeBlock.end_date !== null && activeBlock.end_date < todayDate)
	);
	const testingTime = $derived(blockOver || Boolean((todaySession ?? nextPlanned)?.isSeventhWeek));

	const percent = (done: number, total: number): number =>
		total ? Math.round((done / total) * 100) : 0;
</script>

{#snippet topSet(session: UpcomingSession)}
	{session.topSet.reps}{session.topSet.isAmrap ? '+' : ''} × {formatKg(session.topSet.weight)}
{/snippet}

{#snippet trainingMaxLink()}
	<section>
		<h2 class="section-title">Training max</h2>
		<a class="card link-row" href={resolve('/tm-tests')}>
			<span class="what">
				<strong>Test training max</strong>
				<span class="muted">Registrer et tungt sett og få beregnet ny TM</span>
			</span>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" />
			</svg>
		</a>
	</section>
{/snippet}

<h2 class="date">{formatDayHeading(todayDate)}</h2>

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
		{#if nextPlanned}
			<span class="muted">
				Neste: {nextPlanned.liftName}, {formatDayHeading(nextPlanned.planned_date).toLowerCase()}
			</span>
		{/if}
	{/if}
</a>

{#snippet sessionList(title: string, sessions: UpcomingSession[])}
	<section>
		<h2 class="section-title">{title}</h2>
		<ul class="card list">
			{#each sessions as session (session.id)}
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
						{#if session.status === 'completed'}
							<span class="status done">Fullført</span>
						{/if}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" />
						</svg>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/snippet}

<!-- Testing happens between blocks and in the 7th week, often on the gym floor -->
{#if testingTime}
	{@render trainingMaxLink()}
{/if}

{#if missed.length > 0}
	{@render sessionList('Ikke gjennomført', missed)}
{/if}

{#if later.length > 0}
	{@render sessionList('Kommende økter', later)}
{/if}

<section>
	<h2 class="section-title">Blokker</h2>
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

{#if !testingTime}
	{@render trainingMaxLink()}
{/if}

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

	.eyebrow {
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

	.today .status.done {
		margin-top: 0.5rem;
	}

	.status.done {
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		background: var(--success-soft);
		color: var(--success);
		font-weight: 700;
	}

	section {
		margin-top: 1.75rem;
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

	.link-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		min-height: 60px;
		padding: 0.6rem 1rem;
		color: inherit;
		text-decoration: none;
	}

	.list svg,
	.link-row svg {
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
