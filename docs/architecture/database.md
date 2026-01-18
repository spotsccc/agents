# Database Schema

[← Backend](./backend.md) | [Back to Architecture](./README.md)

## Overview

The application uses PostgreSQL via Supabase with Row Level Security (RLS) for data isolation.

## Entity Relationship Diagram

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │
│ name        │
│ email       │
│ avatar_url  │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────────┐         ┌──────────────────┐
│    wallets      │         │   currencies     │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │    ┌───►│ code (PK)        │
│ user_id (FK)    │    │    │ name             │
│ name            │    │    │ symbol           │
│ description     │    │    │ decimals         │
│ type            │    │    └──────────────────┘
│ primary_currency├────┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│  wallet_balances    │
├─────────────────────┤
│ id (PK)             │
│ wallet_id (FK)      │
│ currency_code (FK)  │
│ balance             │
└─────────────────────┘

┌─────────────────┐         ┌───────────────────────┐
│  transactions   │         │  transaction_entries  │
├─────────────────┤         ├───────────────────────┤
│ id (PK)         │◄───────┐│ id (PK)               │
│ user_id (FK)    │    1:N ││ transaction_id (FK)   │
│ type            │        └│ wallet_id (FK)        │
│ date            │         │ currency_code (FK)    │
│ description     │         │ amount                │
└─────────────────┘         │ balance_after         │
                            │ category_id (FK)      │
                            │ source_id (FK)        │
                            └───────────────────────┘

┌─────────────────┐         ┌─────────────────────┐
│   categories    │         │   income_sources    │
├─────────────────┤         ├─────────────────────┤
│ id (PK)         │         │ id (PK)             │
│ user_id (FK)    │         │ user_id (FK)        │
│ name            │         │ name                │
│ type            │         │ description         │
└─────────────────┘         │ icon                │
                            │ color               │
                            │ is_active           │
                            │ is_recurring        │
                            └─────────────────────┘
