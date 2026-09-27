<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { browserStorage, readDraft, writeDraft } from '$lib/draft';
	import { formatKg, formatReps } from '$lib/format';
	import type { TrainingMaxCheck } from '$lib/trainingMax';

	type Props = { check: TrainingMaxCheck; sessionId: number; liftId: number; trainingMax: number };

	const { check, sessionId, liftId, trainingMax }: Props = $props();

	let saving = $state(false);
	let failed = $state('');
	// Shown after lowering, with a way back for a mis-tap on the gym floor
	let lowered = $state<{ from: number; to: number }>();

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
</script>

{#snippet changeForm(from: number, to: number, label: string, secondary: boolean)}
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
						lowered = undefined;
						await invalidateAll();
					} else {
						lowered = to < from ? { from, to } : undefined;
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

{#if lowered}
	<section class="card check">
		<!-- The tapped button is gone, so focus moves here and the result is read out -->
		<h3 tabindex="-1" {@attach (el) => el.focus()}>
			Training max er senket til {formatKg(lowered.to)}
		</h3>
		<p>Gjelder resten av blokka. Tidligere økter beholder vektene sine.</p>
		{@render changeForm(
			lowered.to,
			lowered.from,
			`Angre, tilbake til ${formatKg(lowered.from)}`,
			true
		)}
	</section>
{:else if check.kind === 'missedReps'}
	<section class="card check warning">
		<h3>Training max er trolig for høy</h3>
		<p>
			Toppsettet ble {formatReps(check.actualReps)}, under kravet på {check.minimumReps}. Wendler
			anbefaler å senke training max med 10 % ({formatKg(trainingMax)} → {formatKg(check.lowered)}).
		</p>
		{@render changeForm(
			trainingMax,
			check.lowered,
			`Senk TM til ${formatKg(check.lowered)}`,
			false
		)}
	</section>
{:else if check.kind === 'askIfHeavy' && answeredFine === false}
	<section class="card check">
		<h3>Føltes 100 %-settet tungt?</h3>
		<p>
			Toppsettet i 7. uke skal gå greit. Klarte du ikke alle reps, eller var det en kamp, er
			training max for høy og bør senkes 10 %.
		</p>
		{@render changeForm(
			trainingMax,
			check.lowered,
			`Ja, senk TM til ${formatKg(check.lowered)}`,
			true
		)}
		<button class="btn btn-secondary" type="button" onclick={wentFine}>Nei, det gikk greit</button>
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
</style>
