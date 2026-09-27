<script lang="ts">
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { formatShortDate, localDateOfUtcTimestamp } from '$lib/date';
	import { formatKg } from '$lib/format';
	import { translateLiftName } from '$lib/helpers';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const testByLift = $derived(new Map(data.latestTests.map((t) => [t.lift_id, t])));

	const formatDate = (date: string | null | undefined): string =>
		date ? formatShortDate(date.slice(0, 10)) : '–';

	// Completing hides the block's sessions and cannot be undone here, so it takes a second
	// click. The button turns into the confirm under the pointer, so a double click is ignored.
	let confirmingBlockId = $state<number>();
	let armedAt = 0;
	let confirmTimer: ReturnType<typeof setTimeout> | undefined;
	function askToComplete(id: number, event: MouseEvent): void {
		confirmingBlockId = id;
		armedAt = event.detail > 0 ? Date.now() : 0;
		clearTimeout(confirmTimer);
		confirmTimer = setTimeout(() => (confirmingBlockId = undefined), 4000);
	}
	onDestroy(() => clearTimeout(confirmTimer));
</script>

<div class="admin">
	<section>
		<h2 class="section-title">Training max</h2>
		<form
			class="card tm"
			method="POST"
			action="?/updateTm"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
		>
			<div class="lifts">
				{#each data.lifts as lift (lift.id)}
					{@const test = testByLift.get(lift.id)}
					<div class="lift">
						<label class="lift-name" for={'tm_' + lift.id}>{translateLiftName(lift.name)}</label>
						<input type="hidden" name="lift_id" value={lift.id} />
						<span class="with-unit">
							<input
								class="num"
								inputmode="decimal"
								autocomplete="off"
								id={'tm_' + lift.id}
								name={'tm_' + lift.id}
								value={lift.current_training_max.toLocaleString('nb', { useGrouping: false })}
								required
							/>
							<span class="muted">kg</span>
						</span>
						<span class="muted updated">
							Endret {formatShortDate(localDateOfUtcTimestamp(lift.updated_at))}
						</span>
						{#if test}
							<span class="muted updated">
								Test {formatShortDate(test.test_date)}: {formatKg(test.training_max)}
							</span>
						{/if}
					</div>
				{/each}
			</div>
			<div class="actions">
				<button class="btn" type="submit">Lagre training max</button>
				<a href={resolve('/tm-tests')}>TM-test</a>
				{#if form?.tmError}
					<p class="error" role="alert">{form.tmError}</p>
				{:else if form?.tmSaved}
					<p class="ok" role="status">Lagret.</p>
				{/if}
			</div>
		</form>
	</section>

	<section>
		<div class="heading">
			<h2 class="section-title">Treningsblokker</h2>
			<a class="btn" href={resolve('/admin/blocks/new')}>Ny blokk</a>
		</div>
		{#if data.blocks.length === 0}
			<p class="card empty">Ingen blokker ennå.</p>
		{:else}
			<div class="table-wrap">
				<table class="table">
					<thead>
						<tr>
							<th>Navn</th>
							<th>Mal</th>
							<th>Start</th>
							<th>Slutt</th>
							<th>Økter</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.blocks as block (block.id)}
							<tr>
								<td>
									<a href={resolve('/blocks/[id]', { id: String(block.id) })}>{block.name}</a>
								</td>
								<td>{block.template_name ?? '–'}</td>
								<td class="num">{formatDate(block.start_date)}</td>
								<td class="num">{formatDate(block.end_date)}</td>
								<td class="num">{block.sessions_completed} / {block.sessions_total}</td>
								<td>
									{#if block.completed_date}
										<span class="badge">Fullført {formatDate(block.completed_date)}</span>
									{:else}
										<form
											method="POST"
											action="?/completeBlock"
											use:enhance={({ cancel }) => {
												if (Date.now() - armedAt < 400) {
													cancel();
													return;
												}
												confirmingBlockId = undefined;
											}}
										>
											<input type="hidden" name="block_id" value={block.id} />
											<!-- One button that changes role, so keyboard focus survives arming and disarming -->
											<button
												type={confirmingBlockId === block.id ? 'submit' : 'button'}
												class="btn small"
												class:btn-secondary={confirmingBlockId !== block.id}
												class:confirm={confirmingBlockId === block.id}
												onclick={(event) => {
													if (confirmingBlockId !== block.id) askToComplete(block.id, event);
												}}
											>
												{confirmingBlockId === block.id ? 'Fullfør blokka?' : 'Marker som fullført'}
											</button>
										</form>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		{#if form?.blockError}
			<p class="error" role="alert">{form.blockError}</p>
		{/if}
	</section>

	<form class="logout" method="POST" action={resolve('/logout')}>
		<button type="submit" class="btn btn-secondary">Logg ut</button>
	</form>
</div>

<style>
	.admin {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.tm {
		padding: 1rem;
	}

	.lifts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.lift {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.lift-name {
		font-weight: 700;
	}

	.with-unit {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.with-unit input {
		width: 100%;
		max-width: 7rem;
		font-size: 1.15rem;
		font-weight: 700;
	}

	.updated {
		font-size: 0.8rem;
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

	.heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.6rem;
	}

	.heading .section-title {
		margin-bottom: 0;
	}

	.empty {
		padding: 1rem;
		margin: 0;
	}

	.small {
		min-height: 36px;
		padding: 0.3rem 0.8rem;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.confirm {
		background: var(--danger);
	}

	.confirm:hover {
		background: var(--danger);
	}

	.badge {
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: var(--success-soft);
		color: var(--success);
		font-size: 0.85rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.logout {
		align-self: flex-start;
	}
</style>
