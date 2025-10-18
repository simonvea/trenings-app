<script lang="ts">
	import { goto } from '$app/navigation';
	const { data } = $props();

	const { block, cycles, lifts } = data;
	const is4dayWeek = !!block.training_day_4;

	const sortedLifts = lifts.sort((a, b) => a.id - b.id);

	const currentCycleId = cycles.filter((c) => !c.completed_date)[0]?.id; // list is already sorted from db so we can pick first.
</script>

<h1>{block.name}</h1>
<h2>Mål:</h2>
<p>{block.goals}</p>

<h4>Start dato:</h4>
<span>start_date på første syklus</span>

<h4>Slutt dato:</h4>
<span>end_date på siste syklus</span>

<h3>Treningsdager</h3>
<table>
	<thead>
		<tr>
			<th>{block.training_day_1}</th>
			<th>{block.training_day_2}</th>
			<th>{block.training_day_3}</th>
			{#if is4dayWeek}
				<th>{block.training_day_4}</th>
			{/if}
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>{sortedLifts[block.lift_day_1_id - 1].name}</td>
			<td>{sortedLifts[block.lift_day_2_id - 1].name}</td>
			<td>{sortedLifts[block.lift_day_3_id - 1].name}</td>
			{#if is4dayWeek}
				<td>{sortedLifts[block.lift_day_4_id! - 1].name}</td>
			{/if}
		</tr>
	</tbody>
</table>

<h3>Plan</h3>
<table>
	<thead>
		<tr>
			<th>Syklus</th>
			<th>Mal</th>
			<th>Done</th>
		</tr>
	</thead>
	<tbody>
		{#each cycles as cycle (cycle.id)}
			<tr onclick={() => goto('/cycles/' + cycle.id)}>
				<td>{cycle.cycle_type}</td>
				<td>{cycle.supplemental_name || cycle.seventh_week_name}</td>
				<td>
					{#if !!cycle.completed_date}
						{cycle.completed_date}
					{:else if cycle.id == currentCycleId}
						'Pågående'
					{:else}
						''
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
