<script lang="ts">
	import { formatDayHeading } from '$lib/date';
	import { formatKg, formatSupplemental } from '$lib/format';
	import type { AssistanceExerciseDb, AssistanceWorkDb, MainLift, MainWorkDb } from '$lib/types';

	type Props = {
		mainLift: MainLift;
		completedDate: string | undefined;
		notes: string | null;
		mainWork: MainWorkDb[];
		assistanceWork: (AssistanceWorkDb & Pick<AssistanceExerciseDb, 'name'>)[];
	};

	const { mainLift, completedDate, notes, mainWork, assistanceWork }: Props = $props();

	const supplementalDone = $derived(mainWork.some((w) => w.supplemental_done));
</script>

<section class="card summary">
	<p class="done-banner">
		Fullført{completedDate ? ` ${formatDayHeading(completedDate).toLowerCase()}` : ''}
	</p>

	<h2 class="section-title">Arbeidssett</h2>
	<ul>
		{#each mainWork as work (work.id)}
			<li class="num">
				<span>
					{work.planned_reps}{work.is_amrap ? '+' : ''} × {formatKg(work.planned_weight)}
				</span>
				<strong>{work.actual_reps} reps</strong>
			</li>
		{/each}
	</ul>

	{#if mainLift.supplemental.sets > 0}
		<h2 class="section-title">{mainLift.supplemental.name}</h2>
		<ul>
			<li class="num">
				<span>
					{formatSupplemental(mainLift.supplemental)}
				</span>
				<strong class:missed={!supplementalDone}>
					{supplementalDone ? 'Fullført' : 'Ikke fullført'}
				</strong>
			</li>
		</ul>
	{/if}

	{#if assistanceWork.length > 0}
		<h2 class="section-title">Assistanse</h2>
		<ul>
			{#each assistanceWork as work (work.id)}
				<li class="num">
					<span>{work.name}</span>
					<strong>
						{work.sets} sett · {work.reps} reps{work.weight ? ` @ ${formatKg(work.weight)}` : ''}
					</strong>
				</li>
			{/each}
		</ul>
	{/if}

	{#if notes}
		<h2 class="section-title">Kommentar</h2>
		<p class="notes">{notes}</p>
	{/if}
</section>

<style>
	h2 {
		margin: 1.25rem 0 0.4rem;
	}

	.summary {
		padding: 1rem;
	}

	.done-banner {
		margin: 0 0 0.5rem;
		padding: 0.6rem 0.8rem;
		border-radius: var(--radius-sm);
		background: var(--success-soft);
		color: var(--success);
		font-weight: 700;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--border);
	}

	li:last-child {
		border-bottom: 0;
	}

	strong {
		text-align: right;
	}

	.missed {
		color: var(--text-muted);
		font-weight: 600;
	}

	.notes {
		margin: 0;
		white-space: pre-wrap;
	}
</style>
