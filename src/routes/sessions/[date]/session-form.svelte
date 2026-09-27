<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatKg, formatSupplemental } from '$lib/format';
	import type { AssistanceExerciseDb, MainLift } from '$lib/types';
	import type { PlannedAssistance } from './+page.server';
	import AssistanceSelect from './assistance-select.svelte';

	type Props = {
		sessionId: number;
		trainingMax: number;
		mainLift: MainLift;
		exercises: AssistanceExerciseDb[];
		plannedAssistance: PlannedAssistance[];
	};

	const { sessionId, trainingMax, mainLift, exercises, plannedAssistance }: Props = $props();

	// The page keys this component on the session, so props are read once as starting state.
	const initial = () => ({ mainLift });
	const start = initial();

	const warmupSets = $state(start.mainLift.warmupSets.map((s) => ({ ...s, done: false })));
	const workSets = $state(start.mainLift.sets.map((s) => ({ ...s, done: false })));
	const supplementalDone: boolean[] = $state(
		Array.from({ length: start.mainLift.supplemental.sets }, () => false)
	);
	let amrapReps = $state('');
	let comment = $state('');
	let submitting = $state(false);

	const topSet = start.mainLift.sets[start.mainLift.sets.length - 1];

	// Epley-style estimate of reps at this weight if the training max were a true 1RM
	const suggestedAmrapReps = (weight: number, max: number): number => {
		const constant = 0.0278;
		return Math.round(-(weight / (max * constant)) + (1 + constant) / constant);
	};
	const amrapTarget = topSet.isAmrap ? suggestedAmrapReps(topSet.weight, trainingMax) : topSet.reps;

	const allSetsDone = $derived(
		[...warmupSets, ...workSets].every((s) => s.done || s.isAmrap) &&
			(!topSet.isAmrap || amrapReps !== '') &&
			supplementalDone.every(Boolean)
	);
	const totalCount = $derived(warmupSets.length + workSets.length + supplementalDone.length);
	const doneCount = $derived(
		warmupSets.filter((s) => s.done).length +
			workSets.filter((s) => (s.isAmrap ? amrapReps !== '' : s.done)).length +
			supplementalDone.filter(Boolean).length
	);
	const hasSupplemental = start.mainLift.supplemental.sets > 0;
</script>

