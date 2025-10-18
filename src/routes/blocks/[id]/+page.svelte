<script lang="ts">
	const { data } = $props();

	const { block } = data;
</script>

// Jeg vil se overordnet plan -> syklus m/ type og template. // Kunne klikke meg inn på en syklus og
kunne se hvor jeg er nå, hvilke som er fullført osv.
<h1>{block.name}</h1>
<h2>Mål:</h2>
<p>{block.goals}</p>

<table>
	<thead>
		<tr>
			<th>{block.training_day_1}</th>
			<th>{block.training_day_2}</th>
			<th>{block.training_day_3}</th>
			<th>{block.training_day_4}</th>
		</tr>
	</thead>
	<tbody>
		<tr> </tr>
	</tbody>
</table>
