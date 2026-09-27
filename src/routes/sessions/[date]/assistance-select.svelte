<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browserStorage, readDraft, writeDraft } from '$lib/draft';
	import { formatKg } from '$lib/format';
	import type { AssistanceExerciseDb } from '$lib/types';

	type Props = {
		name: string;
		draftKey: string;
		exercises: AssistanceExerciseDb[];
		planned: { exerciseId: number; sets: number; reps: number };
	};
	type LastTime = { sets: number; reps: number; weight: number };
	type Draft = { exerciseId: number; weight: string; sets: string[] };

	const isDraft = (value: unknown): value is Draft => {
		const draft = value as Draft;
		return (
			typeof draft === 'object' &&
			draft !== null &&
			exercises.some((e) => e.id === draft.exerciseId) &&
			typeof draft.weight === 'string' &&
			Array.isArray(draft.sets) &&
			draft.sets.every((set) => typeof set === 'string')
		);
	};

	const { name, draftKey, exercises, planned }: Props = $props();

	// Start from the plan; exercise and number of sets can still be changed during the session.
	const plannedSets = (): string[] => Array.from({ length: planned.sets }, () => '');
	const plannedExercise = (): number => planned.exerciseId;
	let sets = $state(plannedSets());
	let exerciseId = $state(plannedExercise());
	let weight = $state('');
	let lastTime: LastTime | undefined = $state();
	let loading = $state(true);
	let setList: HTMLElement | undefined = $state();

	const totalReps = $derived(sets.reduce((total, set) => total + Number(set || 0), 0));

	async function loadLastTime(id: number): Promise<void> {
		loading = true;
		lastTime = undefined;
		// History is a hint; without a connection the set can still be logged
		const res = await fetch('/history/exercises/' + id).catch(() => undefined);
		const [latest] = res?.ok ? ((await res.json()) as LastTime[]) : [];
		// The exercise may have been changed again while this request was in flight
		if (id !== exerciseId) return;
		lastTime = latest;
		if (latest?.weight && weight === '') weight = latest.weight.toLocaleString('nb');
		loading = false;
	}

	function fillPlannedReps(): void {
		sets = sets.map((set) => set || String(planned.reps));
	}

	async function addSet(): Promise<void> {
		sets.push('');
		await tick();
		setList?.querySelector<HTMLInputElement>('li:nth-last-child(2) input')?.focus();
	}

	// Restored after mount, not during init, so server and client render the same markup
	let restored = $state(false);
	onMount(() => {
		const draft = readDraft<Draft | undefined>(browserStorage(), draftKey, undefined, isDraft);
		if (draft) ({ exerciseId, weight, sets } = draft);
		restored = true;
		loadLastTime(exerciseId);
	});

	$effect(() => {
		if (!restored) return;
		writeDraft(browserStorage(), draftKey, { exerciseId, weight, sets: [...sets] } satisfies Draft);
	});
</script>

<div class="assistance">
	<select
		class="exercise"
		{name}
		aria-label="Øvelse"
		bind:value={exerciseId}
		onchange={() => loadLastTime(exerciseId)}
	>
		{#each exercises as exercise (exercise.id)}
			<option value={exercise.id}>{exercise.name}</option>
		{/each}
	</select>

	<p class="meta muted num">
		Plan {planned.sets} × {planned.reps}
		{#if loading}
			· henter sist …
		{:else if lastTime}
			· Sist {lastTime.sets} sett, {lastTime.reps} reps{lastTime.weight
				? ` @ ${formatKg(lastTime.weight)}`
				: ''}
		{/if}
	</p>

	<div class="row">
		<label class="weight">
			<span>Vekt</span>
			<span class="with-unit">
				<input
					class="num"
					type="text"
					inputmode="decimal"
					enterkeyhint="next"
					pattern="[0-9]+([,.][0-9]+)?"
					name={name + '-weight'}
					placeholder="0"
					bind:value={weight}
				/>
				<span class="unit">kg</span>
			</span>
		</label>
		<button type="button" class="btn btn-secondary fill" onclick={fillPlannedReps}>
			Fyll inn {planned.reps} reps
		</button>
	</div>

	<ol class="sets" bind:this={setList}>
		{#each sets, index (index)}
			<li>
				<label>
					<span class="set-label">Sett {index + 1}</span>
					<input
						class="num"
						type="text"
						inputmode="numeric"
						pattern="[0-9]*"
						enterkeyhint="next"
						name={name + '-set'}
						placeholder={String(planned.reps)}
						bind:value={sets[index]}
					/>
				</label>
			</li>
		{/each}
		<li>
			<button type="button" class="add" onclick={addSet} aria-label="Legg til sett">+</button>
		</li>
	</ol>

	<p class="total muted num">Totalt {totalReps} reps</p>
</div>

<style>
	.assistance {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.exercise {
		width: 100%;
		min-height: 48px;
		font-weight: 700;
	}

	.meta,
	.total {
		margin: 0;
		font-size: 0.9rem;
	}

	.row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.weight {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.with-unit {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--text);
		font-size: 1rem;
	}

	.weight input {
		width: 5.5rem;
		height: 48px;
		text-align: center;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.fill {
		min-height: 48px;
	}

	.sets {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.sets label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}

	.set-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.sets input {
		width: 100%;
		height: 56px;
		padding: 0;
		text-align: center;
		font-size: 1.35rem;
		font-weight: 700;
	}

	.sets input:not(:placeholder-shown) {
		background: var(--success-soft);
		border-color: var(--success);
	}

	.add {
		width: 100%;
		height: 56px;
		margin-top: calc(0.75rem * 1.45 + 0.15rem);
		border: 2px dashed var(--border-strong);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-muted);
		font-size: 1.6rem;
		cursor: pointer;
	}
</style>
