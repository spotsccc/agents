# Backend Architecture

[← Frontend](./frontend.md) | [Back to Architecture](./README.md) | [Database →](./database.md)

## Overview

The backend consists of Supabase services:
- **Supabase Auth** — User authentication
- **PostgreSQL** — Data storage with RLS
- **Edge Functions** — Business logic (Deno runtime)

## Edge Functions

Edge Functions handle all transaction operations. They run on Deno and use Kysely for type-safe database queries.

### Function List

| Function | Purpose | Documentation |
|----------|---------|---------------|
| `create-income-transaction` | Add income to wallet | [Transactions](../features/transactions.md#income) |
| `create-expense-transaction` | Record expense from wallet | [Transactions](../features/transactions.md#expense) |
| `create-transfer-transaction` | Transfer between wallets | [Transactions](../features/transactions.md#transfer) |
| `create-exchange-transaction` | Exchange currencies | [Transactions](../features/transactions.md#exchange) |

### Function Structure

```
packages/supabase/functions/
└── create-income-transaction/
    ├── deno.json           # Deno imports configuration
    └── index.ts            # Function entry point
```

**Required `deno.json`:**
```json
{
  "imports": {
    "kysely": "npm:kysely",
    "pg": "npm:pg",
    "supabase": "npm:@supabase/supabase-js"
  }
}
```

### Request/Response Pattern

Each function follows a consistent pattern:

```typescript
// Request validation
const request = await validateRequest<CreateIncomeTransactionRequest>(req)

// Authorization check
const user = await getAuthUser(req)
if (!user) {
  return errorResponse('Unauthorized', 401)
}

// Business logic in transaction
const result = await db.transaction().execute(async (trx) => {
  // 1. Validate ownership
  // 2. Check constraints
  // 3. Create records
  // 4. Update balances
  return data
})

// Response
return jsonResponse(result)
```

### Transaction Safety

All financial operations use PostgreSQL transactions with locking:

```typescript
await db.transaction().execute(async (trx) => {
  // Lock the balance row to prevent concurrent updates
  const balance = await trx
    .selectFrom('wallet_balances')
    .where('wallet_id', '=', walletId)
    .where('currency_code', '=', currency)
    .forUpdate()  // Row-level lock
    .executeTakeFirst()

  // Check sufficient funds (for expense/transfer)
  if (balance.balance < amount) {
    throw new Error('Insufficient funds')
  }

  // Update balance atomically
  await trx
    .updateTable('wallet_balances')
    .set({ balance: balance.balance - amount })
    .where('id', '=', balance.id)
    .execute()
})
```

**Guarantees:**
- Atomic operations (all or nothing)
- No race conditions with concurrent requests
- Consistent balance history

## Kysely ORM

Kysely provides type-safe SQL queries:

```typescript
// Type-safe query building
const wallet = await db
  .selectFrom('wallets')
  .select(['id', 'name', 'user_id'])
  .where('id', '=', walletId)
  .where('user_id', '=', userId)
  .executeTakeFirst()

// Type inference from database schema
type Wallet = {
  id: string
  name: string
  user_id: string
}
```

**Benefits:**
- Compile-time query validation
- Autocomplete for table/column names
- No raw SQL strings (reduced injection risk)

## Frontend Integration

Edge Functions are called via type-safe wrappers:

```
apps/web/src/shared/supabase/edge-functions/
├── invoke.ts                         # Base invoker
├── types.ts                          # Shared types
├── create-income-transaction.ts      # Income wrapper
├── create-expense-transaction.ts     # Expense wrapper
├── create-transfer-transaction.ts    # Transfer wrapper
├── create-exchange-transaction.ts    # Exchange wrapper
└── index.ts                          # Exports
```

**Wrapper example:**

```typescript
// create-income-transaction.ts
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type CreateIncomeTransactionRequest = {
  userId: string
  walletId: string
  amount: number
  currency: string
  sourceId: string
  description: string
}

export type CreateIncomeTransactionResponse = {
  transaction_id: string
  entry_id: string
  previous_balance: number
  new_balance: number
  currency: string
  timestamp: string
}

export function createIncomeTransaction(
  params: CreateIncomeTransactionRequest
): Promise<EdgeFunctionResult<CreateIncomeTransactionResponse>> {
  return invokeEdgeFunction(CREATE_INCOME_TRANSACTION, params)
}
```

**Usage in component:**

```typescript
import { createIncomeTransaction } from '@/shared/supabase/edge-functions'

const result = await createIncomeTransaction({
  userId: user.id,
  walletId: wallet.id,
  amount: 100,
  currency: 'USD',
  sourceId: source.id,
  description: 'Salary'
})

if (result.success) {
  console.log('New balance:', result.data.new_balance)
} else {
  console.error('Error:', result.error)
}
```

## Security

### Authentication

Edge Functions validate JWT tokens from Supabase Auth:

```typescript
import { createClient } from 'supabase'

const authHeader = req.headers.get('Authorization')
const token = authHeader?.replace('Bearer ', '')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data: { user }, error } = await supabase.auth.getUser(token)

if (!user) {
  return new Response('Unauthorized', { status: 401 })
}
```

### Authorization

Each function verifies resource ownership:

```typescript
// Verify wallet belongs to user
const wallet = await db
  .selectFrom('wallets')
  .where('id', '=', request.walletId)
  .where('user_id', '=', user.id)  // Ownership check
  .executeTakeFirst()

if (!wallet) {
  return errorResponse('Wallet not found', 404)
}
```

### Input Validation

All inputs are validated before processing:

```typescript
// Validate positive amount
if (request.amount <= 0) {
  return errorResponse('Amount must be positive', 400)
}

// Validate different wallets for transfer
if (request.fromWalletId === request.toWalletId) {
  return errorResponse('Cannot transfer to same wallet', 400)
}

// Validate different currencies for exchange
if (request.fromCurrency === request.toCurrency) {
  return errorResponse('Cannot exchange same currency', 400)
}
```

## Error Handling

Edge Functions return structured errors:

```typescript
// Error response helper
function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Usage
if (balance.balance < amount) {
  return errorResponse('Insufficient funds', 400)
}
```

**Frontend handling:**

```typescript
const result = await createExpenseTransaction(params)

if (!result.success) {
  if (result.error === 'Insufficient funds') {
    showNotification('Not enough money in wallet')
  } else {
    showNotification('Transaction failed')
  }
}
```

## Local Development

```bash
# Start local Supabase (includes Edge Functions)
pnpm supabase:start

# Serve Edge Functions with hot reload
pnpm supabase:functions-serve

# Deploy to production
pnpm supabase:functions-deploy
```

## Related Documentation

- [Database Schema](./database.md) — Table structure and relationships
- [Transactions Feature](../features/transactions.md) — Transaction types and flows
- [Authentication](../features/authentication.md) — Auth system details
