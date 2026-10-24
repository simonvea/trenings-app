# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npx vitest run --project server` - Run only server-side (node) tests, e.g. `src/lib/planning/*.spec.ts`
- `npx vitest run --project client --browser.headless` - Browser tests without a display
  (the default launches a visible Chromium and fails without `$DISPLAY`)

Requires Node 24 (`.nvmrc`); `node:sqlite` `createTagStore` is missing in Node 22.
`DB_URL` in `.env` points at the SQLite file; it is created and migrated on startup.

## Architecture

This is a **5/3/1 strength training tracker**.

### Database Architecture

The app uses SQLite with a comprehensive schema for tracking 5/3/1 powerlifting programs:

**Core Entities:**

- `lifts` - Main lifts with training maxes: Squat, Bench, Deadlift, OHP, plus Barbell Row as an alternative (a block picks 4)
- `training_blocks` - Training phases with scheduled workout days
- `cycles` - Training cycles: leader/anchor are 3 weeks, a 7th week is 1 week
- `workout_sessions` - Individual workout sessions linked to cycles and lifts. `duration_seconds` is
  timed on the phone from session start to the last logged set; rest between sets is not stored
- `week_templates` - Percentage/rep schemes for different week types (5+, 3+, 5/3/1+, Deload)

**Supporting Tables:**

- `supplemental_templates` - FSL, BBB, SSL supplemental work patterns
- `assistance_exercises` - Pull/push/legs accessory movements
- `main_work`, `supplemental_work`, `assistance_work` - Actual workout data. `main_work.training_max`
  is the TM the session was done at; completed sessions show weights from it, not the current TM
- `training_max_history` - Historical training max progression
- `training_max_tests` - Heavy test sets logged on the phone, with the TM calculated from them
- `program_templates` (+ `_cycles`, `_assistance`) - Reusable block defaults (e.g. Triumvirate), copied into a block on creation
- `block_assistance` - Planned assistance exercises per lift for a block
- `day_plan_entries` - How each weekday should run (walks, work, commute, training), one weekly
  template keyed by weekday, not by date

### Key Files

- `src/lib/server/db.ts` - SQLite connection using Node.js DatabaseSync, runs migrations on startup, `transaction()` helper
- `src/lib/server/migrations/NNN_*.sql` - Schema migrations, tracked with `PRAGMA user_version`. Add a new numbered file for schema changes; never edit an applied one
- `src/lib/planning/` - Block planning: `schedule.ts` (pure session date planning), `blockForm.ts` (form parsing/validation), `db.server.ts` (planning queries)
- `src/lib/trainingMax.ts` - Pure TM rules: 1RM estimate, TM from a test, which TM to suggest
  for a new block, when to suggest lowering it after a session (a missed AMRAP: 10 % off; a set at the full
  training max under Wendler's three reps: 85 % of the estimated 1RM), and when to raise it after a
  cycle (`trainingMaxIncrease`; Wendler's +5 kg lower body, +2.5 kg upper body, hardcoded in
  `trainingMaxIncrement`)
- `src/lib/types.ts` - TypeScript definitions for database entities
- `src/routes/admin/` - Desktop admin: training maxes, blocks, new block from a program template,
  edit a block's planned assistance (`blocks/[id]/edit`), and a per-lift button that raises a
  training max by Wendler's increment
- `src/routes/tm-tests/` - Phone page for logging TM tests
- `src/lib/dayPlan/` - Day plan: `time.ts` (clock times, a weekday's next date), `status.ts`
  (pure "now / next" for a time of day, which entry a session belongs to), `form.ts` (edit form
  parsing/validation), `db.server.ts`. Pages in `src/routes/day/` use the `weekday` param
  matcher (`src/params/weekday.ts`): `/day` is today, `/day/[weekday]` that weekday's next
  date, `/day/[weekday]/edit` edits the weekday
- `src/routes/sessions/[date]/` - Phone session logging; `training-max-check.svelte` is the
  post-session TM card: "lower TM" after missed reps, and "raise TM" (or a hold note) on a lift's
  latest completed week-3 session of a leader/anchor cycle

Dates are local calendar days (`src/lib/date.ts`). The server runs with `TZ=Europe/Oslo`, which
Node follows; SQLite's `date('now', 'localtime')` may not in the Alpine image (no tzdata), so
compute date bounds in JS and pass them in. Dates that matter to the user (session completion,
test date, today's day plan) are still decided on the phone, so a PWA left open overnight stays
right.

### Planning workflow

1. `/admin` - set training maxes (writes `training_max_history`), or raise one by Wendler's
   increment after a cycle (the session card offers the same, but holds it after missed reps),
   list and complete blocks. The 7th week test does not gate the raise; it only checks the TM
2. `/admin/blocks/new` - pick a program template; its cycles and assistance prefill the form.
   Per lift, choose current TM or the latest test (`defaultTrainingMaxSource` picks the default).
   A block may not overlap a running one
3. On submit: `parseBlockForm` validates, `planBlock` computes cycles and session dates,
   `createBlock` inserts block, cycles, `block_assistance` and `workout_sessions` and writes the
   chosen training maxes in one transaction
4. `/sessions/[date]` - shows main work, supplemental (hidden when the template has 0 sets) and
   the block's planned assistance for that lift

### Deployment

- `.github/workflows/deploy.yml`: on push to `main`, runs lint/check/test, pushes
  `registry.opheimutvikling.no/trenings-app:{sha,latest}`, then SSHes to the VPS and runs
  `docker compose pull && up -d` in `/opt/infra/trenings-app` (compose file lives in the infra repo)
- Secrets: `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`
- Served at https://trening.opheimutvikling.no; nginx rate-limits `/login`
- SQLite file on the VPS host: `/opt/infra/trenings-app/data/trening.db` (bind mount to `/app/data`)
- `DB_URL` is read at runtime (`$env/dynamic/private`)

### Auth

- Single user. `src/hooks.server.ts` redirects to `/login` unless the `session` cookie verifies
- `src/lib/auth/session.ts`: stateless token `<expiresAtMs>.<hmac>`, 1 year TTL, no DB
- Env `AUTH_PASSWORD` and `AUTH_SECRET` (required at startup). Rotate `AUTH_SECRET` to log out all devices
- Public paths: `/login`, `/health` (docker healthcheck)

# SvelteKit

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
