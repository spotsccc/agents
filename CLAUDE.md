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
pnpm test:unit            # Run unit tests in all packages

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

### Edge Functions

When creating a new Edge Function, you MUST:

1. **Create `deno.json`** in the function directory (`packages/supabase/functions/<function-name>/deno.json`):
```json
{
  "imports": {
    "kysely": "npm:kysely",
    "pg": "npm:pg",
    "supabase": "npm:@supabase/supabase-js"
  }
}
```

2. **Create a type-safe wrapper** in `apps/web/src/shared/supabase/edge-functions/`:
   - Create `<function-name>.ts` with request/response types and wrapper function
   - Export from `index.ts`
   - Use the `invokeEdgeFunction` helper from `./invoke.ts`

**Example wrapper (`create-income-transaction.ts`):**
```typescript
import {
  CREATE_INCOME_TRANSACTION,
  type CreateIncomeTransactionRequest,
} from 'supabase/create-income-transaction'
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type CreateIncomeTransactionResponse = {
  transaction_id: string
  entry_id: string
  previous_balance: number
  new_balance: number
  currency: string
  timestamp: string
}

export type { CreateIncomeTransactionRequest }

export function createIncomeTransaction(
  params: CreateIncomeTransactionRequest
): Promise<EdgeFunctionResult<CreateIncomeTransactionResponse>> {
  return invokeEdgeFunction<CreateIncomeTransactionRequest, CreateIncomeTransactionResponse>(
    CREATE_INCOME_TRANSACTION,
    params
  )
}
```

**Error handling:** The `invokeEdgeFunction` helper handles all Supabase error types (`FunctionsHttpError`, `FunctionsRelayError`, `FunctionsFetchError`) and returns a discriminated union `EdgeFunctionResult<T>`.

## Tech Stack

- **Frontend**: Vue 3, Vue Router, TanStack Vue Query, Vee-Validate + Zod
- **Styling**: Tailwind CSS v4, shadcn-vue, Lucide icons
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Build**: Vite 7, Turborepo, pnpm
- **Testing**: Vitest (unit), Playwright (E2E), Storybook, Testing Library

## Unit Testing

### Running Tests

**IMPORTANT**: Tests use Vitest Browser Mode which requires binding to network ports. Due to sandbox restrictions, you MUST run `pnpm test:unit` with `dangerouslyDisableSandbox: true` to avoid `EPERM: operation not permitted` errors on port binding.

### Test Infrastructure

Tests use `@testing-library/vue` + `@testing-library/user-event` + `@testing-library/jest-dom`.

**Key files:**
- `src/shared/tests/setup.ts` — global setup (mocks, cleanup, jest-dom matchers)
- `src/shared/tests/utils.ts` — `renderWithPlugins()` helper
- `src/shared/tests/mocks.ts` — reusable mock implementations
- `src/shared/supabase/__mocks__/index.ts` — Supabase automock

### Writing Tests

**Use `renderWithPlugins` for components with Vue Query:**
```typescript
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'

const { user, emitted } = renderWithPlugins(MyComponent)
```

**Use semantic selectors (NOT CSS selectors):**
```typescript
// ✅ Good — accessible, resilient to implementation changes
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')
screen.getByText('Error message')

// ❌ Bad — fragile, not accessible
wrapper.find('#submit-btn')
wrapper.find('.email-input')
```

**Use `userEvent` for interactions (NOT `trigger`):**
```typescript
// ✅ Good — simulates real user behavior
await user.click(screen.getByRole('button'))
await user.type(screen.getByLabelText('Name'), 'John')

// ❌ Bad — low-level, doesn't simulate real events properly
await wrapper.find('button').trigger('click')
```

**Use `waitFor` for async assertions (NOT multiple flushPromises):**
```typescript
// ✅ Good — declarative, waits for condition
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// ❌ Bad — fragile, magic numbers
await flushPromises()
await nextTick()
await new Promise(r => setTimeout(r, 10))
await flushPromises()
```

**Mock overrides for specific tests:**
```typescript
mockSupabaseFrom.mockReturnValueOnce({
  insert: () => ({
    select: () => ({
      single: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
    }),
  }),
} as ReturnType<typeof mockSupabaseFrom>)
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import MyComponent from '../my-component.vue'

describe('MyComponent', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('does something', async () => {
    const { user } = renderWithPlugins(MyComponent)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

### Anti-patterns to Avoid

1. **No arbitrary timeouts** — never use `wait(5)`, `setTimeout(10)`, etc.
2. **No multiple flushPromises** — use `waitFor` instead
3. **No CSS/ID selectors** — use `getByRole`, `getByLabelText`, `getByText`
4. **No `vi.resetModules()` + dynamic imports** — setup.ts handles mocking
5. **No `wrapper.find().trigger()`** — use `userEvent` methods

## Verification Workflow

**IMPORTANT**: After every code change where the code is expected to work, run verification from the relevant package/app directory:

```bash
cd <package-or-app-dir> && pnpm type-check && pnpm lint && pnpm format && pnpm test:unit
```

Examples:
- `cd apps/web && pnpm type-check && pnpm lint && pnpm format && pnpm test:unit`
- `cd packages/supabase && pnpm type-check && pnpm lint && pnpm format && pnpm test:unit`

This applies to TypeScript/Vue code changes:
- Writing or modifying tests
- Writing or modifying components/functions
- Refactoring code
- Fixing bugs

Does NOT apply to:
- Documentation (markdown files)
- Configuration files (unless they affect build/types)

Do NOT consider a task complete until both type-check and tests pass.

## Code Style

- No semicolons, single quotes, 2-space indent, trailing commas in ES5 contexts
- File naming: kebab-case for all files (e.g., `button.vue`, `dropdown-menu-item.vue`, `use-user.ts`)
- Path alias: `@/` maps to `src/`
