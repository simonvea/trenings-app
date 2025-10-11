<script lang="ts">
	const lift = {
		name: 'Knebøy',
		sets: [
			{ reps: 5, weight: 50 },
			{ reps: 5, weight: 60 },
			{ reps: 5, weight: 70 }
		],
		supplemental: { sets: 5, reps: 5, weight: 50, name: 'FSL' }
	};

	const sets = $state(lift.sets.map((s) => ({ ...s, checked: false })));
	let supplementalSetsDone = $state(0);
	let isDone = $derived(supplementalSetsDone == lift.supplemental.sets);

	const onSubmit = (e: Event) => {
		e.preventDefault();
		console.table($state.snapshot(sets));
		console.log($state.snapshot(supplementalSetsDone));
	};
</script>

<main>
	<form class="form" onsubmit={onSubmit}>
		<section class="work">
			<h2>Knebøy</h2>
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
						<tr>
							<td>{set.reps}</td>
							<td>{set.weight} kg</td>
							<td>
								<input type="checkbox" bind:checked={set.checked} />
							</td>
						</tr>
					{/each}
					<tr>
						<td colspan="3">{lift.supplemental.name}</td>
					</tr>
					<tr class="supplemental" onclick={() => !isDone && supplementalSetsDone++}>
						<td>{lift.supplemental.reps}</td>
						<td>{lift.supplemental.weight} kg</td>
						<td class="supplemental__done">
							<span>{supplementalSetsDone}</span>
						</td>
					</tr>
				</tbody>
			</table>
		</section>
		<section>
			{#if isDone}
				<p>Ferdig! Flink!</p>
			{/if}
		</section>
		<section>
			<button type="submit" disabled={!isDone}>Ferdig</button>
		</section>
	</form>
</main>
