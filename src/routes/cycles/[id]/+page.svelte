<script lang="ts">
	import { resolve } from '$app/paths';
	import { normalizeWeight } from '$lib/core';
	import { formatShortDate, formatWeekdayShort } from '$lib/date';
	import { formatKg } from '$lib/format';
	import { translateCycleType, translateLiftName } from '$lib/helpers';
	import { supplementalWeight } from '$lib/supplemental';
	import type { PageProps } from './$types';
	import type { Session } from './+page.server';

	const { data }: PageProps = $props();

	const cycle = $derived(data.cycle);
	const hasSupplemental = $derived(!!cycle.supplemental_template_id && cycle.sets > 0);

	const weeks = $derived(
		[...new Set(data.sessions.map((s) => s.week_number_in_cycle))].map(
			(week) => [week, data.sessions.filter((s) => s.week_number_in_cycle === week)] as const
		)
	);

	type PlannedSet = { reps: number; percentage: number };
	const setsOf = (session: Session): PlannedSet[] =>
		[
			{ reps: session.set_1_reps, percentage: session.set_1_percentage },
			{ reps: session.set_2_reps, percentage: session.set_2_percentage },
			{ reps: session.set_3_reps, percentage: session.set_3_percentage },
			{ reps: session.set_4_reps, percentage: session.set_4_percentage }
		].filter((set): set is PlannedSet => set.reps != null && set.percentage != null);

	const repsLabel = (reps: number): string => (reps < 0 ? `${Math.abs(reps)}+` : String(reps));

	const supplementalLabel = (session: Session): string => {
		const weight = supplementalWeight(
			{ weightCalculation: cycle.weight_calculation, fixedPercentage: cycle.fixed_percentage },
			{
				trainingMax: session.current_training_max,
				set1Percentage: session.set_1_percentage,
				set2Percentage: session.set_2_percentage
			}
		);
		return weight === undefined ? '–' : formatKg(weight);
	};
</script>

<header class="intro">
	<p class="muted">
		{cycle.block_name} · {translateCycleType(cycle.cycle_type)}{cycle.template_name
			? ` · ${cycle.template_name}`
			: ''}
	</p>
</header>

{#each weeks as [weekNumber, sessions] (weekNumber)}
	<section>
		<h2 class="section-title">Uke {weekNumber}{sessions[0] ? ` · ${sessions[0].name}` : ''}</h2>
		<div class="sessions">
			{#each sessions as session (session.session_id)}
				<a
					class="card session"
					class:done={session.status === 'completed'}
					href={resolve('/sessions/[date]', { date: session.planned_date })}
				>
					<span class="head">
						<strong>{translateLiftName(session.lift_name)}</strong>
						<span class="muted">
							<span class="weekday">{formatWeekdayShort(session.planned_date)}</span>
							{formatShortDate(session.planned_date)}
						</span>
					</span>
					<ul class="num">
						{#each setsOf(session) as set, index (index)}
							<li>
								<span>{repsLabel(set.reps)} ×</span>
								<span
									>{formatKg(normalizeWeight(set.percentage * session.current_training_max))}</span
								>
							</li>
						{/each}
						{#if hasSupplemental}
							<li class="supplemental">
								<span>{cycle.template_name} {cycle.sets}×{cycle.reps}</span>
								<span>{supplementalLabel(session)}</span>
							</li>
						{/if}
					</ul>
					{#if session.status === 'completed'}
						<span class="status">Fullført</span>
					{/if}
				</a>
			{/each}
		</div>
	</section>
{/each}

<style>
	.intro p {
		margin: 0 0.25rem;
	}

	section {
		margin-top: 1.5rem;
	}

	.sessions {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
		gap: 0.6rem;
	}

	.session {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.8rem 1rem;
		color: inherit;
		text-decoration: none;
	}

	.session.done {
		border-color: var(--success);
	}

	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.head strong {
		font-size: 1.1rem;
	}

	.weekday {
		text-transform: capitalize;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		justify-content: space-between;
		padding: 0.15rem 0;
	}

	li span:last-child {
		font-weight: 600;
	}

	.supplemental {
		margin-top: 0.3rem;
		padding-top: 0.4rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
	}

	.status {
		align-self: flex-start;
		padding: 0.1rem 0.6rem;
		border-radius: 999px;
		background: var(--success-soft);
		color: var(--success);
		font-size: 0.8rem;
		font-weight: 700;
	}
</style>
