# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 + TypeScript wallet and transaction management application built as a Turborepo monorepo with Supabase backend.

## Development Commands

```bash
# Root commands (pnpm workspace)
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in dev mode
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm format               # Format with Prettier

# Supabase commands
pnpm supabase:start       # Start local Supabase
pnpm supabase:stop        # Stop local Supabase
pnpm supabase:console     # Open Supabase dashboard
pnpm supabase:functions-serve   # Serve Edge Functions locally
pnpm supabase:functions-deploy  # Deploy Edge Functions
```

### Web App (`apps/web/`)

```bash
pnpm dev              # Vite dev server
pnpm build            # Type-check + production build
pnpm test:unit        # Run Vitest unit tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm type-check       # Vue TypeScript checking (vue-tsc)
pnpm storybook        # Start Storybook on port 6006
pnpm lint             # ESLint with auto-fix
pnpm format           # Prettier formatting
```

## Architecture

### Monorepo Structure

```
apps/web/          # Vue 3 SPA (main application)
packages/supabase/ # Database schema types + Edge Functions
```

### Web App Structure (Feature-Sliced Design)

```
src/
├── app/           # App bootstrap, router, global styles
├── pages/         # Feature pages (auth/, wallets/, wallet/)
└── shared/        # Cross-cutting concerns
    ├── auth/      # Auth composables (useUser, useSignIn, etc.)
    ├── supabase/  # Supabase client
    ├── components/ui/  # shadcn-vue components
    └── layouts/   # Layout components
```

### Key Patterns

**Authentication**: Supabase Auth with reactive state via `useUser()` composable. Router guards redirect unauthenticated users to `/auth/sign-in`.

**Data Fetching**: TanStack Vue Query for server state. Auth mutations (`useSignIn`, `useSignUp`, `useLogOut`) auto-invalidate queries on success.

**UI Components**: shadcn-vue (Reka UI) with "new-york" style. Add components via `npx shadcn-vue@latest add <component>`.

**Forms**: Vee-Validate with Zod schemas for type-safe validation.

### Supabase Package

Exports TypeScript types from `./scheme/index.ts` for database tables (wallets, transactions, categories, etc.) and Edge Function contracts.

## Tech Stack

- **Frontend**: Vue 3, Vue Router, TanStack Vue Query, Vee-Validate + Zod
- **Styling**: Tailwind CSS v4, shadcn-vue, Lucide icons
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Build**: Vite 7, Turborepo, pnpm
- **Testing**: Vitest (unit), Playwright (E2E), Storybook

## Code Style

- No semicolons, single quotes, 2-space indent, trailing commas in ES5 contexts
- File naming: kebab-case for all files (e.g., `button.vue`, `dropdown-menu-item.vue`, `use-user.ts`)
- Path alias: `@/` maps to `src/`
