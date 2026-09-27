<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { browserStorage, clearDrafts, readDraft, writeDraft } from '$lib/draft';
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
	let saveError = $state('');
	// An incomplete session needs a second tap, so a stray thumb cannot finish it early
	let confirmingEarlyFinish = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | undefined;

	type Draft = {
		warmup: boolean[];
		work: boolean[];
		supplemental: boolean[];
		amrapReps: string;
		comment: string;
	};
	const draftKey = `session-${sessionId}`;
	const isBooleans = (value: unknown, length: number): boolean =>
		Array.isArray(value) && value.length === length && value.every((v) => typeof v === 'boolean');
	// A draft saved before the plan changed (e.g. another week template) is dropped
	const fitsPlan = (value: unknown): value is Draft => {
		const draft = value as Draft;
		return (
			typeof draft === 'object' &&
			draft !== null &&
			isBooleans(draft.warmup, warmupSets.length) &&
			isBooleans(draft.work, workSets.length) &&
			isBooleans(draft.supplemental, supplementalDone.length) &&
			typeof draft.amrapReps === 'string' &&
			typeof draft.comment === 'string'
		);
	};

	// Restored after mount, not during init, so server and client render the same markup
	let restored = $state(false);
	onMount(() => {
		const draft = readDraft<Draft | undefined>(browserStorage(), draftKey, undefined, fitsPlan);
		if (draft) {
			draft.warmup.forEach((done, i) => (warmupSets[i].done = done));
			draft.work.forEach((done, i) => (workSets[i].done = done));
			draft.supplemental.forEach((done, i) => (supplementalDone[i] = done));
			amrapReps = draft.amrapReps;
			comment = draft.comment;
		}
		restored = true;
		return () => clearTimeout(confirmTimer);
	});

	$effect(() => {
		if (!restored) return;
		writeDraft(browserStorage(), draftKey, {
			warmup: warmupSets.map((s) => s.done),
			work: workSets.map((s) => s.done),
			supplemental: [...supplementalDone],
			amrapReps,
			comment
		} satisfies Draft);
	});

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

	function confirmEarlyFinish(event: MouseEvent): void {
		if (allSetsDone || confirmingEarlyFinish) return;
		event.preventDefault();
		confirmingEarlyFinish = true;
		clearTimeout(confirmTimer);
		confirmTimer = setTimeout(() => (confirmingEarlyFinish = false), 4000);
	}

	// Enter on a phone keyboard would submit the whole session; move to the next field instead
	function focusNextOnEnter(event: KeyboardEvent & { currentTarget: HTMLFormElement }): void {
		if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
		event.preventDefault();
		const fields = [
			...event.currentTarget.querySelectorAll<HTMLElement>(
				'input:not([type=hidden]):not(.visually-hidden), textarea'
			)
		];
		fields[fields.indexOf(event.target) + 1]?.focus();
	}
</script>

{#snippet checkMark()}
	<svg class="check" viewBox="0 0 24 24" aria-hidden="true">
		<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
	</svg>
{/snippet}

<!-- Delegated from the fields inside; the form itself is not a control -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
	action="?/complete"
	method="POST"
	onkeydown={focusNextOnEnter}
	use:enhance={() => {
		submitting = true;
		saveError = '';
		return async ({ result, update }) => {
			// Bad signal in the gym must not replace the form with an error page
			if (result.type === 'error') {
				saveError = 'Ikke lagret – sjekk nettet og prøv igjen.';
				submitting = false;
				confirmingEarlyFinish = false;
				return;
			}
			await update({ reset: false });
			if (result.type === 'success') {
				clearDrafts(browserStorage(), draftKey);
				// The summary replaces the form; start reading it from the top
				window.scrollTo({ top: 0 });
			}
			submitting = false;
		};
	}}
>
	<input type="hidden" name="session_id" value={sessionId} />
	<input type="hidden" name="training_max" value={trainingMax} />
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
					<label class="set amrap" class:done={amrapReps !== ''}>
						<span class="reps num">{set.reps}+</span>
						<span class="times">×</span>
						<span class="weight num">{formatKg(set.weight)}</span>
						<span class="visually-hidden">Antall reps på siste sett</span>
						<input
							class="num"
							type="text"
							inputmode="numeric"
							pattern="[0-9]*"
							enterkeyhint="next"
							name="top_set_actual_reps"
							placeholder="–"
							bind:value={amrapReps}
							required
						/>
					</label>
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
		<input
			type="hidden"
			name="supplemental_sets_done"
			value={hasSupplemental && supplementalDone.every(Boolean)}
		/>

		{#if plannedAssistance.length > 0}
			<section class="card group">
				<h2 class="section-title">Assistanse</h2>
				{#each plannedAssistance as planned, index (index)}
					{@const slot = `assistance-${index + 1}`}
					<div class="assistance">
						<input type="hidden" name="assistance_slot" value={slot} />
						<AssistanceSelect
							name={slot}
							draftKey={`${draftKey}-${slot}`}
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
				<textarea
					name="comment"
					rows="3"
					enterkeyhint="done"
					bind:value={comment}
					placeholder="Hvordan gikk det?"
				></textarea>
			</label>
		</section>
	</fieldset>

	<div class="submit-bar">
		{#if saveError}
			<p class="error save-error" role="alert">{saveError}</p>
		{:else}
			<span class="progress num" class:all-done={allSetsDone}>
				{mainLift.name}: {doneCount} av {totalCount} sett
			</span>
		{/if}
		<button
			class="btn"
			class:confirm={confirmingEarlyFinish}
			type="submit"
			disabled={submitting}
			onclick={confirmEarlyFinish}
		>
			{#if submitting}
				Lagrer …
			{:else if confirmingEarlyFinish}
				Fullfør likevel?
			{:else}
				Fullfør økt
			{/if}
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
		border: 2px solid var(--border-strong);
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
		background: var(--accent-soft);
	}

	.amrap input {
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
		border: 2px solid var(--border-strong);
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
		bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 0.4rem);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1rem;
		padding: 0.4rem 0.4rem 0.4rem 1rem;
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

	.save-error {
		margin: 0;
		font-weight: 600;
	}

	.btn.confirm {
		background: var(--danger);
		color: var(--on-accent);
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
