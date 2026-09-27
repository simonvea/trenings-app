<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { translateCycleType, translateDay, translateLiftName } from '$lib/helpers';
	const { data } = $props();

	const { block, cycles, lifts } = data;
	const is4dayWeek = !!block.training_day_4;

	const sortedLifts = lifts.sort((a, b) => a.id - b.id);
	const normalizeDate = (dateString: string) => new Date(dateString).toLocaleDateString('no');

	const currentCycleId = cycles.filter((c) => !c.completed_date)[0]?.id; // list is already sorted from db so we can pick first.
	const startDate = normalizeDate(cycles[0].start_date);
	const endDate =
		cycles[cycles.length - 1].end_date && normalizeDate(cycles[cycles.length - 1].end_date!);
</script>

<h1>{block.name}</h1>
<h2>Mål:</h2>
<p>{block.goals}</p>

<b>Start dato:</b>
<span>{startDate}</span>
<br />
<b>Slutt dato:</b>
<span>{endDate}</span>

<h3>Treningsdager</h3>
<table>
	<thead>
		<tr>
			<th>{translateDay(block.training_day_1)}</th>
			<th>{translateDay(block.training_day_2)}</th>
			<th>{translateDay(block.training_day_3)}</th>
			{#if is4dayWeek}
				<th>{translateDay(block.training_day_4!)}</th>
			{/if}
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>{translateLiftName(sortedLifts[block.lift_day_1_id - 1].name)}</td>
			<td>{translateLiftName(sortedLifts[block.lift_day_2_id - 1].name)}</td>
			<td>{translateLiftName(sortedLifts[block.lift_day_3_id - 1].name)}</td>
			{#if is4dayWeek}
				<td>{translateLiftName(sortedLifts[block.lift_day_4_id! - 1].name)}</td>
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
			<tr onclick={() => goto(resolve('/cycles/[id]', { id: String(cycle.id) }))}>
				<td>{translateCycleType(cycle.cycle_type)}</td>
				<td>{cycle.supplemental_name || cycle.seventh_week_name}</td>
				<td>
					{#if !!cycle.completed_date}
						{normalizeDate(cycle.completed_date)}
					{:else if cycle.id == currentCycleId}
						Pågående
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
