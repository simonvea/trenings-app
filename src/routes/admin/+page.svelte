<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { translateLiftName } from '$lib/helpers';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const formatDate = (date: string | null | undefined): string =>
		date ? new Date(date).toLocaleDateString('no') : '–';
</script>

<div class="admin">
	<section>
		<h2>Training max</h2>
		<form method="POST" action="?/updateTm" use:enhance={() => ({ update }) => update({ reset: false })}>
			<table>
				<thead>
					<tr>
						{#each data.lifts as lift (lift.id)}
							<th>{translateLiftName(lift.name)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					<tr>
						{#each data.lifts as lift (lift.id)}
							<td>
								<input type="hidden" name="lift_id" value={lift.id} />
								<input
									type="number"
									name={'tm_' + lift.id}
									value={lift.current_training_max}
									min="0"
									step="0.5"
									required
								/> kg
							</td>
						{/each}
					</tr>
				</tbody>
			</table>
			<button type="submit">Lagre training max</button>
			{#if form?.tmError}
				<p class="error">{form.tmError}</p>
			{:else if form?.tmSaved}
				<p class="ok">Lagret.</p>
			{/if}
		</form>
	</section>

	<section>
		<div class="heading">
			<h2>Treningsblokker</h2>
			<a class="button" href={resolve('/admin/blocks/new')}>Ny blokk</a>
		</div>
		{#if data.blocks.length === 0}
			<p>Ingen blokker ennå.</p>
		{:else}
			<table>
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
							<td><a href={resolve('/blocks/[id]', { id: String(block.id) })}>{block.name}</a></td>
							<td>{block.template_name ?? '–'}</td>
							<td>{formatDate(block.start_date)}</td>
							<td>{formatDate(block.end_date)}</td>
							<td>{block.sessions_completed} / {block.sessions_total}</td>
							<td>
								{#if block.completed_date}
									Fullført {formatDate(block.completed_date)}
								{:else}
									<form method="POST" action="?/completeBlock" use:enhance>
										<input type="hidden" name="block_id" value={block.id} />
										<button type="submit">Marker som fullført</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		{#if form?.blockError}
			<p class="error">{form.blockError}</p>
		{/if}
	</section>
</div>

<style>
	.admin {
		max-width: 1100px;
		margin: 0 auto;
	}

	section {
		margin-bottom: 2.5rem;
	}

	.heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		margin-bottom: 1rem;
	}

	th,
	td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: #2563eb;
		color: white;
		font-weight: 600;
	}

	input[type='number'] {
		width: 5rem;
		padding: 0.25rem;
	}

	button,
	.button {
		padding: 0.5rem 1rem;
		background: #2563eb;
		color: white;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
		font: inherit;
		text-decoration: none;
	}

	td button {
		background: #6b7280;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}

	.error {
		color: #b91c1c;
	}

	.ok {
		color: #047857;
	}
</style>
