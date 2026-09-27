<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { DayPlanRow } from '$lib/dayPlan/form';
	import { entryKinds, kindNames } from '$lib/dayPlan/types';
	import type { PageProps } from './$types';

	const { data, form }: PageProps = $props();

	type EditRow = DayPlanRow & { id: number };

	let nextId = 0;
	const withId = (row: DayPlanRow): EditRow => ({ ...row, id: nextId++ });

	// Without JavaScript a failed save reloads the page, so start from the submitted rows
	const initialRows = (): EditRow[] =>
		(
			form?.rows ??
			data.entries.map((e) => ({
				start: e.start,
				end: e.end,
				kind: e.kind,
				label: e.label,
				note: e.note ?? ''
			}))
		).map(withId);
	let rows = $state(untrack(initialRows));
	// Row errors are keyed by position, so they no longer fit once a row is removed
	let rowErrorsStale = $state(false);
	let saving = $state(false);

	const rowErrors = $derived(rowErrorsStale ? {} : (form?.errors.rows ?? {}));

	const addRow = (): void => {
		const previous = rows.at(-1);
		rows.push(
			withId({ start: previous?.end ?? '', end: '', kind: 'routine', label: '', note: '' })
		);
	};

	const removeRow = (id: number): void => {
		rows = rows.filter((r) => r.id !== id);
		rowErrorsStale = true;
	};
</script>

<form
	method="POST"
	use:enhance={() => {
		saving = true;
		rowErrorsStale = false;
		return async ({ update }) => {
			await update({ reset: false });
			saving = false;
		};
	}}
>
	{#if form?.errors.form}
		<p class="card form-error error" role="alert">{form.errors.form}</p>
	{/if}

	{#if rows.length === 0}
		<p class="card empty muted">
			Ingen aktiviteter. Legg til en rad, eller lagre for å tømme dagen.
		</p>
	{/if}

	<ol class="rows">
		{#each rows as row, i (row.id)}
			{@const rowError = rowErrors[i]}
			<li class="card row" class:invalid={rowError}>
				<div class="times">
					<label>
						<span>Start</span>
						<input
							class="num"
							type="time"
							name="start"
							bind:value={row.start}
							aria-invalid={rowError ? 'true' : undefined}
						/>
					</label>
					<label>
						<span>Slutt</span>
						<input
							class="num"
							type="time"
							name="end"
							bind:value={row.end}
							aria-invalid={rowError ? 'true' : undefined}
						/>
					</label>
					<label>
						<span>Type</span>
						<select name="kind" bind:value={row.kind}>
							{#each entryKinds as kind (kind)}
								<option value={kind}>{kindNames[kind]}</option>
							{/each}
						</select>
					</label>
				</div>
				<label>
					<span>Hva</span>
					<input
						name="label"
						bind:value={row.label}
						autocomplete="off"
						aria-invalid={rowError ? 'true' : undefined}
					/>
				</label>
				<div class="note-row">
					<label>
						<span>Notat</span>
						<input name="note" bind:value={row.note} autocomplete="off" />
					</label>
					<button
						type="button"
						class="btn btn-secondary remove"
						onclick={() => removeRow(row.id)}
						aria-label="Fjern {row.label || `rad ${i + 1}`}"
					>
						Fjern
					</button>
				</div>
				{#if rowError}<p class="error row-error">{rowError}</p>{/if}
			</li>
		{/each}
	</ol>

	<button type="button" class="btn btn-secondary add" onclick={addRow}>Legg til rad</button>

	<div class="actions">
		<a
			class="btn btn-secondary"
			href={resolve('/day/[[weekday=weekday]]', { weekday: data.weekday })}>Avbryt</a
		>
		<button class="btn" type="submit" disabled={saving}>
			{saving ? 'Lagrer …' : 'Lagre'}
		</button>
	</div>
</form>

<style>
	.form-error,
	.empty {
		margin: 0 0 1rem;
		padding: 1rem;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0 0 1rem;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.9rem;
	}

	.row.invalid {
		border-color: var(--danger);
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	label span {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	input,
	select {
		width: 100%;
		min-height: 44px;
	}

	.times {
		display: grid;
		grid-template-columns: 1fr 1fr 1.2fr;
		gap: 0.5rem;
	}

	.note-row {
		display: flex;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.note-row label {
		flex: 1;
	}

	.remove {
		flex-shrink: 0;
		color: var(--danger);
	}

	.row-error {
		margin: 0;
		font-weight: 600;
	}

	.add {
		width: 100%;
		margin-bottom: 1.5rem;
	}

	.actions {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 0.75rem;
	}
</style>
