<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<form method="POST" class="login">
	<label>
		Passord
		<input type="password" name="password" autocomplete="current-password" required />
	</label>
	<button type="submit">Logg inn</button>
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
</form>

<style>
	.login {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 320px;
		margin: 2rem auto;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	input,
	button {
		font: inherit;
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid #d0d0d0;
	}

	button {
		background: #2563eb;
		color: white;
		border: none;
		cursor: pointer;
	}

	.error {
		color: #b91c1c;
		margin: 0;
	}
</style>
