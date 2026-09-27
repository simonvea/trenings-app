<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { addDays, formatDayHeading } from '$lib/date';
	import { formatKg } from '$lib/format';
	import { translateCycleType } from '$lib/helpers';
	import type { PageProps } from './$types';
	import SessionForm from './session-form.svelte';
	import SessionSummary from './session-summary.svelte';

	let { data, params }: PageProps = $props();

	const session = $derived(data.session);
	const mainLift = $derived(data.mainLift);

	onMount(() => {
		let lock: WakeLockSentinel | undefined;
		navigator.wakeLock
			?.request('screen')
			.then((l) => (lock = l))
			.catch((e: Error) => console.error('unable to lock screen', e.message));
		return () => lock?.release();
	});
</script>

<nav class="day-nav" aria-label="Velg dag">
	<a
		class="step"
		href={resolve('/sessions/[date]', { date: addDays(params.date, -1) })}
		aria-label="Forrige dag"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6z" /></svg
		>
	</a>
	<div class="day">
		<span class="date">{formatDayHeading(params.date)}</span>
		{#if session}
			<span class="muted">
				{translateCycleType(session.cycle_type)}
				{session.cycle_number_in_block} · uke {session.week_number_in_cycle} · {session.weekName}
			</span>
		{/if}
	</div>
	<a
		class="step"
		href={resolve('/sessions/[date]', { date: addDays(params.date, 1) })}
		aria-label="Neste dag"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" /></svg
		>
	</a>
</nav>

{#if !session || !mainLift || !data.exercises || !data.plannedAssistance}
	<div class="card empty">
		<p>Ingen økt denne dagen.</p>
		<p class="muted">Hviledag – eller bla til neste treningsdag.</p>
	</div>
{:else}
	<header class="lift">
		<h1>{mainLift.name}</h1>
		<span class="muted num">TM {formatKg(session.current_training_max)}</span>
	</header>

	{#if data.history}
		<SessionSummary
			{mainLift}
			completedDate={session.session_completed_date ?? undefined}
			notes={session.session_notes}
			mainWork={data.history.mainWork}
			assistanceWork={data.history.assistanceWork}
		/>
	{:else}
		{#key session.session_id}
			<SessionForm
				sessionId={session.session_id}
				trainingMax={session.current_training_max}
				{mainLift}
				exercises={data.exercises}
				plannedAssistance={data.plannedAssistance}
			/>
		{/key}
	{/if}
{/if}

<style>
	.day-nav {
		display: grid;
		grid-template-columns: var(--tap) 1fr var(--tap);
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.step {
		display: grid;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		border-radius: 50%;
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--text);
	}

	.step svg {
		width: 26px;
		height: 26px;
		fill: currentColor;
	}

	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.date {
		font-weight: 700;
		font-size: 1.05rem;
	}

	.day .muted {
		font-size: 0.875rem;
	}

	.lift {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin: 0.5rem 0.25rem 1rem;
	}

	.lift h1 {
		font-size: 2rem;
		font-weight: 800;
	}

	.empty {
		padding: 1.5rem 1rem;
		text-align: center;
	}

	.empty p {
		margin: 0.25rem 0;
	}
</style>
