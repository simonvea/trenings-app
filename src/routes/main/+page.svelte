<script lang="ts">
	import type { PageProps } from '../$types';

	let { data }: PageProps = $props();

	const lift = data.mainLift;
	const sets = $state(lift.sets.map((s) => ({ ...s, checked: false })));
	let supplementalSetsDone = $state(0);
	let isDone = $derived(supplementalSetsDone == lift.supplemental.sets);
	let comment = $state(lift.comment);

	const onSubmit = (e: Event) => {
		e.preventDefault();
		console.table($state.snapshot(sets));
		console.log($state.snapshot(supplementalSetsDone));
		console.log($state.snapshot(comment));
	};
</script>

<form class="form" onsubmit={onSubmit}>
	<section>
		<h2>{lift.name}</h2>
		<table>
			<thead>
				<tr>
					<th>Reps</th>
					<th>Kg</th>
					<th>Done</th>
				</tr>
			</thead>
			<tbody>
				{#each sets as set (set)}
					<tr onclick={() => (set.checked = !set.checked)} class={set.checked ? 'set--done' : ''}>
						<td>{set.reps}{set.isAmrap ? '+' : ''}</td>
						<td>{set.weight} kg</td>
						<td>
							<input type="checkbox" bind:checked={set.checked} />
						</td>
					</tr>
				{/each}
				<tr>
					<td colspan="3"><h3>{lift.supplemental.name}</h3></td>
				</tr>
				<tr>
					<th>Reps</th>
					<th>Kg</th>
					<th>Gjennomført</th>
				</tr>
				<tr
					class={['supplemental', { 'set--done': isDone }]}
					onclick={() => !isDone && supplementalSetsDone++}
				>
					<td>{lift.supplemental.sets}x{lift.supplemental.reps}</td>
					<td>{lift.supplemental.weight} kg</td>
					<td class="supplemental__done">
						<span>{supplementalSetsDone}</span>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
	{#if isDone}
		<section>
			<p>Ferdig! Flink!</p>
		</section>
		<section>
			<button type="submit" disabled={!isDone}>Ferdig</button>
		</section>
	{/if}
	<section class="comment">
		<details>
			<summary>
				<h3>Kommentar</h3>
			</summary>
			<textarea cols="30" rows="5" bind:value={comment}></textarea>
		</details>
	</section>
</form>

<style>
	form {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}

	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 1rem 0;
		width: 100%;
	}
	tr:hover {
		background-color: azure;
	}

	.set--done {
		background-color: green;
	}

	th,
	td {
		text-align: center;
		padding: 1rem;
		border-bottom: 1px solid;
	}

	input[type='checkbox'] {
		width: 1.6rem;
		height: 1.6rem;
		min-width: 1.6rem;
		min-height: 1.6rem;
		cursor: pointer;
	}

	input[type='checkbox']::before {
		content: '';
		position: absolute;
		top: -12px;
		left: -12px;
		right: -12px;
		bottom: -12px;
	}

	.comment {
		height: 360px;
	}
	details {
		width: 100%;
		margin: 1rem 0;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
	}

	summary {
		padding: 1rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		user-select: none;
		background: #f5f5f5;
		list-style: none; /* Removes default marker */
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: background-color 0.2s ease;
		-webkit-tap-highlight-color: transparent; /* Better mobile UX */
	}
	summary:hover {
		background: #ebebeb;
	}
	summary::after {
		content: '▼';
		font-size: 0.75rem;
		transition: transform 0.3s ease;
		color: #666;
	}

	details[open] summary::after {
		transform: rotate(-180deg);
	}

	textarea {
		resize: none;
		/* Sizing */
		width: 100%;
		min-height: 120px;
		max-width: 100%;

		/* Padding & spacing */
		padding: 12px 16px;
		box-sizing: border-box;

		/* Typography */
		font-size: 16px; /* Prevents iOS zoom on focus */
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		line-height: 1.5;

		/* Borders & appearance */
		border: 1px solid #ccc;
		border-radius: 8px;

		/* Behavior */
		resize: vertical; /* Allows vertical resizing only */

		/* Touch optimization */
		touch-action: manipulation;
	}

	/* Focus state */
	textarea:focus {
		outline: none;
		border-color: #007aff; /* iOS blue */
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}
</style>
