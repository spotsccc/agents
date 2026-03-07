# Web App Guidelines

These instructions apply only to `apps/web`. Combine them with the repository root instructions.

## Commands

Run from `apps/web/`:

```bash
pnpm dev
pnpm type-check && pnpm lint:check && pnpm format:check && pnpm test:unit
pnpm test:e2e
```

## App Structure

```text
src/
├── app/                # App bootstrap, router, global styles
├── components/         # Reusable components shared across pages
│   └── <component>/
│       ├── <component>.vue
│       ├── index.ts
│       └── __tests__/
├── pages/              # Route slices
│   └── <page>/
│       ├── page.vue
│       ├── index.ts
│       ├── components/
│       ├── composables/
│       └── __tests__/
└── shared/             # Cross-cutting concerns
    ├── auth/
    ├── supabase/
    ├── components/ui/
    ├── layouts/
    └── tests/
```

- Route entry: `src/pages/**/page.vue`, exported via `index.ts`
- Page-only components stay in that page slice; move to `src/components/` when reused by 2+ pages
- UI primitives go in `src/shared/components/ui/`

### Key Patterns

- **Authentication**: Supabase Auth via composables (`useUser()`)
- **Data fetching**: TanStack Vue Query for server state
- **Forms**: Vee-Validate + Zod
- **UI components**: shared primitives in `src/shared/components/ui/`

## Testing Guidelines

Web unit tests: Vitest Browser Mode in `src/**/__tests__/`. Web E2E: Playwright in `e2e/`.

Every new component ships with a focused unit test. Test files: `*.spec.ts`.

### Test Infrastructure

- `vitest-browser-vue` and `vitest/browser`
- `src/shared/tests/setup.ts`, `utils.ts` for `renderWithPlugins()`, `mocks.ts`
- `src/shared/supabase/__mocks__/index.ts`

### Patterns

Use `renderWithPlugins()` when the component uses Vue Query or shared plugins:

```ts
import { renderWithPlugins } from '@/shared/tests/utils'
const screen = renderWithPlugins(MyComponent)
```

Prefer semantic queries:

```ts
await expect.element(screen.getByRole('button', { name: 'Submit' })).toBeVisible()
await expect.element(screen.getByLabelText('Email')).toBeVisible()
```

Use `userEvent` for interactions and `vi.waitFor()` for async assertions:

```ts
import { userEvent } from 'vitest/browser'
await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

await vi.waitFor(() => {
  expect(mockFn).toHaveBeenCalled()
})
```

### Anti-patterns

1. No arbitrary timeouts (`setTimeout(10)`)
2. No CSS/ID selectors when semantic queries are available
3. No repeated `flushPromises()` — use `vi.waitFor()`
4. No `wrapper.find().trigger()` in browser-mode tests
5. Clear mocks in `beforeEach` — no stale mock state between tests

## Edge Function Wrappers

When a new Supabase Edge Function is consumed by the web app:

1. Add a typed wrapper in `src/shared/supabase/edge-functions/<function-name>.ts`
2. Export it from `src/shared/supabase/edge-functions/index.ts`
3. Use `invokeEdgeFunction` from `./invoke.ts`

## Coding Style

- `@/` alias maps to `src/`
- Route entries are named `page.vue` and exported via `index.ts`
- Prefer page-local components and composables before promoting shared code
- Shared UI primitives live in `src/shared/components/ui/`
