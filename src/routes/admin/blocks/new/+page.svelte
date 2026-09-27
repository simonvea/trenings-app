<script lang="ts">
	import { enhance } from '$app/forms';
	import { translateCycleType, translateDay, translateLiftName } from '$lib/helpers';
	import { planBlock } from '$lib/planning/schedule';
	import {
		cycleTypes,
		weekdays,
		type AssistancePlan,
		type CyclePlan,
		type ProgramTemplate,
		type TrainingDay
	} from '$lib/planning/types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const ASSISTANCE_SLOTS = [1, 2];

	const nextMonday = (): string => {
		const today = new Date();
		const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
		// sv formats as YYYY-MM-DD in local time
		return new Date(today.getTime() + daysUntilMonday * 86_400_000).toLocaleDateString('sv');
	};

	const liftIdByName = (name: string): number =>
		data.lifts.find((l) => l.name === name)?.id ?? data.lifts[0].id;

	const emptyAssistance = (): AssistancePlan[] =>
		data.lifts.flatMap((lift) =>
			ASSISTANCE_SLOTS.map((position) => ({
				liftId: lift.id,
				position,
				exerciseId: 0,
				sets: 5,
				reps: 10
			}))
		);

	const assistanceFrom = (template: ProgramTemplate | undefined): AssistancePlan[] =>
		emptyAssistance().map(
			(slot) =>
				template?.assistance.find(
					(a) => a.liftId === slot.liftId && a.position === slot.position
				) ?? slot
		);

	const templateById = (id: number): ProgramTemplate | undefined =>
		data.programTemplates.find((t) => t.id === id);
	const cyclesFrom = (template: ProgramTemplate | undefined): CyclePlan[] =>
		template ? template.cycles.map((c) => ({ ...c })) : [];
	const defaultTemplate = (): ProgramTemplate | undefined => data.programTemplates[0];

	// The form starts from the first template; later edits are local until submitted.
	let templateId = $state(defaultTemplate()?.id ?? 0);
	let startDate = $state(nextMonday());
	let days: TrainingDay[] = $state([
		{ weekday: 'monday', liftId: liftIdByName('Squat') },
		{ weekday: 'tuesday', liftId: liftIdByName('Bench Press') },
		{ weekday: 'thursday', liftId: liftIdByName('Overhead Press') },
		{ weekday: 'friday', liftId: liftIdByName('Deadlift') }
	]);
	let cycles: CyclePlan[] = $state(cyclesFrom(defaultTemplate()));
	let assistance: AssistancePlan[] = $state(assistanceFrom(defaultTemplate()));
	let submitting = $state(false);

	function applyTemplate(id: number): void {
		const template = templateById(id);
		cycles = cyclesFrom(template);
		assistance = assistanceFrom(template);
	}

	function addCycle(): void {
		const supplementalTemplateId =
			templateById(templateId)?.supplementalTemplateId ?? data.supplementalTemplates[0]?.id;
		cycles.push({ type: 'leader', supplementalTemplateId });
	}

	const liftName = (id: number): string =>
		translateLiftName(data.lifts.find((l) => l.id === id)?.name ?? '');

	const preview = $derived.by(() => {
		try {
			return {
				cycles: planBlock({ startDate, days, cycles, weekTemplateIds: data.weekTemplateIds })
			};
		} catch (e) {
			return { error: (e as Error).message };
		}
	});

	const formatDate = (date: string): string => new Date(date).toLocaleDateString('no');
</script>

