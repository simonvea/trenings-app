<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { translateLiftName } from '$lib/helpers';
	import AssistanceTable from '$lib/planning/assistance-table.svelte';
	import { assistanceSlots } from '$lib/planning/assistanceForm';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Edits are local until saved
	const savedSlots = () => assistanceSlots(data.liftIds, data.assistance);
	let slots = $state(savedSlots());
	let submitting = $state(false);

	const liftName = (id: number): string =>
		translateLiftName(data.lifts.find((l) => l.id === id)?.name ?? '');
</script>

<div class="edit-block">
	<p>
		<a href={resolve('/blocks/[id]', { id: String(data.block.id) })}>Til blokka</a>
	</p>

	<section>
		<h2 class="section-title">Assistanse</h2>
		<form
			method="POST"
			action="?/assistance"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<AssistanceTable bind:slots exercises={data.exercises} {liftName} />
			<p class="hint">Endringen gjelder økter som ikke er logget ennå.</p>
			<div class="actions">
				<button class="btn" type="submit" disabled={submitting}>Lagre assistanse</button>
				{#if form?.assistanceError}
					<p class="error" role="alert">{form.assistanceError}</p>
				{:else if form?.assistanceSaved}
					<p class="ok" role="status">Lagret.</p>
				{/if}
			</div>
		</form>
	</section>
</div>

<style>
	.edit-block {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.hint {
		margin: 0.6rem 0.25rem 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.actions p {
		margin: 0;
	}
</style>
