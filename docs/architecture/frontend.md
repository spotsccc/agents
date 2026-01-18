# Frontend Architecture

[← Back to Architecture](./README.md) | [Backend →](./backend.md)

## Overview

The frontend is a Vue 3 Single Page Application (SPA) built with TypeScript, using modern patterns for state management, routing, and component composition.

## Project Structure

```
apps/web/src/
├── app/                    # Application bootstrap
│   ├── main.ts             # Entry point
│   ├── app.vue             # Root component
│   └── router/             # Vue Router configuration
│
├── pages/                  # Page modules (route-based)
│   ├── auth/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── wallets/            # Wallets list page
│   └── wallet/             # Single wallet pages
│       ├── page.vue
│       ├── transactions/
│       └── components/
│
├── components/             # Shared components
│   └── transaction-list-item/
│
└── shared/                 # Cross-cutting concerns
    ├── auth/               # Auth composables
    ├── supabase/           # Supabase client + edge functions
    ├── components/ui/      # shadcn-vue components
    ├── layouts/            # Layout components
    └── tests/              # Test utilities
```

### Component Organization

| Location | Purpose | Example |
|----------|---------|---------|
| `pages/**/page.vue` | Route entry points | `wallet/page.vue` |
| `pages/**/components/` | Page-specific components | `wallet/components/wallet-balance-display.vue` |
| `components/` | Shared across pages | `transaction-list-item/` |
| `shared/components/ui/` | shadcn-vue primitives | `button/`, `input/` |

## State Management

### TanStack Vue Query

Server state is managed with TanStack Query:

```typescript
// Fetching data
const { data: wallets, isLoading } = useQuery({
  queryKey: ['wallets'],
  queryFn: () => supabase.from('wallets').select('*')
})

// Mutations with cache invalidation
const { mutate } = useMutation({
  mutationFn: createIncomeTransaction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }
})
```

**Benefits:**
- Automatic caching and background refetch
- Loading and error states
- Optimistic updates
- Query invalidation on mutations

### Auth State

Authentication state uses a dedicated composable:

```typescript
// useUser composable
const { user, isLoading } = useUser()

// Reactive - updates when auth state changes
watch(user, (newUser) => {
  if (newUser) {
    // User signed in
  }
})
```

See [Authentication](../features/authentication.md) for details.

## Routing

### Route Structure

```typescript
const routes = [
  // Public routes
  { path: '/auth/sign-in', component: SignInPage },
  { path: '/auth/sign-up', component: SignUpPage },

  // Protected routes (require auth)
  { path: '/wallets', component: WalletsPage },
  { path: '/wallets/:id', component: WalletPage },
  { path: '/wallets/:id/transactions', component: WalletTransactionsPage },
  { path: '/wallets/:id/transactions/create', component: CreateTransactionPage },

  // Redirects
  { path: '/', redirect: '/wallets' },
  { path: '/:pathMatch(.*)*', redirect: '/wallets' }
]
```

### Navigation Guards

```typescript
router.beforeEach(async (to) => {
  const { user } = await getCurrentUser()

  // Redirect unauthenticated users to sign-in
  if (!user && !to.path.startsWith('/auth')) {
    return '/auth/sign-in'
  }

  // Redirect authenticated users away from auth pages
  if (user && to.path.startsWith('/auth')) {
    return '/wallets'
  }
})
```

## UI Components

### shadcn-vue

UI primitives come from shadcn-vue (built on Reka UI):

```bash
# Add new component
npx shadcn-vue@latest add button
npx shadcn-vue@latest add dialog
```

Components are copied to `src/shared/components/ui/` for full customization.

### Component Patterns

**Form Components:**
```vue
<template>
  <form @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="amount">
      <FormItem>
        <FormLabel>Amount</FormLabel>
        <FormControl>
          <Input v-bind="componentField" type="number" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit">Submit</Button>
  </form>
</template>
```

**Loading States:**
```vue
<template>
  <TransactionListItem v-if="!isLoading" :transaction="data" />
  <TransactionListItemSkeleton v-else />
</template>
```

## Form Validation

Forms use Vee-Validate with Zod schemas:

```typescript
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  description: z.string().optional()
}).refine(
  (data) => data.type !== 'expense' || data.categoryId,
  { message: 'Category required for expenses', path: ['categoryId'] }
)

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(schema)
})
```

**Benefits:**
- Type-safe validation
- Conditional validation with `.refine()`
- Integration with UI components via `FormField`

## Development Commands

```bash
# Development
pnpm dev              # Start Vite dev server

# Type checking
pnpm type-check       # Run vue-tsc

# Testing
pnpm test:unit        # Run Vitest
pnpm test:e2e         # Run Playwright

# Code quality
pnpm lint             # ESLint
pnpm format           # Prettier

# Build
pnpm build            # Production build

# Storybook
pnpm storybook        # Component documentation
```

## Testing

See [CLAUDE.md](../../CLAUDE.md#unit-testing) for detailed testing guidelines.

**Key patterns:**

```typescript
import { screen, waitFor } from '@testing-library/vue'
import { renderWithPlugins } from '@/shared/tests/utils'

it('submits form', async () => {
  const { user } = renderWithPlugins(MyComponent)

  await user.type(screen.getByLabelText('Amount'), '100')
  await user.click(screen.getByRole('button', { name: 'Submit' }))

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
})
```

## Related Documentation

- [Backend Architecture](./backend.md) — Edge Functions and API
- [Database Schema](./database.md) — Data model
- [Features](../features/README.md) — Feature documentation
