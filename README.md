# trenings-app

Personal 5/3/1 strength training tracker. Plan training blocks from program templates on
desktop, log workouts on the phone during the session, and check how the day is meant to run.

Built with SvelteKit, SQLite (`node:sqlite`) and `@sveltejs/adapter-node`.

## Requirements

- Node 24 (see `.nvmrc`). Node 22 lacks `DatabaseSync.createTagStore`, which the app relies on.

## Getting started

```sh
npm install
echo "DB_URL=trening.db" > .env
npm run dev
```

The database file is created on first start, and migrations in `src/lib/server/migrations/`
run automatically. A new database comes with the four main lifts, Barbell Row as an
alternative main lift, week templates, supplemental templates, assistance exercises and the
Triumvirate program template.

## Using the app

1. Find a training max: either set it directly in `/admin`, or test it at the gym on the
   phone under **TM-test** (`/tm-tests`, linked from Home). Log one heavy set of 3–5 reps;
   the app estimates the 1RM (Wendler: weight × reps × 0.0333 + weight) and suggests a
   training max of 90 % of it. Testing a couple of lifts per session is fine.
2. Click **Ny blokk**, pick a program template (e.g. Triumvirate), a name and a start date
   (a Monday, defaulting to the first one after any running block; blocks may not overlap).
   Choose the lift for each training day, e.g. Barbell Row instead of Overhead Press.
   Training days, cycles and assistance exercises are prefilled from the template and can be
   adjusted. For each lift, choose the current training max or the one from its latest test.
3. Create the block. All workout sessions are generated and the chosen training maxes saved.
4. On training days, open **Økt** (`/sessions/<date>`) on the phone to tick off sets and log
   the workout. Unsaved input survives the app being closed.
5. If the AMRAP set misses its minimum reps, or the 100 % set in a 7th week is missed or feels
   heavy, the completed session suggests lowering the training max by 10 % (with undo).
   Completed sessions keep the weights they were done with.
6. When a block is done, mark it as completed in `/admin`.

Program templates are seeded via migrations; there is no template editor yet. To add a
template, add a new migration that inserts into `program_templates`,
`program_template_cycles` and `program_template_assistance`.

## Day plan

**Dag** (`/day`) shows how today is meant to run, from waking up to the evening walk: a card
with what should happen now, how long is left and what comes next, then the whole day as a
list. Each weekday button shows that day's training and opens its next date, so **Man** on
a Sunday evening is tomorrow. A training entry named after the lift of a planned session (e.g. "Knebøy") links to
it.

The plan is one weekly template, the same every week, edited per weekday with **Rediger**. It
is seeded with a Monday–Friday plan built around a dog that can't be left alone for more than
six hours; weekends start empty.

## Database migrations

Schema changes go in a new file `src/lib/server/migrations/NNN_description.sql`, where `NNN`
is the next version number. Each migration runs once, in a transaction, and the version is
tracked with `PRAGMA user_version`. Never edit a migration that has already been applied.

## Commands

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the development server                     |
| `npm run build`     | Build for production                             |
| `npm run preview`   | Preview the production build                     |
| `npm run check`     | Svelte type checking                             |
| `npm run lint`      | Prettier + ESLint                                |
| `npm run format`    | Format with Prettier                             |
| `npm run test:unit` | Unit tests (Vitest, server and browser projects) |

Only the server-side tests: `npx vitest run --project server`.

## Deployment

```sh
docker compose up -d --build
```

The database lives at `/app/data/trening.db` in the `db_data` volume and is created and
migrated on first start. Set `ORIGIN` in `docker-compose.yml` to the public URL, otherwise
form submissions are rejected by SvelteKit's CSRF check.
