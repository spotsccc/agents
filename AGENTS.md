# Repository Guidelines

## Project Overview

This is a `pnpm` + Turborepo monorepo.

- `apps/web`: Vue 3 SPA
- `apps/bot`: Telegram bot (TypeScript, `grammy`, `hono`) — runtime in `src/`, tests in `__tests__/`
- `packages/supabase`: database migrations, schema types, Edge Function contracts — `migrations/`, `scheme/`, `functions/<name>/`
- `docs`: product, backlog, and architecture documentation

## Tech Stack

- **Frontend**: Vue 3, Vue Router, TanStack Vue Query, Vee-Validate, Zod
- **Styling**: Tailwind CSS v4, Reka UI, Lucide icons
- **Bot**: TypeScript, `grammy`, `hono`
- **Backend**: Supabase Auth, PostgreSQL, Edge Functions
- **Build**: Vite 7, Turborepo, pnpm
- **Testing**: Vitest, `vitest-browser-vue`, Playwright, Deno test

## Build, Test, and Development Commands

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # run workspace dev tasks through Turbo
pnpm build            # build all packages and apps
pnpm lint:check       # CI-style lint checks
pnpm type-check       # TypeScript and Deno checks
pnpm test:all         # unit tests and web E2E tests
pnpm supabase:start   # start local Supabase
```

Workspace-scoped: `pnpm --filter web dev`, `pnpm --filter bot dev`, `pnpm --filter supabase db:push`.

After changing application code, run verification from the affected workspace:

```bash
cd <package-or-app-dir> && pnpm type-check && pnpm lint:check && pnpm format:check && pnpm test:unit
```

## Workspace-Specific Instructions

- `apps/web`: see `apps/web/AGENTS.md` or `apps/web/CLAUDE.md` for app structure, route conventions, frontend testing patterns, and typed Edge Function wrappers
- `apps/bot`: see `apps/bot/AGENTS.md` or `apps/bot/CLAUDE.md` for polling vs webhook runtime, env validation, and request-level bot tests
- `packages/supabase`: see `packages/supabase/AGENTS.md` or `packages/supabase/CLAUDE.md` for migrations, Deno Edge Functions, generated schema types, and contract exports

## Testing Guidelines

- Web unit tests: Vitest Browser Mode in `apps/web/src/**/__tests__/`
- Web E2E: Playwright in `apps/web/e2e/`
- Bot tests: Vitest in `apps/bot/__tests__/`
- Supabase tests: `deno test`

## Supabase & Edge Functions

Schema types: `packages/supabase/scheme/index.ts`.

When adding a new Edge Function:

1. Create `packages/supabase/functions/<function-name>/deno.json`
2. Add the function implementation and `contract.ts` in that folder
3. Export the contract from `packages/supabase/package.json` when other workspaces consume it
4. Add typed wrappers in the consuming workspace following its local instructions

## Coding Style

- No semicolons, single quotes, 2-space indentation, trailing commas (ES5)
- Prefer kebab-case filenames: `wallet-balance-display.vue`, `use-user-settings.ts`
- Test files named `*.spec.ts`
- Export public APIs through `index.ts` where the pattern exists

## Documentation

Docs live in `docs/`. Start with `docs/README.md`. When changing functionality or architecture, update the matching doc:

- Frontend: `docs/architecture/frontend.md`
- Backend/Edge Functions: `docs/architecture/backend.md`
- Database/RLS: `docs/architecture/database.md`
- Product scope: `docs/overview.md`

## Commit & Pull Request Guidelines

Follow Conventional Commits: `fix:`, `feat:`, `docs:`, `ci:`, `refactor:`. Short imperative subjects.

PRs should include: summary of affected workspaces, linked task/issue, verification steps run, screenshots for UI changes. Do not merge if CI checks are failing.
