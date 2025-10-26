<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import AssistanceSelect from './assistance-select.svelte';

	try {
		navigator.wakeLock?.request('screen');
	} catch (e) {
		console.error('unable to lock screen', (e as Error)?.message);
	}

	let { data, params }: PageProps = $props();

	let { session, mainLift, exercises } = data;
	let { date } = params;

	const getDateString = (date: Date) => date.toJSON().slice(0, 10);

	if (date == 'now') date = getDateString(new Date());

	const completed = session?.status == 'completed';
	const sets = $state(mainLift?.sets.map((s) => ({ ...s, checked: completed })));
	const warmupSets = $state(mainLift?.warmupSets.map((s) => ({ ...s, checked: completed })));
	let supplementalSetsDone = $state(0);
	let isDone = $derived(
		supplementalSetsDone == mainLift?.supplemental.sets && sets.every((s) => s.checked)
	);
	let comment = $state(mainLift?.comment || '');
	let loading = $state(false);

	const today = new Date(date);
	const tomorrow = new Date(new SvelteDate().setDate(today.getDate() + 1));
	const yesterday = new Date(new SvelteDate().setDate(today.getDate() - 1));
	const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
	const todayName = days[today.getDay()];

	const getSuggestedAmrapReps = (weight: number, estimated_max: number) => {
		const constant = 0.0278;
		const a = weight / (estimated_max * constant);
		const b = (1 + constant) / constant;
		return Math.round(-a + b);
	};

	const mainSet = mainLift?.sets[mainLift.sets.length - 1];
	let suggestedAmrapReps = $state(mainSet?.reps || 0);
	if (mainSet?.isAmrap) {
		suggestedAmrapReps = getSuggestedAmrapReps(mainSet.weight, session.current_training_max);
	}
</script>

<section data-sveltekit-reload class="nav">
	<a href={`/sessions/${getDateString(yesterday)}`}>forrige</a>
	<p>{todayName}: {today.toLocaleDateString('no')}</p>
	<a href={`/sessions/${getDateString(tomorrow)}`}>neste</a>
</section>

{#if !session}
	<p>Ingen økt i dag, {todayName}!</p>
{:else}
	{#if completed}
		<section class="completed">
			<p>Denne økta er gjort!</p>
		</section>
	{/if}

	<form class="form" method="POST" onsubmit={() => (loading = true)}>
		<input type="hidden" name="session_id" value={session.session_id} />
		<input type="hidden" name="lift_id" value={session.lift_id} />
		<section>
			<h2>{mainLift.name}</h2>
			<table>
				<thead>
					<tr>
						<th>Reps</th>
						<th>Kg</th>
						<th>Done</th>
					</tr>
				</thead>
				<tbody>
					{#each warmupSets as set, index (set)}
						<tr
							onclick={() => (set.checked = !set.checked)}
							class={[set.checked && 'warmup__set--done', 'warmup__set']}
						>
							<td>{set.reps}{set.isAmrap ? '+' : ''}</td>
							<td>{set.weight} kg</td>
							<td>
								<input type="checkbox" name={'warmup_set_' + index} bind:checked={set.checked} />
							</td>
						</tr>
					{/each}
					{#each sets as set, index (set)}
						<tr
							onclick={() => !set.isAmrap && (set.checked = !set.checked)}
							class={set.checked ? 'set--done' : ''}
						>
							<td
								>{set.reps}{set.isAmrap ? '+' : ''}
								<input type="hidden" name={'set_' + (index + 1) + '_reps'} value={set.reps} />
							</td>
							<td>
								<input type="hidden" name={'set_' + (index + 1) + '_weight'} value={set.weight} />
								{set.weight} kg</td
							>
							<td>
								<input type="hidden" name={'set_' + (index + 1) + '_amrap'} value={set.isAmrap} />
								{#if set.isAmrap}
									<input
										class="set__amrap-reps"
										type="tel"
										name={'set_' + (index + 1) + '_actual_reps'}
										placeholder={suggestedAmrapReps.toString()}
										onchange={(e) => (set.checked = !!e.target.value)}
									/>
								{:else}
									<input
										type="checkbox"
										name={'set_' + (index + 1) + '_done'}
										bind:checked={set.checked}
									/>
								{/if}
							</td>
						</tr>
					{/each}
					<tr>
						<td colspan="3"><h3>{mainLift.supplemental.name}</h3></td>
					</tr>
					<tr>
						<th>Reps</th>
						<th>Kg</th>
						<th>Gjennomført</th>
					</tr>
					<tr class={['supplemental', { 'set--done': isDone }]}>
						<td>{mainLift.supplemental.sets}x{mainLift.supplemental.reps}</td>
						<td>{mainLift.supplemental.weight} kg</td>
						<td class="supplemental__done">
							<button
								type="button"
								onclick={() => supplementalSetsDone > 0 && supplementalSetsDone--}>-</button
							>
							<span>{supplementalSetsDone}</span>
							<button
								type="button"
								onclick={() =>
									supplementalSetsDone < mainLift.supplemental.reps && supplementalSetsDone++}
								>+</button
							>
						</td>
					</tr>
				</tbody>
			</table>
		</section>
		<section>
			<h2>Assistanse</h2>
			<section>
				<h3>Pull</h3>
				<AssistanceSelect name="pull" exercises={exercises.filter((e) => e.category == 'pull')} />
			</section>
			<section>
				<h3>Push</h3>
				<AssistanceSelect name="push" exercises={exercises.filter((e) => e.category == 'push')} />
			</section>

			<section>
				<h3>Kjerne/Ben</h3>
				<AssistanceSelect
					name="core"
					exercises={exercises.filter((e) => e.category == 'legs/core')}
				/>
			</section>
		</section>
		{#if isDone}
			<section>
				<p>Ferdig! Flink!</p>
				{#if loading}
					<span>Sender data!</span>
				{/if}
				<button type="submit" disabled={loading || completed}>Ferdig</button>
			</section>
		{/if}
		<section class="comment">
			<details>
				<summary>
					<h3>Kommentar</h3>
				</summary>
				<textarea cols="30" rows="5" name="comment" bind:value={comment}></textarea>
			</details>
		</section>
		<section>
			<input type="hidden" name="supplemental_sets_done" value={isDone} />
			{#if loading}
				<span>Sender data!</span>
			{/if}
			<button type="submit" disabled={loading || completed}>Ferdig</button>
		</section>
	</form>
{/if}

<style>
	.nav {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
	}

	h2,
	h3 {
		margin-top: 2rem 0;
	}
	form {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	table {
		width: 360px;
		border-collapse: collapse;
	}

	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0;
	}

	.set__amrap-reps {
		height: 2rem;
		width: 3rem;
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

	.warmup__set {
		background-color: lightblue;
	}

	.warmup__set--done {
		background-color: lightgreen;
	}

	input[type='checkbox'] {
		width: 1.6rem;
		height: 1.6rem;
		min-width: 1.6rem;
		min-height: 1.6rem;
		cursor: pointer;
		position: relative;
	}

	input[type='checkbox']::before {
		content: '';
		position: absolute;
		top: -12px;
		left: -12px;
		right: -12px;
		bottom: -12px;
	}

	button {
		background-color: #04aa6d;
		border-radius: 4px;
		border: none;
		color: white;
		padding: 15px 32px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
		margin: 4px 2px;
		cursor: pointer;
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
