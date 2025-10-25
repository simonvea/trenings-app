# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run Svelte type checking
- `npm run lint` - Run linting (Prettier + ESLint)
- `npm run format` - Format code with Prettier
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test` - Run all tests

## Architecture

This is a **5/3/1 strength training tracker** built with:

- **SvelteKit** - Full-stack web framework with SSR
- **SQLite** - Database using Node.js `DatabaseSync` API
- **TypeScript** - Type safety throughout
- **Adapter Node** - Deployed as Node.js application (migrated from Cloudflare)

### Database Architecture

The app uses SQLite with a comprehensive schema for tracking 5/3/1 powerlifting programs:

**Core Entities:**

- `lifts` - The four main lifts (Squat, Bench, Deadlift, OHP) with training maxes
- `training_blocks` - Training phases with scheduled workout days
- `cycles` - 3-week training cycles (leader/anchor/7th week variations)
- `workout_sessions` - Individual workout sessions linked to cycles and lifts
- `week_templates` - Percentage/rep schemes for different week types (5+, 3+, 5/3/1+, Deload)

**Supporting Tables:**

- `supplemental_templates` - FSL, BBB, SSL supplemental work patterns
- `assistance_exercises` - Pull/push/legs accessory movements
- `main_work`, `supplemental_work`, `assistance_work` - Actual workout data
- `training_max_history` - Historical training max progression

### Key Files

- `src/lib/server/db.ts` - SQLite connection using Node.js DatabaseSync
- `src/lib/db/queries.ts` - Dynamic SQL query generators (uses template literals, not prepared statements)
- `src/lib/types.ts` - Comprehensive TypeScript definitions for database entities
- Database schema in `init.sql` with sample data

### Data Flow

1. **Server Load Functions** (`+page.server.ts`) query SQLite using tagged template literals
2. **Database queries** return typed results matching TypeScript interfaces
3. **Components** receive server data and render workout sessions, cycles, blocks
4. **Forms** submit back to server actions for database updates

### Key Patterns

- Uses SvelteKit's server-side data loading pattern extensively
- Database access through `sql` tagged template function from `db.ts`
- Norwegian language used in some UI elements and types
- Training max calculations based on percentages from week templates
- Workout sessions auto-generated when cycles are created

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

