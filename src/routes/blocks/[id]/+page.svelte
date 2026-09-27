<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '$lib/date';
	import { translateCycleType, translateDay, translateLiftName } from '$lib/helpers';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const block = $derived(data.block);
	const liftName = (id: number | undefined): string =>
		translateLiftName(data.lifts.find((l) => l.id === id)?.name ?? '');

	const trainingDays = $derived(
		[
			{ day: block.training_day_1, liftId: block.lift_day_1_id },
			{ day: block.training_day_2, liftId: block.lift_day_2_id },
			{ day: block.training_day_3, liftId: block.lift_day_3_id },
			{ day: block.training_day_4, liftId: block.lift_day_4_id }
		].filter((d): d is { day: string; liftId: number } => !!d.day && !!d.liftId)
	);

	const currentCycleId = $derived(
		data.cycles.find((c) => c.sessions_completed < c.sessions_total)?.id
	);
	const startDate = $derived(data.cycles[0]?.start_date);
	const endDate = $derived(data.cycles.at(-1)?.end_date);
</script>

<header class="intro">
	{#if startDate && endDate}
		<p class="muted num">{formatShortDate(startDate)} – {formatShortDate(endDate)}</p>
	{/if}
	{#if block.completed_date}
		<p class="badge">Fullført {formatShortDate(block.completed_date)}</p>
	{/if}
	{#if block.goals}
		<p class="goals">{block.goals}</p>
	{/if}
</header>

<section>
	<h2>Treningsdager</h2>
	<ul class="days">
		{#each trainingDays as { day, liftId } (day)}
			<li class="card">
				<span class="muted">{translateDay(day)}</span>
				<strong>{liftName(liftId)}</strong>
			</li>
		{/each}
	</ul>
</section>

<section>
	<h2>Sykluser</h2>
	<ol class="card cycles">
		{#each data.cycles as cycle (cycle.id)}
			<li>
				<a href={resolve('/cycles/[id]', { id: String(cycle.id) })}>
					<span class="number num">{cycle.cycle_number_in_block}</span>
					<span class="what">
						<strong>
							{translateCycleType(cycle.cycle_type)} · {cycle.supplemental_name ??
								cycle.seventh_week_name}
						</strong>
						<span class="muted num">
							{formatShortDate(cycle.start_date)}{cycle.end_date
								? ` – ${formatShortDate(cycle.end_date)}`
								: ''} · {cycle.sessions_completed}/{cycle.sessions_total} økter
						</span>
					</span>
					{#if cycle.sessions_total > 0 && cycle.sessions_completed === cycle.sessions_total}
						<span class="status done">Ferdig</span>
					{:else if cycle.id === currentCycleId}
						<span class="status current">Pågår</span>
					{/if}
				</a>
			</li>
		{/each}
	</ol>
</section>

<style>
	.intro p {
		margin: 0 0.25rem 0.5rem;
	}

	.goals {
		white-space: pre-wrap;
	}

	.badge {
		display: inline-block;
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
		background: var(--success-soft);
		color: var(--success);
		font-weight: 700;
	}

	section {
		margin-top: 1.5rem;
	}

	h2 {
		margin: 0 0.25rem 0.5rem;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.days {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.days li {
		display: flex;
		flex-direction: column;
		padding: 0.75rem 1rem;
	}

	.cycles {
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: hidden;
	}

	.cycles li + li {
		border-top: 1px solid var(--border);
	}

	.cycles a {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		min-height: 64px;
		padding: 0.7rem 1rem;
		color: inherit;
		text-decoration: none;
	}

	.cycles a:active {
		background: var(--surface-2);
	}

	.number {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--surface-2);
		font-weight: 700;
	}

	.what {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	.what .muted {
		font-size: 0.9rem;
	}

	.status {
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 700;
	}

	.status.done {
		background: var(--success-soft);
		color: var(--success);
	}

	.status.current {
		background: var(--accent-soft);
		color: var(--accent);
	}
</style>