<form
	class="new-block"
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<section>
		<h2>Program</h2>
		<label>
			Programmal
			<select
				name="program_template_id"
				bind:value={templateId}
				onchange={() => applyTemplate(templateId)}
			>
				<option value={0}>Ingen mal</option>
				{#each data.programTemplates as template (template.id)}
					<option value={template.id}>{template.name}</option>
				{/each}
			</select>
		</label>
		{#if templateById(templateId)?.description}
			<p class="hint">{templateById(templateId)?.description}</p>
		{/if}
		<label>
			Navn
			<input name="name" required />
		</label>
		{#if form?.errors?.name}<p class="error">{form.errors.name}</p>{/if}
		<label>
			Mål
			<textarea name="goals" rows="2"></textarea>
		</label>
		<label>
			Startdato (mandag)
			<input type="date" name="start_date" bind:value={startDate} required />
		</label>
		{#if form?.errors?.start_date}<p class="error">{form.errors.start_date}</p>{/if}
	</section>

	<section>
		<h2>Treningsdager</h2>
		<table>
			<thead>
				<tr>
					<th>Dag</th>
					<th>Ukedag</th>
					<th>Løft</th>
				</tr>
			</thead>
			<tbody>
				{#each days as day, i (i)}
					<tr>
						<td>{i + 1}</td>
						<td>
							<select name={`day_${i + 1}_weekday`} bind:value={day.weekday}>
								{#each weekdays as weekday (weekday)}
									<option value={weekday}>{translateDay(weekday)}</option>
								{/each}
							</select>
						</td>
						<td>
							<select name={`day_${i + 1}_lift`} bind:value={day.liftId}>
								{#each data.lifts as lift (lift.id)}
									<option value={lift.id}>{translateLiftName(lift.name)}</option>
								{/each}
							</select>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if form?.errors?.days}<p class="error">{form.errors.days}</p>{/if}
	</section>

	<section>
		<h2>Sykluser</h2>
		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>Type</th>
					<th>Supplemental / 7. uke-mal</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each cycles as cycle, i (i)}
					<tr>
						<td>{i + 1}</td>
						<td>
							<select name="cycle_type" bind:value={cycle.type}>
								{#each cycleTypes as type (type)}
									<option value={type}>{translateCycleType(type)}</option>
								{/each}
							</select>
						</td>
						<td>
							{#if cycle.type === '7th week'}
								<input type="hidden" name="cycle_supplemental" value="" />
								<select name="cycle_seventh_week" bind:value={cycle.seventhWeekTemplateId}>
									{#each data.seventhWeekTemplates as week (week.id)}
										<option value={week.id}>{week.name}</option>
									{/each}
								</select>
							{:else}
								<select name="cycle_supplemental" bind:value={cycle.supplementalTemplateId}>
									{#each data.supplementalTemplates as supplemental (supplemental.id)}
										<option value={supplemental.id}>{supplemental.name}</option>
									{/each}
								</select>
								<input type="hidden" name="cycle_seventh_week" value="" />
							{/if}
						</td>
						<td>
							<button type="button" class="secondary" onclick={() => cycles.splice(i, 1)}>
								Fjern
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<button type="button" class="secondary" onclick={addCycle}>Legg til syklus</button>
		{#if form?.errors?.cycles}<p class="error">{form.errors.cycles}</p>{/if}
	</section>

	<section>
		<h2>Assistanse</h2>
		<table>
			<thead>
				<tr>
					<th>Løft</th>
					<th>Øvelse</th>
					<th>Sett</th>
					<th>Reps</th>
				</tr>
			</thead>
			<tbody>
				{#each assistance as slot (slot.liftId + '-' + slot.position)}
					<tr>
						<td>
							{#if slot.position === 1}{liftName(slot.liftId)}{/if}
							<input type="hidden" name="assistance_lift" value={slot.liftId} />
							<input type="hidden" name="assistance_position" value={slot.position} />
						</td>
						<td>
							<select name="assistance_exercise" bind:value={slot.exerciseId}>
								<option value={0}>Ingen</option>
								{#each data.exercises as exercise (exercise.id)}
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
		{#if form?.errors?.assistance}<p class="error">{form.errors.assistance}</p>{/if}
	</section>

	<section>
		<h2>Forhåndsvisning</h2>
		{#if preview.error}
			<p class="error">{preview.error}</p>
		{:else if preview.cycles}
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Type</th>
						<th>Start</th>
						<th>Slutt</th>
						<th>Økter</th>
					</tr>
				</thead>
				<tbody>
					{#each preview.cycles as cycle (cycle.numberInBlock)}
						<tr>
							<td>{cycle.numberInBlock}</td>
							<td>{translateCycleType(cycle.type)}</td>
							<td>{formatDate(cycle.startDate)}</td>
							<td>{formatDate(cycle.endDate)}</td>
							<td>{cycle.sessions.length}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<button type="submit" disabled={submitting}>Opprett blokk</button>
</form>

<style>
	.new-block {
		max-width: 900px;
		margin: 0 auto;
	}

	section {
		margin-bottom: 2rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
		max-width: 400px;
	}

	input,
	select,
	textarea {
		padding: 0.35rem;
		font: inherit;
	}

	input[type='number'] {
		width: 4rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		margin-bottom: 0.75rem;
	}

	th,
	td {
		padding: 0.4rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: #2563eb;
		color: white;
		font-weight: 600;
	}

	button {
		padding: 0.5rem 1rem;
		background: #2563eb;
		color: white;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
		font: inherit;
	}

	button.secondary {
		background: #6b7280;
		padding: 0.25rem 0.75rem;
	}

	button:disabled {
		opacity: 0.5;
	}

	.hint {
		color: #4b5563;
		margin-top: 0;
	}

	.error {
		color: #b91c1c;
	}
</style>
