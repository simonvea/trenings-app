<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { browserStorage, readDraft, writeDraft } from '$lib/draft';
	import { formatShortDate } from '$lib/date';
	import { formatKg, formatReps } from '$lib/format';
	import type { TrainingMaxCheck, TrainingMaxIncrease } from '$lib/trainingMax';

	type Props = {
		check: TrainingMaxCheck;
		increase: TrainingMaxIncrease;
		sessionId: number;
		liftId: number;
		trainingMax: number;
		openTest: { test_date: string; training_max: number } | undefined;
	};

	const { check, increase, sessionId, liftId, trainingMax, openTest }: Props = $props();

	let saving = $state(false);
	let failed = $state('');
	// Shown after a change, with a way back for a mis-tap on the gym floor
	let changed = $state<{ from: number; to: number }>();

	// "It went fine" is remembered on this phone so the question is not asked on every visit
	// The page keys this component on the session
	const answeredKey = (): string => `tm-check-ok-${sessionId}`;
	const isTrue = (value: unknown): value is boolean => value === true;
	// Unknown until mounted, so the card appears late rather than jumping away on every visit
	let answeredFine = $state<boolean>();
	onMount(() => {
		answeredFine = readDraft(browserStorage(), answeredKey(), false, isTrue);
	});
	function wentFine(): void {
		answeredFine = true;
		writeDraft(browserStorage(), answeredKey(), true);
	}

	// Declining a raise is remembered on this phone too, so the card does not nag
	const skippedRaiseKey = (): string => `tm-raise-skipped-${sessionId}`;
	let skippedRaise = $state<boolean>();
	onMount(() => {
		skippedRaise = readDraft(browserStorage(), skippedRaiseKey(), false, isTrue);
	});
	function skipRaise(): void {
		skippedRaise = true;
		writeDraft(browserStorage(), skippedRaiseKey(), true);
	}
</script>

{#snippet changeForm(from: number, to: number, label: string, secondary: boolean, undo: boolean)}
	{#if openTest && to < from}
		<p class="note muted">
			TM-testen fra {formatShortDate(openTest.test_date)} ({formatKg(openTest.training_max)}) blir
			ikke lenger foreslått for neste blokk hvis du senker nå, heller ikke om du angrer.
		</p>
	{/if}
	<form
		method="POST"
		action="?/changeTrainingMax"
		use:enhance={() => {
			saving = true;
			failed = '';
			return async ({ result, update }) => {
				// Kept disabled until the new training max is loaded, so it cannot be sent twice
				try {
					if (result.type === 'error') {
						failed = 'Ikke lagret – sjekk nettet og prøv igjen.';
					} else if (result.type === 'failure') {
						failed = String(result.data?.tmError ?? 'Ikke lagret');
						// Already changed elsewhere; drop the stale card and show the current training max
						changed = undefined;
						await invalidateAll();
					} else {
						changed = undo ? undefined : { from, to };
						await update();
					}
				} finally {
					saving = false;
				}
			};
		}}
	>
		<input type="hidden" name="lift_id" value={liftId} />
		<input type="hidden" name="from" value={from} />
		<input type="hidden" name="to" value={to} />
		<button class="btn" class:btn-secondary={secondary} type="submit" disabled={saving}>
			{label}
		</button>
	</form>
{/snippet}

{#if changed}
	<section class="card check">
		<!-- The tapped button is gone, so focus moves here and the result is read out -->
		<h3 tabindex="-1" {@attach (el) => el.focus()}>
			Training max er {changed.to < changed.from ? 'senket' : 'økt'} til {formatKg(changed.to)}
		</h3>
		<p>Gjelder resten av blokka. Tidligere økter beholder vektene sine.</p>
		{@render changeForm(
			changed.to,
			changed.from,
			`Angre, tilbake til ${formatKg(changed.from)}`,
			true,
			true
		)}
	</section>
{:else if check.kind === 'missedReps'}
	<section class="card check warning">
		<h3>Training max er trolig for høy</h3>
		<p>
			Toppsettet ble {formatReps(check.actualReps)}, under kravet på {check.minimumReps}.
			{#if check.basis === 'estimatedMax'}
				Wendler anbefaler å sette training max til 85 % av estimert maks ({formatKg(trainingMax)} → {formatKg(
					check.lowered
				)}).
			{:else}
				Wendler anbefaler å senke training max med 10 % ({formatKg(trainingMax)} → {formatKg(
					check.lowered
				)}).
			{/if}
		</p>
		{@render changeForm(
			trainingMax,
			check.lowered,
			`Senk TM til ${formatKg(check.lowered)}`,
			false,
			false
		)}
	</section>
{:else if check.kind === 'askIfHeavy' && answeredFine === false}
	<section class="card check">
		<h3>Føltes 100 %-settet tungt?</h3>
		<p>
			Toppsettet i 7. uke skal gå greit. Var det en kamp, er training max for høy og bør senkes
			10&nbsp;%.
		</p>
		{@render changeForm(
			trainingMax,
			check.lowered,
			`Ja, senk TM til ${formatKg(check.lowered)}`,
			true,
			false
		)}
		<button class="btn btn-secondary" type="button" onclick={wentFine}>Nei, det gikk greit</button>
	</section>
	<!-- Undoing a raise brings this card back, as the training max is the session's again -->
{:else if increase.kind === 'raise' && skippedRaise === false}
	<section class="card check">
		<h3>Øk training max?</h3>
		<p>
			Syklusen er ferdig og alle toppsett nådde repsene. Wendler øker med {formatKg(
				increase.to - increase.from
			)} etter hver syklus ({formatKg(increase.from)} → {formatKg(increase.to)}).
		</p>
		{@render changeForm(
			increase.from,
			increase.to,
			`Øk TM til ${formatKg(increase.to)}`,
			false,
			false
		)}
		<button class="btn btn-secondary" type="button" onclick={skipRaise}>Ikke nå</button>
	</section>
{:else if increase.kind === 'hold'}
	<section class="card check">
		<h3>Training max holdes</h3>
		<p>
			{increase.missedSets} toppsett i syklusen nådde ikke repsene, så training max økes ikke. Vil du
			øke likevel, bruk knappene under «Øk etter fullført syklus» på Planlegg-siden.
		</p>
	</section>
{/if}

{#if failed}
	<p class="error" role="alert">{failed}</p>
{/if}

<style>
	.check {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 1rem;
		padding: 1rem;
	}

	.warning {
		border-color: var(--danger);
		background: var(--danger-soft);
	}

	h3 {
		font-size: 1.05rem;
	}

	p {
		margin: 0;
	}

	.btn {
		width: 100%;
		min-height: var(--tap);
	}

	.note {
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
</style>
