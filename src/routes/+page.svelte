<script lang="ts">
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();

	const plans = data.plans;
</script>

<h1>Velkommen til en ny økt!</h1>
<h2>Planer</h2>
<ul>
	{#each plans as plan (plan.id)}
		<li>{plan.name}</li>
	{/each}
</ul>
