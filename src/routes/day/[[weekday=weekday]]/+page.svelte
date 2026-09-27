<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { addDays, formatDayHeading, today } from '$lib/date';
	import { dayFocus, dayStatus, entryPhase, sessionEntry } from '$lib/dayPlan/status';
	import {
		formatDuration,
		minutesOfDay,
		nextDateOf,
		toMinutes,
		weekdayOf
	} from '$lib/dayPlan/time';
	import { kindNames, type DayPlanEntry } from '$lib/dayPlan/types';
	import { translateDay } from '$lib/helpers';
	import { weekdays } from '$lib/planning/types';
	import type { PageProps } from './$types';

	const { data, params }: PageProps = $props();

	// SSR renders the server's day; the phone's clock takes over once hydrated
	let todayDate = $state(today());
	let now = $state(minutesOfDay(new Date()));

	onMount(() => {
		const tick = (): void => {
			todayDate = today();
			now = minutesOfDay(new Date());
		};
		tick();
		const timer = setInterval(tick, 30_000);
		// A PWA reopened from the background may have missed ticks
		const onVisible = (): void => {
			if (document.visibilityState === 'visible') tick();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	const todayWeekday = $derived(weekdayOf(todayDate));
	const selected = $derived(params.weekday ?? todayWeekday);
	const isToday = $derived(selected === todayWeekday);
	const date = $derived(nextDateOf(selected, todayDate));
	const entries = $derived(data.plan[selected]);
	const status = $derived(dayStatus(entries, now));
	const focus = $derived(dayFocus(entries));

	const session = $derived(data.sessions.find((s) => s.date === date));
	const sessionOwner = $derived(session && sessionEntry(entries, session.liftName));

	const tomorrow = $derived(weekdayOf(addDays(todayDate, 1)));
	const relativeDay = $derived(isToday ? 'I dag' : selected === tomorrow ? 'I morgen' : undefined);

	const shortDay = (day: string): string => translateDay(day).slice(0, 3);
	const duration = (e: DayPlanEntry): string =>
		formatDuration(toMinutes(e.end) - toMinutes(e.start));
	const phase = (e: DayPlanEntry) => (isToday ? entryPhase(e, now) : 'upcoming');
</script>

<nav class="days" aria-label="Ukedager">
	{#each weekdays as day (day)}
		{@const dayFocusText = dayFocus(data.plan[day]).join(' · ')}
		<a
			href={resolve('/day/[[weekday=weekday]]', { weekday: day })}
			data-sveltekit-replacestate
			data-sveltekit-noscroll
			aria-current={day === selected ? 'page' : undefined}
			class:today={day === todayWeekday}
			title={dayFocusText || undefined}
		>
			<span class="day-name">{shortDay(day)}</span>
			<span class="day-focus">{dayFocusText || '–'}</span>
		</a>
	{/each}
</nav>

<header class="heading">
	{#if relativeDay}<span class="eyebrow">{relativeDay}</span>{/if}
	<h2>{formatDayHeading(date)}</h2>
	{#if focus.length > 0}
		<p class="focus">{focus.join(' · ')}</p>
	{/if}
</header>

{#if isToday && status.state !== 'empty'}
	<section class="card now" aria-label="Nå">
		{#if status.state === 'active'}
			<span class="eyebrow">Nå · til {status.current.end}</span>
			<span class="now-label" aria-live="polite">{status.current.label}</span>
			{#if status.current.note}<span class="muted">{status.current.note}</span>{/if}
			<span
				class="progress"
				role="progressbar"
				aria-label="Tid brukt av {status.current.label}"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(status.progress * 100)}
			>
				<span style:width="{status.progress * 100}%"></span>
			</span>
			<span class="muted num">{formatDuration(status.remainingMinutes)} igjen</span>
			{#if session && status.current === sessionOwner}
				<a class="btn open-session" href={resolve('/sessions/[date]', { date })}>Åpne økt</a>
			{/if}
			{#if status.next}
				<span class="next">
					Neste: <strong>{status.next.label}</strong>
					<span class="num">{status.next.start}</span>
				</span>
			{/if}
		{:else if status.state === 'before' || status.state === 'gap'}
			<span class="eyebrow">{status.state === 'before' ? 'Dagen starter' : 'Ledig'}</span>
			<span class="now-label" aria-live="polite">{status.next.label}</span>
			<span class="muted num">
				Kl. {status.next.start}, om {formatDuration(status.minutesUntil)}
			</span>
		{:else}
			<span class="eyebrow">Ferdig</span>
			<span class="now-label" aria-live="polite">Dagens plan er gjennomført</span>
			<a
				href={resolve('/day/[[weekday=weekday]]', { weekday: tomorrow })}
				data-sveltekit-replacestate
				data-sveltekit-noscroll
			>
				Se planen for i morgen
			</a>
		{/if}
	</section>
{/if}

{#if session && !sessionOwner}
	<a class="card session-row" href={resolve('/sessions/[date]', { date })}>
		<span>Planlagt økt: <strong>{session.liftName}</strong></span>
		<span class="open">Åpne økt</span>
	</a>
{/if}

{#if entries.length === 0}
	<p class="card empty">Ingen plan for {translateDay(selected).toLowerCase()}.</p>
{:else}
	<ol class="card entries">
		{#each entries as entry (entry.start)}
			{@const entryPhaseNow = phase(entry)}
			<li
				class="entry kind-{entry.kind}"
				class:past={entryPhaseNow === 'past'}
				class:current={entryPhaseNow === 'current'}
				aria-current={entryPhaseNow === 'current' ? 'time' : undefined}
			>
				<span class="time num">
					<span class="start">{entry.start}</span>
					<span class="muted">{entry.end}</span>
				</span>
				<span class="what">
					<span class="visually-hidden">{kindNames[entry.kind]}:</span>
					<strong>{entry.label}</strong>
					{#if entry.note}<span class="muted">{entry.note}</span>{/if}
					{#if session && entry === sessionOwner}
						<a href={resolve('/sessions/[date]', { date })}>Åpne økt · {session.liftName}</a>
					{/if}
				</span>
				<span class="duration muted num">{duration(entry)}</span>
			</li>
		{/each}
	</ol>
{/if}

<a
	class="btn btn-secondary edit"
	href={resolve('/day/[weekday=weekday]/edit', { weekday: selected })}
>
	Rediger {translateDay(selected).toLowerCase()}
</a>

<style>
	.days {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.25rem;
		margin-bottom: 1.25rem;
	}

	.days a {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: var(--tap);
		padding: 0.35rem 0.15rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
		line-height: 1.2;
	}

	.days a.today .day-name {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.days a[aria-current='page'] {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--on-accent);
	}

	.day-name {
		font-weight: 700;
	}

	.day-focus {
		max-width: 100%;
		overflow: hidden;
		font-size: 0.7rem;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.8;
	}

	.heading {
		margin: 0 0.25rem 1rem;
	}

	.heading h2 {
		font-size: 1.6rem;
		font-weight: 800;
	}

	.focus {
		margin: 0.2rem 0 0;
		font-weight: 600;
		color: var(--kind-training);
	}

	.eyebrow {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.now {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		margin-bottom: 1rem;
		padding: 1.1rem;
	}

	.now-label {
		font-size: 1.6rem;
		font-weight: 800;
		line-height: 1.2;
	}

	.progress {
		align-self: stretch;
		height: 8px;
		margin-top: 0.4rem;
		border-radius: 999px;
		background: var(--surface-2);
		overflow: hidden;
	}

	.progress span {
		display: block;
		height: 100%;
		background: var(--accent);
	}

	.open-session {
		align-self: stretch;
		margin-top: 0.5rem;
		min-height: 52px;
		font-size: 1.1rem;
	}

	.next {
		margin-top: 0.5rem;
		padding-top: 0.6rem;
		align-self: stretch;
		border-top: 1px solid var(--border);
	}

	.session-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 60px;
		margin-bottom: 1rem;
		padding: 0.6rem 1rem;
		color: inherit;
		text-decoration: none;
	}

	.open {
		color: var(--accent);
		font-weight: 700;
	}

	.empty {
		margin: 0 0 1rem;
		padding: 1rem;
	}

	.entries {
		margin: 0 0 1rem;
		padding: 0;
		list-style: none;
		overflow: hidden;
	}

	.entry {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.6rem 1rem 0.6rem 0.75rem;
		border-left: 5px solid var(--kind-bar);
	}

	.entry + .entry {
		border-top: 1px solid var(--border);
	}

	.entry.past {
		opacity: 0.5;
	}

	.entry.current {
		background: var(--accent-soft);
	}

	.time {
		display: flex;
		flex-direction: column;
		width: 3rem;
		flex-shrink: 0;
		font-size: 0.85rem;
		line-height: 1.3;
	}

	.start {
		font-size: 1rem;
		font-weight: 700;
	}

	.what {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.what .muted {
		font-size: 0.9rem;
	}

	.what a {
		align-self: flex-start;
		margin-top: 0.25rem;
		padding: 0.35rem 0;
		font-weight: 700;
	}

	.duration {
		flex-shrink: 0;
		font-size: 0.85rem;
	}

	.edit {
		width: 100%;
	}

	.kind-routine {
		--kind-bar: var(--kind-routine);
	}
	.kind-dog {
		--kind-bar: var(--kind-dog);
	}
	.kind-work {
		--kind-bar: var(--kind-work);
	}
	.kind-commute {
		--kind-bar: var(--kind-commute);
	}
	.kind-training {
		--kind-bar: var(--kind-training);
	}
	.kind-meal {
		--kind-bar: var(--kind-meal);
	}
	.kind-social {
		--kind-bar: var(--kind-social);
	}
</style>