{#snippet checkMark()}
	<svg class="check" viewBox="0 0 24 24" aria-hidden="true">
		<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
	</svg>
{/snippet}

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<input type="hidden" name="session_id" value={sessionId} />
	<fieldset>
		{#if warmupSets.length > 0}
			<section class="card group">
				<h2 class="section-title">Oppvarming</h2>
				{#each warmupSets as set, index (index)}
					<label class="set warmup" class:done={set.done}>
						<input class="visually-hidden" type="checkbox" bind:checked={set.done} />
						<span class="reps num">{set.reps}</span>
						<span class="times">×</span>
						<span class="weight num">{formatKg(set.weight)}</span>
						{@render checkMark()}
					</label>
				{/each}
			</section>
		{/if}

		<section class="card group">
			<h2 class="section-title">Arbeidssett</h2>
			{#each workSets as set, index (index)}
				{#if set.isAmrap}
					<div class="set amrap" class:done={amrapReps !== ''}>
						<span class="reps num">{set.reps}+</span>
						<span class="times">×</span>
						<span class="weight num">{formatKg(set.weight)}</span>
						<label class="amrap-input">
							<span class="visually-hidden">Antall reps på siste sett</span>
							<input
								class="num"
								type="text"
								inputmode="numeric"
								pattern="[0-9]*"
								name="top_set_actual_reps"
								placeholder={String(amrapTarget)}
								bind:value={amrapReps}
								required
							/>
						</label>
					</div>
					<p class="hint">Mål: {amrapTarget}+ reps. Skriv inn hvor mange du fikk.</p>
				{:else}
					<label class="set" class:done={set.done}>
						<input class="visually-hidden" type="checkbox" bind:checked={set.done} />
						<span class="reps num">{set.reps}</span>
						<span class="times">×</span>
						<span class="weight num">{formatKg(set.weight)}</span>
						{@render checkMark()}
					</label>
				{/if}
			{/each}
			<input type="hidden" name="top_set_number" value={workSets.length} />
			<input type="hidden" name="top_set_weight" value={topSet.weight} />
			<input type="hidden" name="top_set_reps" value={topSet.reps} />
			<input type="hidden" name="top_set_amrap" value={topSet.isAmrap} />
		</section>

		{#if hasSupplemental}
			<section class="card group">
				<h2 class="section-title">
					{mainLift.supplemental.name}
					<span class="muted num">
						{formatSupplemental(mainLift.supplemental)}
					</span>
				</h2>
				<div class="pills">
					{#each supplementalDone, index (index)}
						<label class="pill num" class:done={supplementalDone[index]}>
							<input
								class="visually-hidden"
								type="checkbox"
								bind:checked={supplementalDone[index]}
							/>
							<span class="visually-hidden">Sett</span>
							{index + 1}
						</label>
					{/each}
				</div>
			</section>
		{/if}
		<input type="hidden" name="supplemental_sets_done" value={supplementalDone.every(Boolean)} />

		{#if plannedAssistance.length > 0}
			<section class="card group">
				<h2 class="section-title">Assistanse</h2>
				{#each plannedAssistance as planned, index (index)}
					{@const slot = `assistance-${index + 1}`}
					<div class="assistance">
						<input type="hidden" name="assistance_slot" value={slot} />
						<AssistanceSelect
							name={slot}
							{exercises}
							planned={{ exerciseId: planned.exercise_id, sets: planned.sets, reps: planned.reps }}
						/>
					</div>
				{/each}
			</section>
		{/if}

		<section class="card group">
			<label class="comment">
				<h2 class="section-title">Kommentar</h2>
				<textarea name="comment" rows="3" bind:value={comment} placeholder="Hvordan gikk det?"
				></textarea>
			</label>
		</section>
	</fieldset>

	<div class="submit-bar">
		<span class="progress num" class:all-done={allSetsDone}>
			{doneCount} av {totalCount} sett
		</span>
		<button class="btn" type="submit" disabled={submitting}>
			{submitting ? 'Lagrer …' : 'Fullfør økt'}
		</button>
	</div>
</form>

<style>
	fieldset {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.group {
		padding: 0.75rem;
	}

	h2 {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		margin: 0.25rem 0.25rem 0.75rem;
	}

	h2 .muted {
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		font-size: 0.9rem;
	}

	.set {
		display: grid;
		grid-template-columns: 3rem 1rem 1fr auto;
		align-items: center;
		min-height: 60px;
		padding: 0 0.75rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		user-select: none;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.set + .set {
		margin-top: 0.25rem;
	}

	.set.warmup {
		font-size: 1.1rem;
		min-height: 52px;
		font-weight: 600;
	}

	.set:not(.amrap):active {
		background: var(--surface-2);
	}

	.set.done {
		background: var(--success-soft);
	}

	.times {
		color: var(--text-muted);
		font-weight: 400;
	}

	.check {
		width: 30px;
		height: 30px;
		padding: 3px;
		border: 2px solid var(--border);
		border-radius: 50%;
		fill: transparent;
	}

	.done .check {
		background: var(--success);
		border-color: var(--success);
		fill: var(--surface);
	}

	.set:has(:focus-visible) {
		outline: 2px solid var(--accent);
	}

	.amrap {
		cursor: default;
		background: var(--accent-soft);
	}

	.amrap-input input {
		width: 4.5rem;
		height: 48px;
		text-align: center;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.hint {
		margin: 0.4rem 0.75rem 0;
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0 0.25rem 0.25rem;
	}

	.pill {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border: 2px solid var(--border);
		border-radius: 50%;
		font-size: 1.15rem;
		font-weight: 700;
		cursor: pointer;
		user-select: none;
	}

	.pill.done {
		background: var(--success);
		border-color: var(--success);
		color: var(--surface);
	}

	.pill:has(:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.assistance + .assistance {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.comment h2 {
		margin-bottom: 0.5rem;
	}

	textarea {
		display: block;
		width: 100%;
		resize: vertical;
	}

	.submit-bar {
		position: sticky;
		bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 0.75rem);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1rem;
		padding: 0.6rem 0.6rem 0.6rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
	}

	.progress {
		color: var(--text-muted);
		font-weight: 600;
	}

	.progress.all-done {
		color: var(--success);
	}

	.submit-bar .btn {
		min-height: 48px;
		padding-inline: 1.5rem;
	}

	@media (min-width: 768px) {
		.submit-bar {
			bottom: 1rem;
		}
	}
</style>
