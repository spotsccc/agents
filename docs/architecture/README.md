# Architecture Overview

[← Back to Documentation](../README.md)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Vue 3     │  │  TanStack   │  │     shadcn-vue          │  │
│  │   Router    │  │   Query     │  │   (Reka UI + Tailwind)  │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         └────────┬───────┘                                       │
│                  │                                               │
│         ┌────────▼────────┐                                      │
│         │ Supabase Client │                                      │
│         └────────┬────────┘                                      │
└──────────────────┼──────────────────────────────────────────────┘
                   │ HTTPS
┌──────────────────┼──────────────────────────────────────────────┐
│                  │           Supabase                           │
│  ┌───────────────▼───────────────┐                              │
│  │         Supabase Auth         │                              │
│  └───────────────┬───────────────┘                              │
│                  │                                               │
│  ┌───────────────▼───────────────┐    ┌─────────────────────┐   │
│  │       Edge Functions          │───►│    PostgreSQL       │   │
│  │  (Deno + Kysely)              │    │    + RLS Policies   │   │
│  │                               │    │                     │   │
│  │  • create-income-transaction  │    │  Tables:            │   │
│  │  • create-expense-transaction │    │  • users            │   │
│  │  • create-transfer-transaction│    │  • wallets          │   │
│  │  • create-exchange-transaction│    │  • wallet_balances  │   │
│  └───────────────────────────────┘    │  • transactions     │   │
│                                       │  • transaction_entries │
│                                       │  • categories       │   │
│                                       │  • income_sources   │   │
│                                       │  • currencies       │   │
│                                       └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Sections

| Document | Description |
|----------|-------------|
| [Frontend](./frontend.md) | Vue 3 application structure, state management, components |
| [Backend](./backend.md) | Supabase Edge Functions, API design, transaction handling |
| [Database](./database.md) | PostgreSQL schema, relationships, data model |

## Key Design Decisions

### Monorepo Structure

The project uses Turborepo with pnpm workspaces:

```
agents/
├── apps/
│   └── web/              # Vue 3 SPA
└── packages/
    └── supabase/         # DB types + Edge Functions
```

**Why monorepo?**
- Shared TypeScript types between frontend and backend
- Single source of truth for database schema
- Coordinated deployments
- Simplified dependency management

### Serverless Backend

All business logic runs in [Supabase Edge Functions](./backend.md):

**Why Edge Functions over traditional API?**
- No server management
- Auto-scaling
- Built-in authentication integration
- Direct database access with connection pooling
- TypeScript/Deno runtime

### Type-Safe Database Access

Database queries use [Kysely ORM](./backend.md#kysely-orm):

**Why Kysely?**
- Full TypeScript type inference
- SQL-like syntax (no magic strings)
- Works with Deno
- Compile-time query validation

### Component-Driven UI

UI built with [shadcn-vue](./frontend.md#ui-components):

**Why shadcn-vue?**
- Copy-paste components (no npm dependency)
- Full customization control
- Built on Reka UI (accessible primitives)
- Tailwind CSS integration

## Data Flow

### Transaction Creation Flow

```
User Action
    │
    ▼
┌─────────────┐
│ Vue Form    │ ← Vee-Validate + Zod validation
│ Component   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ TanStack    │ ← Optimistic updates, error handling
│ Mutation    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Edge        │ ← Authorization, business logic
│ Function    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │ ← ACID transaction, RLS
│ Transaction │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Query       │ ← Cache invalidation, refetch
│ Invalidation│
└─────────────┘
```

### Authentication Flow

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Sign In │────►│ Supabase     │────►│ JWT Token   │
│ Form    │     │ Auth         │     │ Stored      │
└─────────┘     └──────────────┘     └──────┬──────┘
                                            │
    ┌───────────────────────────────────────┘
    │
    ▼
┌─────────────┐     ┌──────────────┐
│ Router      │────►│ Protected    │
│ Guard       │     │ Routes       │
└─────────────┘     └──────────────┘
```

See [Authentication](../features/authentication.md) for details.

## Security Model

### Row Level Security (RLS)

All database tables have RLS policies:

- Users can only access their own wallets
- Users can only access their own transactions
- Users can only access their own categories/sources

### Edge Function Authorization

Each Edge Function:

1. Validates JWT token
2. Extracts user ID from token
3. Verifies resource ownership
4. Executes operation within user scope

See [Backend > Security](./backend.md#security) for implementation details.

## Performance Considerations

| Aspect | Approach |
|--------|----------|
| Data fetching | TanStack Query with caching and background refetch |
| Bundle size | Vite code splitting, tree shaking |
| Database | Connection pooling, indexed queries |
| Concurrency | Row-level locks prevent race conditions |

## Related Documentation

- [Project Overview](../overview.md) — What the project does
- [Features](../features/README.md) — Feature documentation
