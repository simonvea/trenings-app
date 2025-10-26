<script lang="ts">
	import { normalizeWeight } from '$lib/core.js';
	import type { Session } from './+page.server.js';
	import { SvelteMap } from 'svelte/reactivity';

	const { data } = $props();

	const { cycle, sessions, lifts } = data;

	// Group sessions by week
	const sessionsPerWeek = sessions.reduce((prev, curr) => {
		const index = curr.week_number_in_cycle - 1;
		if (index >= prev.length) {
			prev.push([]);
		}
		prev[index].push(curr);
		return prev;
	}, [] as Session[][]);

	const { training_day_1, training_day_2, training_day_3, training_day_4 } = cycle;
	const { lift_day_1_id, lift_day_2_id, lift_day_3_id, lift_day_4_id } = cycle;

	// Define the training days structure
	const trainingDays = $derived([
		{ name: training_day_1, liftId: lift_day_1_id },
		{ name: training_day_2, liftId: lift_day_2_id },
		{ name: training_day_3, liftId: lift_day_3_id },
		...(training_day_4 && lift_day_4_id ? [{ name: training_day_4, liftId: lift_day_4_id }] : [])
	]);

	// Define sets structure (name, percentage field, reps field)
	const sets = [
		{
			label: 'Warmup 1',
			percentageField: 'warmup_set_1_percentage',
			repsField: 'warmup_set_1_reps'
		},
		{
			label: 'Warmup 2',
			percentageField: 'warmup_set_2_percentage',
			repsField: 'warmup_set_2_reps'
		},
		{
			label: 'Warmup 3',
			percentageField: 'warmup_set_3_percentage',
			repsField: 'warmup_set_3_reps'
		},
		{ label: 'Set 1', percentageField: 'set_1_percentage', repsField: 'set_1_reps' },
		{ label: 'Set 2', percentageField: 'set_2_percentage', repsField: 'set_2_reps' },
		{ label: 'Set 3', percentageField: 'set_3_percentage', repsField: 'set_3_reps' },
		{ label: 'Set 4', percentageField: 'set_4_percentage', repsField: 'set_4_reps' }
	] as const;

	function mapSessionsToDays(weekSessions: Session[]) {
		const sessionMap = new SvelteMap<number, Session>();
		for (const session of weekSessions) {
			sessionMap.set(session.lift_id, session);
		}
		return sessionMap;
	}

	function calculateWeight(percentage: number | undefined, trainingMax: number): string {
		if (percentage === undefined || percentage === null) return '-';
		return normalizeWeight(percentage * trainingMax).toString();
	}

	function getRepsDisplay(reps: number | undefined): string {
		if (reps === undefined || reps === null) return '-';
		if (reps < 0) return Math.abs(reps) + '+'; // AMRAP
		return reps.toString();
	}
</script>

<h2>Training Max</h2>
<table>
	<thead>
		<tr>
			{#each lifts as lift (lift.id)}
				<th>{lift.name}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<tr>
			{#each lifts as lift ('tm' + lift.id)}
				<td>{lift.current_training_max}</td>
			{/each}
		</tr>
	</tbody>
</table>

<h2>Plan</h2>
{#each sessionsPerWeek as week, weekIndex (weekIndex)}
	{@const sessionMap = mapSessionsToDays(week)}
	<h3>Uke {weekIndex + 1}</h3>
	<table>
		<thead>
			<tr>
				<th>Reps</th>
				{#each trainingDays as day (day.liftId)}
					{@const session = sessionMap.get(day.liftId)}
					<th>
						{day.name}
						{#if session}
							<br /><small>{session.lift_name}</small>
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sets as set (set.label)}
				{@const firstSession = Array.from(sessionMap.values())[0]}
				{@const reps = firstSession?.[set.repsField]}
				{#if reps !== undefined && reps !== null}
					<tr>
						<td>{getRepsDisplay(reps)}</td>
						{#each trainingDays as day (day.liftId + set.label)}
							{@const session = sessionMap.get(day.liftId)}
							<td>
								{#if session}
									{calculateWeight(session[set.percentageField], session.current_training_max)}
								{:else}
									-
								{/if}
							</td>
						{/each}
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
{/each}
