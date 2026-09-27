# trenings-app

Personal 5/3/1 strength training tracker. Plan training blocks from program templates on
desktop, log workouts on the phone during the session.

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
run automatically. A new database comes with the four main lifts, week templates,
supplemental templates, assistance exercises and the Triumvirate program template.

## Using the app

1. Open `/admin` and set the training max for each lift.
2. Click **Ny blokk**, pick a program template (e.g. Triumvirate), a name and a start date
   (must be a Monday). Training days, cycles and assistance exercises are prefilled from the
   template and can be adjusted. The preview shows the dates of each cycle.
3. Create the block. All workout sessions are generated.
4. On training days, open **Dagens økt** (`/sessions/<date>`) to see the main sets and the
   planned assistance, and log the workout.
5. When a block is done, mark it as completed in `/admin`.

Program templates are seeded via migrations; there is no template editor yet. To add a
template, add a new migration that inserts into `program_templates`,
`program_template_cycles` and `program_template_assistance`.

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
