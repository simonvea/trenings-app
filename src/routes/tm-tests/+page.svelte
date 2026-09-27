<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { formatShortDate, today } from '$lib/date';
	import { formatChange, formatKg } from '$lib/format';
	import { estimateOneRepMax, parseTestSet, trainingMaxFromTest } from '$lib/trainingMax';
	import type { PageProps } from './$types';

	const { data, form }: PageProps = $props();

	// Links from a session preselect its lift with ?lift=<id>; the lifts never change while
	// the page is open, so this only runs once
	const initialLiftId = (): number | undefined => {
		const requested = Number(page.url.searchParams.get('lift'));
		return data.lifts.find((l) => l.id === requested)?.id ?? data.lifts[0]?.id;
	};
	let liftId = $state(untrack(initialLiftId));
	let lastSaved = $state<string>();
	let weight = $state('');
	let reps = $state('');
	let saving = $state(false);
	let failed = $state<string>();

	const lift = $derived(data.lifts.find((l) => l.id === liftId));
	const parsed = $derived(parseTestSet({ weight, reps }));
	const oneDecimal = (kg: number): number => Math.round(kg * 10) / 10;
	// Deleting takes a second tap, so scrolling the list with a thumb cannot remove a test.
	// The confirm button appears under the finger, so a quick double tap is ignored.
	let confirmingId = $state<number>();
	let armedAt = 0;
	let confirmTimer: ReturnType<typeof setTimeout> | undefined;
	let deleteFailed = $state(false);
	function askToDelete(id: number, event: MouseEvent): void {
		confirmingId = id;
		// Keyboard activation reports detail 0 and cannot double tap by accident
		armedAt = event.detail > 0 ? Date.now() : 0;
		clearTimeout(confirmTimer);
		confirmTimer = setTimeout(() => (confirmingId = undefined), 4000);
	}
	onDestroy(() => clearTimeout(confirmTimer));
</script>

