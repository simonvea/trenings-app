<script lang="ts">
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();

	const { blocks } = data;
	const today = new Date().toJSON().slice(0, 10);
</script>

<h1>Velkommen til en ny økt!</h1>
<h2>Planer</h2>
<ul>
	{#each blocks as block (block.id)}
		<li>
			<a href={'/blocks/' + block.id}>
				{block.name}
			</a>
		</li>
	{/each}
</ul>
<a href={'/sessions/' + today}>Dagens økt</a>
