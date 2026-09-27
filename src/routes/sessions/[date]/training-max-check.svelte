<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { formatKg } from '$lib/format';
	import type { TrainingMaxCheck } from '$lib/trainingMax';

	type Props = { check: TrainingMaxCheck; liftId: number; trainingMax: number };

	const { check, liftId, trainingMax }: Props = $props();

	let saving = $state(false);
	let failed = $state('');
</script>

{#snippet lowerForm(lowered: number, label: string, secondary: boolean)}
	<form
		method="POST"
		action="?/lowerTrainingMax"
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
						// Already changed elsewhere; show the current training max
						await invalidateAll();
					} else {
						await update();
					}
				} finally {
					saving = false;
				}
			};
		}}
	>
		<input type="hidden" name="lift_id" value={liftId} />
		<input type="hidden" name="from" value={trainingMax} />
		<button class="btn" class:btn-secondary={secondary} type="submit" disabled={saving}>
			{label}
			{formatKg(lowered)}
		</button>
	</form>
	{#if failed}
		<p class="error" role="alert">{failed}</p>
	{/if}
{/snippet}

{#if check.kind === 'missedReps'}
	<section class="card check warning">
		<h3>Training max er trolig for tung</h3>
		<p>
			Du fikk {check.actualReps} av minst {check.minimumReps} reps på toppsettet. Wendler anbefaler å
			senke training max med 10 % ({formatKg(trainingMax)} → {formatKg(check.lowered)}).
		</p>
		{@render lowerForm(check.lowered, 'Senk TM til', false)}
	</section>
{:else if check.kind === 'askIfHeavy'}
	<section class="card check">
		<h3>Føltes 100 %-settet tungt?</h3>
		<p>
			Toppsettet i 7. uke skal gå greit. Klarte du ikke alle reps, eller var det en kamp, er
			training max for høy og bør senkes 10 %.
		</p>
		{@render lowerForm(check.lowered, 'Ja, senk TM til', true)}
	</section>
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
