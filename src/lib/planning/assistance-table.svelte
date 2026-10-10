<script lang="ts">
	import type { AssistanceExerciseDb } from '$lib/types';
	import type { AssistancePlan } from './types';

	type Props = {
		slots: AssistancePlan[];
		exercises: AssistanceExerciseDb[];
		liftName: (liftId: number) => string;
	};

	let { slots = $bindable(), exercises, liftName }: Props = $props();
</script>

<div class="table-wrap">
	<table class="table">
		<thead>
			<tr>
				<th>Løft</th>
				<th>Øvelse</th>
				<th>Sett</th>
				<th>Reps</th>
			</tr>
		</thead>
		<tbody>
			{#each slots as slot (slot.liftId + '-' + slot.position)}
				<tr>
					<td>
						{#if slot.position === 1}{liftName(slot.liftId)}{/if}
						<input type="hidden" name="assistance_lift" value={slot.liftId} />
						<input type="hidden" name="assistance_position" value={slot.position} />
					</td>
					<td>
						<select name="assistance_exercise" bind:value={slot.exerciseId}>
							<option value={0}>Ingen</option>
							{#each exercises as exercise (exercise.id)}
								<option value={exercise.id}>{exercise.name}</option>
							{/each}
						</select>
					</td>
					<td><input type="number" name="assistance_sets" bind:value={slot.sets} min="1" /></td>
					<td><input type="number" name="assistance_reps" bind:value={slot.reps} min="1" /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	select {
		min-width: 9rem;
	}

	input[type='number'] {
		width: 4.5rem;
	}
</style>
