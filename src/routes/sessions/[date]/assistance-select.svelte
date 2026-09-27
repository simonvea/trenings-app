<script lang="ts">
	import type { AssistanceExerciseDb } from '$lib/types';
	import { onMount } from 'svelte';

	const {
		name,
		exercises,
		planned
	}: {
		name: string;
		exercises: AssistanceExerciseDb[];
		planned: { exerciseId: number; sets: number; reps: number };
	} = $props();
	// Start from the plan; exercise and number of sets can still be changed during the session.
	const plannedSets = (): string[] => Array.from({ length: planned.sets }, () => '');
	const plannedExercise = (): number => planned.exerciseId;
	let sets = $state(plannedSets());
	let exerciseId = $state(plannedExercise());
	let history = $state({ reps: 0, weight: 0 } as { reps: number; weight: number });
	let loading = $state(true);

	const totalReps = $derived(sets.reduce((tot, set) => (tot += Number(set)), 0));

	async function updateHistory(id: number) {
		loading = true;
		const res = await fetch('/history/exercises/' + id);
		if (!res.ok) {
			loading = false;
			return;
		}

		const data = await res.json();

		const { reps, weight } = data[0] || { reps: 0, weight: 0 };

		history = { reps, weight };
		loading = false;
	}

	onMount(() => updateHistory(exerciseId));
</script>

<div class="container">
	<p>Plan: {planned.sets}x{planned.reps}</p>
	<p>Reps totalt: {totalReps}</p>
	{#if loading}
		<p>Henter historie...</p>
	{:else if history.reps == 0}
		<p></p>
	{:else}
		<p>Sist: {history.reps} reps x {history.weight} kg</p>
	{/if}
	<div class="exercise">
		<select {name} bind:value={exerciseId} onchange={() => updateHistory(exerciseId)}>
			{#each exercises as exercise (exercise.id)}
				<option value={exercise.id}>{exercise.name}</option>
			{/each}
		</select>
		<div>
			<input type="tel" name={name + '-weight'} placeholder="kg" />
		</div>
	</div>
	<div class="inputs">
		{#each sets as s, index (index)}
			<input
				type="tel"
				name={name + '-set'}
				bind:value={sets[index]}
				autofocus={index >= planned.sets}
			/>
		{/each}
		<button type="button" onclick={() => sets.push('')}>+</button>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.exercise {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 2rem;
	}

	select {
		height: 4rem;
		background-color: white;
		border: thin solid blue;
		border-radius: 4px;
		display: inline-block;
		font: inherit;
		line-height: 1.5em;
		padding: 0.5em 3.5em 0.5em 1em;
		background-image:
			linear-gradient(45deg, transparent 50%, blue 50%),
			linear-gradient(135deg, blue 50%, transparent 50%),
			linear-gradient(to right, skyblue, skyblue);
		background-position:
			calc(100% - 20px) calc(1em + 2px),
			calc(100% - 15px) calc(1em + 2px),
			100% 0;
		background-size:
			5px 5px,
			5px 5px,
			2.5rem 4rem;
		background-repeat: no-repeat;

		/* reset */

		margin: 0;
		-webkit-box-sizing: border-box;
		-moz-box-sizing: border-box;
		box-sizing: border-box;
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
	}
	.inputs {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		margin: 1.6rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}

	input {
		width: 4rem;
		height: 4rem;
		text-align: center;
		font-size: 2rem;
		padding: 0;
	}

	button {
		width: 4rem;
		height: 4rem;
		background-color: green;
		color: white;
		font-size: 2rem;
		border-radius: 4px;
		border: 0;
	}
</style>