<div class="page">
	<p class="intro muted">
		Ta ett tungt sett med 3–5 gode reps. Training max blir 90 % av estimert 1RM. Du velger om den
		skal brukes når du lager neste blokk.
	</p>

	<form
		class="card test"
		method="POST"
		action="?/add"
		use:enhance={({ formData }) => {
			// The phone's calendar day at submit time; the server clock may be UTC
			formData.set('test_date', today());
			saving = true;
			failed = undefined;
			const summary =
				lift && parsed.ok ? `${lift.name}, TM ${formatKg(trainingMaxFromTest(parsed.value))}` : '';
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'error') {
					failed = 'Fikk ikke lagret. Sjekk nettet og prøv igjen.';
					return;
				}
				await update({ reset: false });
				if (result.type === 'success') {
					lastSaved = summary;
					weight = '';
					reps = '';
				}
			};
		}}
	>
		<fieldset class="lifts">
			<legend class="section-title">Løft</legend>
			{#each data.lifts as option (option.id)}
				<label class="lift-option">
					<input type="radio" name="lift_id" value={option.id} bind:group={liftId} />
					<span>{option.name}</span>
				</label>
			{/each}
		</fieldset>

		<div class="inputs">
			<label>
				<span class="label">Vekt</span>
				<span class="with-unit">
					<input
						class="num"
						name="weight"
						inputmode="decimal"
						autocomplete="off"
						placeholder="0"
						bind:value={weight}
						required
					/>
					<span class="muted">kg</span>
				</span>
			</label>
			<label>
				<span class="label">Reps</span>
				<input
					class="num"
					name="reps"
					inputmode="numeric"
					pattern="[0-9]*"
					autocomplete="off"
					placeholder="0"
					bind:value={reps}
					required
				/>
			</label>
		</div>

		<div class="result" aria-live="polite">
			{#if parsed.ok}
				<span class="muted"
					>Estimert 1RM {formatKg(oneDecimal(estimateOneRepMax(parsed.value)))}</span
				>
				<span class="tm">
					<span class="muted">Training max</span>
					<strong class="num">{formatKg(trainingMaxFromTest(parsed.value))}</strong>
				</span>
				{#if lift?.trainingMax}
					<span class="muted num">
						Nå: {formatKg(lift.trainingMax)}
						({formatChange(lift.trainingMax, trainingMaxFromTest(parsed.value))})
					</span>
				{/if}
			{:else if weight && reps}
				<span class="error">{parsed.error}</span>
			{:else}
				<span class="muted">Skriv inn vekt og reps for å se training max.</span>
			{/if}
		</div>

		<button class="btn save" type="submit" disabled={saving || !parsed.ok}>
			{saving ? 'Lagrer …' : 'Lagre test'}
		</button>
		{#if failed ?? form?.error}
			<p class="error" role="alert">{failed ?? form?.error}</p>
		{:else if form?.saved && !weight && !reps}
			<p class="ok" role="status">Lagret{lastSaved ? `: ${lastSaved}` : '.'}</p>
		{/if}
	</form>

	<section>
		<h2 class="section-title">Tester</h2>
		{#if data.tests.length === 0}
			<p class="card empty muted">Ingen tester ennå.</p>
		{:else}
			<ul class="card list">
				{#each data.tests as test (test.id)}
					<li>
						<span class="what">
							<span class="title">
								<strong>{test.liftName}</strong>
								<span class="muted">{formatShortDate(test.test_date)}</span>
							</span>
							<span class="muted num">
								{test.reps} × {formatKg(test.weight)} ·
								<strong class="tm-value">TM {formatKg(test.training_max)}</strong>
							</span>
						</span>
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (Date.now() - armedAt < 400) {
									cancel();
									return;
								}
								deleteFailed = false;
								failed = undefined;
								return async ({ result, update }) => {
									confirmingId = undefined;
									if (result.type === 'error') {
										deleteFailed = true;
										return;
									}
									await update();
								};
							}}
						>
							<input type="hidden" name="test_id" value={test.id} />
							{#if confirmingId === test.id}
								<button class="btn confirm-delete" type="submit" {@attach (el) => el.focus()}>
									Slett?
								</button>
							{:else}
								<button
									class="delete"
									type="button"
									aria-label="Slett test {test.liftName} {formatShortDate(test.test_date)}"
									onclick={(event) => askToDelete(test.id, event)}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path
											d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7l-1.4-1.4L9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z"
										/>
									</svg>
								</button>
							{/if}
						</form>
					</li>
				{/each}
			</ul>
		{/if}
		{#if deleteFailed}
			<p class="error" role="alert">Fikk ikke slettet. Sjekk nettet og prøv igjen.</p>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 640px;
		margin: 0 auto;
	}

	.intro {
		margin: 0 0.25rem 1rem;
	}

	.test {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.lifts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		border: 0;
	}

	.lifts legend {
		padding: 0;
	}

	.lift-option {
		position: relative;
	}

	.lift-option input {
		position: absolute;
		opacity: 0;
	}

	.lift-option span {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
		padding: 0 1rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
	}

	.lift-option input:checked + span {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}

	.lift-option input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.inputs label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.label {
		font-weight: 600;
	}

	.with-unit {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.inputs input {
		width: 100%;
		min-height: var(--tap);
		font-size: 1.4rem;
		font-weight: 700;
	}

	.result {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-height: 5.5rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	.tm {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
	}

	.tm strong {
		font-size: 1.8rem;
		font-weight: 800;
	}

	.save {
		min-height: 52px;
		font-size: 1.1rem;
	}

	.test p {
		margin: 0;
	}

	section {
		margin-top: 1.75rem;
	}

	.empty {
		margin: 0;
		padding: 1rem;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: hidden;
	}

	.list li {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		min-height: 60px;
		padding: 0.4rem 0.5rem 0.4rem 1rem;
	}

	.list li + li {
		border-top: 1px solid var(--border);
	}

	.what {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.title {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.title .muted {
		font-size: 0.9rem;
	}

	.tm-value {
		color: var(--text);
		white-space: nowrap;
	}

	.list form {
		flex-shrink: 0;
	}

	.delete {
		display: grid;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		cursor: pointer;
	}

	.confirm-delete {
		min-height: var(--tap);
		background: var(--danger);
		color: var(--on-accent);
	}

	.confirm-delete:hover {
		background: var(--danger);
	}

	.delete svg {
		width: 20px;
		height: 20px;
		fill: var(--text-muted);
	}
</style>
