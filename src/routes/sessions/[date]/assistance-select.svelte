<script lang="ts">
	import type { AssistanceExerciseDb } from '$lib/types';

	let sets = $state([] as string[]);
	const { name, exercises }: { name: string; exercises: AssistanceExerciseDb[] } = $props();

	const totalReps = $derived(sets.reduce((tot, set) => (tot += Number(set)), 0));
</script>

<div class="container">
	<p>Reps totalt: {totalReps}</p>
	<select {name}>
		{#each exercises as exercise (exercise.id)}
			<option value={exercise.id}>{exercise.name}</option>
		{/each}
	</select>
	<div class="inputs">
		{#each sets as s, index (index)}
			<input type="tel" name={name + '-set-' + (index + 1)} bind:value={sets[index]} />
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
	select {
		/* styling */
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
			2.5em 2.5em;
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
