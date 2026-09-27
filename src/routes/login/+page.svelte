<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<form method="POST" class="card login">
	<img src="/icons/icon-192.png" alt="" width="64" height="64" />
	<label>
		Passord
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="password"
			name="password"
			autocomplete="current-password"
			required
			autofocus
			aria-invalid={form?.error ? 'true' : undefined}
		/>
	</label>
	<button class="btn" type="submit">Logg inn</button>
	{#if form?.error}
		<p class="error" role="alert">{form.error}</p>
	{/if}
</form>

<style>
	.login {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 360px;
		margin: 2rem auto;
		padding: 1.5rem;
	}

	img {
		align-self: center;
		border-radius: 14px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-weight: 600;
	}

	input {
		min-height: 48px;
	}

	.btn {
		min-height: 48px;
	}

	.error {
		margin: 0;
	}
</style>
