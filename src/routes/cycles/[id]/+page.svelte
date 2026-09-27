<script lang="ts">
	import { normalizeWeight } from '$lib/core.js';
	import { translateDay, translateLiftName } from '$lib/helpers.js';
	import type { Session } from './+page.server.js';
	import { SvelteMap } from 'svelte/reactivity';

	const { data } = $props();

	const { cycle, sessions, lifts } = data;
	const hasSupplemental = !!cycle.supplemental_template_id && cycle.sets > 0;

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
		return normalizeWeight(percentage * trainingMax).toString() + ' kg';
	}

	function getRepsDisplay(reps: number | undefined): string {
		if (reps === undefined || reps === null) return '-';
		if (reps < 0) return Math.abs(reps) + '+'; // AMRAP
		return reps.toString();
	}

	function calculateSupplementalWeight(session: Session | undefined): string {
		if (!session || !cycle.weight_calculation) return '-';

		const { weight_calculation, fixed_percentage } = cycle;
		const { current_training_max, set_1_percentage } = session;

		let weight: number;

		if (weight_calculation === 'first_set' && set_1_percentage) {
			weight = set_1_percentage * current_training_max;
		} else if (weight_calculation === 'fixed_percentage' && fixed_percentage) {
			weight = fixed_percentage * current_training_max;
		} else {
			return '-';
		}

		return normalizeWeight(weight).toString() + ' kg';
	}
</script>

<h2>Training Max</h2>
<table>
	<thead>
		<tr>
			{#each lifts as lift (lift.id)}
				<th>{translateLiftName(lift.name)}</th>
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
						{translateDay(day.name)}
						{#if session}
							<br /><small>{translateLiftName(session.lift_name)}</small>
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
			{#if hasSupplemental}
				<tr class="supplemental">
					<td colspan="5"><h3>{cycle.template_name}</h3></td>
				</tr>
				<tr>
					<td>{cycle.sets}x{cycle.reps}</td>
					{#each trainingDays as day (day.liftId + '-supplemental')}
						{@const session = sessionMap.get(day.liftId)}
						<td>
							{calculateSupplementalWeight(session)}
						</td>
					{/each}
				</tr>
			{/if}
		</tbody>
	</table>
{/each}

<style>
	h2 {
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: #1a1a1a;
		font-size: 1.5rem;
		font-weight: 600;
	}

	h3 {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #2563eb;
		font-size: 1.125rem;
		font-weight: 600;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	/* Make tables horizontally scrollable on mobile */
	@media (max-width: 640px) {
		table {
			display: block;
			overflow-x: auto;
			white-space: nowrap;
			-webkit-overflow-scrolling: touch;
			min-width: 100%;
		}

		thead,
		tbody,
		tr {
			display: table;
			width: 100%;
			table-layout: fixed;
		}

		thead {
			width: 100%;
		}

		tbody {
			width: 100%;
		}
	}

	thead {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		color: white;
	}

	thead tr th {
		padding: 0.875rem 0.75rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	thead tr th small {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.75rem;
		font-weight: 400;
		text-transform: none;
		opacity: 0.9;
	}

	tbody tr {
		border-bottom: 1px solid #e5e7eb;
		transition: background-color 0.2s ease;
	}

	tbody tr:last-child {
		border-bottom: none;
	}

	tbody tr:hover {
		background-color: #f9fafb;
	}

	tbody tr:nth-child(even) {
		background-color: #f8fafc;
	}

	tbody tr:nth-child(even):hover {
		background-color: #f1f5f9;
	}

	td {
		padding: 0.75rem;
		text-align: left;
		font-size: 0.9375rem;
		color: #374151;
	}

	h3 {
		text-align: center;
	}

	/* First column styling (reps or sets×reps) */
	tbody tr td:first-child {
		font-weight: 600;
		color: #1f2937;
		background-color: #f3f4f6;
	}

	tbody tr:nth-child(even) td:first-child {
		background-color: #e5e7eb;
	}

	/* Training Max table specific styling */
	h2:first-of-type + table thead {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
	}

	/* Supplemental section styling within table */
	tbody tr td[colspan] {
		background-color: #dbeafe;
		padding: 0.5rem 0.75rem;
		border-top: 2px solid #2563eb;
	}

	tbody tr td[colspan] h3 {
		margin: 0;
		font-size: 0.9375rem;
		color: #1e40af;
	}

	/* Supplemental row styling */
	tbody tr:has(td[colspan]) + tr td:first-child {
		background-color: #dbeafe;
		color: #1e40af;
		font-weight: 600;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		h2 {
			font-size: 1.25rem;
			margin-top: 1.5rem;
		}

		h3 {
			font-size: 1rem;
			margin-top: 1rem;
		}

		thead tr th {
			padding: 0.625rem 0.5rem;
			font-size: 0.75rem;
		}

		thead tr th small {
			font-size: 0.625rem;
		}

		td {
			padding: 0.5rem;
			font-size: 0.875rem;
		}

		tbody tr td[colspan] h3 {
			font-size: 0.875rem;
		}

		table {
			font-size: 0.875rem;
		}
	}

	/* Tablet and up */
	@media (min-width: 641px) {
		td {
			text-align: center;
		}

		thead tr th {
			text-align: center;
		}

		tbody tr td:first-child {
			text-align: left;
			padding-left: 1rem;
		}

		tbody tr td[colspan] {
			text-align: left;
		}
	}
</style>
