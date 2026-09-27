<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatShortDate, localDateOfUtcTimestamp } from '$lib/date';
	import { formatKg } from '$lib/format';
	import { translateCycleType, translateDay, translateLiftName } from '$lib/helpers';
	import { planBlock } from '$lib/planning/schedule';
	import { defaultTrainingMaxSource, type TrainingMaxSource } from '$lib/trainingMax';
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

	// Assistance is kept for every lift, so swapping a day's lift and back keeps earlier edits.
	// Only the lifts trained in this block are shown and submitted.
	const blockAssistance = $derived(
		[...new Set(days.map((d) => d.liftId))].flatMap((liftId) =>
			assistance.filter((a) => a.liftId === liftId)
		)
	);

	const liftName = (id: number): string =>
		translateLiftName(data.lifts.find((l) => l.id === id)?.name ?? '');

	const testFor = (liftId: number) => data.latestTests.find((t) => t.lift_id === liftId);
	const defaultSources = (): Record<number, TrainingMaxSource> =>
		Object.fromEntries(
			data.lifts.map((lift) => {
				const test = testFor(lift.id);
				const source = defaultTrainingMaxSource(
					{ trainingMax: lift.current_training_max, changedAt: lift.updated_at },
					test && { createdAt: test.created_at }
				);
				return [lift.id, source];
			})
		);
	let trainingMaxSource = $state(defaultSources());
	const blockLifts = $derived(
		[...new Set(days.map((d) => d.liftId))].flatMap((id) => data.lifts.filter((l) => l.id === id))
	);
	const chosenTrainingMax = (liftId: number): number =>
		trainingMaxSource[liftId] === 'test'
			? (testFor(liftId)?.training_max ?? 0)
			: (data.lifts.find((l) => l.id === liftId)?.current_training_max ?? 0);

	const preview = $derived.by(() => {
		try {
			return {
				cycles: planBlock({ startDate, days, cycles, weekTemplateIds: data.weekTemplateIds })
			};
		} catch (e) {
			return { error: (e as Error).message };
		}
	});
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
		<h2 class="section-title">Program</h2>
		<div class="card program">
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
			<label class="wide">
				Mål
				<textarea name="goals" rows="2"></textarea>
			</label>
			<label>
				Startdato (mandag)
				<input type="date" name="start_date" bind:value={startDate} required />
			</label>
			{#if form?.errors?.start_date}<p class="error">{form.errors.start_date}</p>{/if}
		</div>
	</section>

	<section>
		<h2 class="section-title">Treningsdager</h2>
		<div class="table-wrap">
			<table class="table">
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
		</div>
		{#if form?.errors?.days}<p class="error">{form.errors.days}</p>{/if}
	</section>

	<section>
		<h2 class="section-title">Training max</h2>
		<div class="tm-grid">
			{#each blockLifts as lift (lift.id)}
				{@const test = testFor(lift.id)}
				<fieldset class="card tm-choice">
					<legend>{translateLiftName(lift.name)}</legend>
					<input
						type="hidden"
						name={`training_max_${lift.id}`}
						value={chosenTrainingMax(lift.id)}
					/>
					{#if lift.current_training_max}
						<label class="option">
							<input
								type="radio"
								name={`tm_source_${lift.id}`}
								value="current"
								bind:group={trainingMaxSource[lift.id]}
							/>
							<span class="option-text">
								<span>Nåværende</span>
								<span class="muted">
									endret {formatShortDate(localDateOfUtcTimestamp(lift.updated_at))}
								</span>
							</span>
							<strong class="num">{formatKg(lift.current_training_max)}</strong>
						</label>
					{:else if !test}
						<p class="missing">Mangler training max</p>
					{/if}
					{#if test}
						<label class="option">
							<input
								type="radio"
								name={`tm_source_${lift.id}`}
								value="test"
								bind:group={trainingMaxSource[lift.id]}
							/>
							<span class="option-text">
								<span>Test {formatShortDate(test.test_date)}</span>
								<span class="muted num">{test.reps} × {formatKg(test.weight)}</span>
							</span>
							<strong class="num">{formatKg(test.training_max)}</strong>
						</label>
					{/if}
				</fieldset>
			{/each}
		</div>
		<p class="hint">
			Valget blir lagret som training max når blokka opprettes{#if data.activeBlockName}, og gjelder
				da også resten av «{data.activeBlockName}»{/if}. Ta en ny test fra mobilen under
			<a href={resolve('/tm-tests')}>TM-test</a>, eller endre training max direkte under
			<a href={resolve('/admin')}>Planlegging</a>.
		</p>
		{#if form?.errors?.training_max}<p class="error">{form.errors.training_max}</p>{/if}
	</section>

	<section>
		<h2 class="section-title">Sykluser</h2>
		<div class="table-wrap">
			<table class="table">
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
								<button
									type="button"
									class="btn btn-secondary small"
									onclick={() => cycles.splice(i, 1)}
								>
									Fjern
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<button type="button" class="btn btn-secondary small" onclick={addCycle}>Legg til syklus</button
		>
		{#if form?.errors?.cycles}<p class="error">{form.errors.cycles}</p>{/if}
	</section>

	<section>
		<h2 class="section-title">Assistanse</h2>
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
					{#each blockAssistance as slot (slot.liftId + '-' + slot.position)}
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
		</div>
		{#if form?.errors?.assistance}<p class="error">{form.errors.assistance}</p>{/if}
	</section>

	<section>
		<h2 class="section-title">Forhåndsvisning</h2>
		{#if preview.error}
			<p class="error">{preview.error}</p>
		{:else if preview.cycles}
			<div class="table-wrap">
				<table class="table">
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
								<td>{formatShortDate(cycle.startDate)}</td>
								<td>{formatShortDate(cycle.endDate)}</td>
								<td>{cycle.sessions.length}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<div class="submit">
		<button class="btn" type="submit" disabled={submitting}>
			{submitting ? 'Oppretter …' : 'Opprett blokk'}
		</button>
	</div>
</form>

<style>
	.new-block {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.program {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.75rem 1.25rem;
		padding: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-weight: 600;
	}

	label.wide {
		grid-column: 1 / -1;
	}

	.table select {
		min-width: 9rem;
	}

	.table input[type='number'] {
		width: 4.5rem;
	}

	.table-wrap + .btn {
		margin-top: 0.75rem;
	}

	.small {
		min-height: 36px;
		padding: 0.3rem 0.8rem;
		font-size: 0.875rem;
	}

	.hint {
		grid-column: 1 / -1;
		margin: 0;
		color: var(--text-muted);
		font-weight: 400;
	}

	.error {
		margin: 0.4rem 0 0;
	}

	.tm-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.75rem;
	}

	.tm-choice {
		margin: 0;
		padding: 0.5rem 0.75rem 0.75rem;
	}

	.tm-choice legend {
		float: left;
		width: 100%;
		padding: 0.25rem 0.25rem 0.4rem;
		font-weight: 700;
	}

	.option {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		min-height: var(--tap);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		font-weight: 400;
		cursor: pointer;
	}

	.option:has(input:checked) {
		background: var(--accent-soft);
	}

	.missing {
		margin: 0;
		padding: 0.5rem;
		color: var(--danger);
		font-weight: 600;
	}

	.option input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.option-text {
		display: flex;
		flex: 1;
		flex-direction: column;
		line-height: 1.3;
	}

	.option-text .muted {
		font-size: 0.85rem;
	}

	section > .hint {
		margin-inline: 0.25rem;
		margin-top: 0.6rem;
		font-size: 0.9rem;
	}

	.submit {
		position: sticky;
		bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 0.75rem);
		display: flex;
		justify-content: flex-end;
	}

	.submit .btn {
		min-height: 48px;
		padding-inline: 1.75rem;
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
	}

	@media (min-width: 768px) {
		.submit {
			bottom: 1rem;
		}
	}
</style>