```

## Tables

### users

Stores user profile information (synced from Supabase Auth).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `name` | text | No | Display name |
| `email` | text | Yes | Email address |
| `avatar_url` | text | Yes | Profile picture URL |
| `created_at` | timestamp | No | Account creation time |

### wallets

User's financial accounts. See [Wallets Feature](../features/wallets.md).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | Yes | Owner (FK → users) |
| `name` | text | No | Wallet name |
| `description` | text | Yes | Optional description |
| `type` | text | No | Wallet type (default: 'personal') |
| `primary_currency` | text | Yes | Main currency (FK → currencies) |
| `metadata` | jsonb | Yes | Custom data |
| `settings` | jsonb | Yes | Wallet settings |
| `created_at` | timestamp | No | Creation time |
| `updated_at` | timestamp | No | Last update time |
| `deleted_at` | timestamp | Yes | Soft delete timestamp |

### wallet_balances

Tracks balance per currency for each wallet. See [Multi-Currency Support](../features/wallets.md#multi-currency-support).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `wallet_id` | uuid | No | FK → wallets |
| `currency_code` | text | No | FK → currencies |
| `balance` | numeric | No | Current balance |
| `created_at` | timestamp | No | Creation time |
| `updated_at` | timestamp | No | Last update time |

**Constraints:**
- Unique: `(wallet_id, currency_code)` — One balance per currency per wallet

### transactions

Transaction header. See [Transactions Feature](../features/transactions.md).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | Creator (FK → users) |
| `type` | text | No | 'income' \| 'expense' \| 'transfer' \| 'exchange' |
| `date` | date | No | Transaction date |
| `description` | text | Yes | Optional description |
| `created_at` | timestamp | No | Creation time |
| `updated_at` | timestamp | No | Last update time |
| `deleted_at` | timestamp | Yes | Soft delete timestamp |

### transaction_entries

Individual entries within a transaction. A transaction can have 1-2 entries:
- **Income/Expense**: 1 entry (credit or debit)
- **Transfer/Exchange**: 2 entries (debit from source, credit to destination)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `transaction_id` | uuid | No | FK → transactions |
| `wallet_id` | uuid | No | Affected wallet (FK → wallets) |
| `currency_code` | text | No | FK → currencies |
| `amount` | numeric | No | Amount (positive or negative) |
| `balance_after` | numeric | No | Balance after this entry |
| `category_id` | uuid | Yes | FK → categories (for expense) |
| `source_id` | uuid | Yes | FK → income_sources (for income) |
| `notes` | text | Yes | Additional notes |
| `metadata` | jsonb | Yes | Custom data |
| `created_at` | timestamp | No | Creation time |

**Amount sign convention:**
- Positive: Money coming in (income, transfer/exchange credit)
- Negative: Money going out (expense, transfer/exchange debit)

### categories

Expense categories. See [Categories](../features/transactions.md#categories).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | Owner (FK → users) |
| `name` | text | No | Category name |
| `type` | text | Yes | Category type |

### income_sources

Income origins. See [Income Sources](../features/transactions.md#income-sources).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | Owner (FK → users) |
| `name` | text | No | Source name |
| `description` | text | Yes | Description |
| `icon` | text | Yes | Icon identifier |
| `color` | text | Yes | Color (hex) |
| `is_active` | boolean | No | Active status |
| `is_recurring` | boolean | No | Recurring income flag |
| `metadata` | jsonb | Yes | Custom data |
| `created_at` | timestamp | No | Creation time |
| `updated_at` | timestamp | No | Last update time |
| `deleted_at` | timestamp | Yes | Soft delete timestamp |

### currencies

Supported currencies.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `code` | text | No | Primary key (ISO 4217: USD, EUR, etc.) |
| `name` | text | No | Full name (US Dollar, Euro) |
| `symbol` | text | Yes | Symbol ($, €, £) |
| `numeric_code` | integer | Yes | ISO 4217 numeric code |
| `decimals` | integer | No | Decimal places (default: 2) |
| `type` | text | No | 'fiat' \| 'crypto' |
| `active` | boolean | No | Available for use |
| `metadata` | jsonb | Yes | Custom data |
| `created_at` | timestamp | No | Creation time |
| `updated_at` | timestamp | No | Last update time |

### exchange_rates

Currency exchange rates (for reference).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `base_currency` | text | No | Base currency code |
| `quote_currency` | text | No | Quote currency code |
| `rate` | numeric | No | Exchange rate |
| `created_at` | timestamp | Yes | Rate timestamp |

## Row Level Security

All tables have RLS policies ensuring users can only access their own data:

```sql
-- Example: wallets table policy
CREATE POLICY "Users can only access own wallets"
ON wallets
FOR ALL
USING (user_id = auth.uid());

-- Example: transactions policy
CREATE POLICY "Users can only access own transactions"
ON transactions
FOR ALL
USING (user_id = auth.uid());
```

**Security model:**
- Users cannot see other users' wallets or transactions
- Categories and income sources are user-scoped
- Edge Functions use `service_role` for cross-table operations

## Soft Deletes

Tables with `deleted_at` column support soft deletes:
- `wallets`
- `transactions`
- `income_sources`

**Query pattern:**
```sql
SELECT * FROM wallets
WHERE user_id = $1
  AND deleted_at IS NULL;
```

## TypeScript Types

Database types are generated in `packages/supabase/scheme/`:

```typescript
// Generated from database schema
export type Wallet = {
  id: string
  user_id: string | null
  name: string
  description: string | null
  type: string
  primary_currency: string | null
  // ...
}

export type Transaction = {
  id: string
  user_id: string
  type: 'income' | 'expense' | 'transfer' | 'exchange'
  date: string
  description: string | null
  // ...
}
```

## Related Documentation

- [Backend Architecture](./backend.md) — Edge Functions and data access
- [Wallets Feature](../features/wallets.md) — Wallet management
- [Transactions Feature](../features/transactions.md) — Transaction types
