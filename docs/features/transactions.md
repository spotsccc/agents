# Transactions

[← Wallets](./wallets.md) | [Back to Features](./README.md) | [Authentication →](./authentication.md)

## Overview

Transactions track all money movements. The system supports four transaction types to cover common financial scenarios.

## Transaction Types

| Type | Entries | Description |
|------|---------|-------------|
| [Income](#income) | 1 | Money coming into a wallet |
| [Expense](#expense) | 1 | Money going out of a wallet |
| [Transfer](#transfer) | 2 | Money moving between wallets |
| [Exchange](#exchange) | 2 | Currency conversion within a wallet |

## Income

Adds money to a wallet.

### Use Cases
- Salary payment
- Freelance income
- Investment returns
- Gifts received

### Required Fields

| Field | Description |
|-------|-------------|
| Amount | Positive number |
| Currency | Currency code (USD, EUR, etc.) |
| Income Source | Where the money came from |
| Description | Optional note |

### How It Works

```
                    ┌──────────────┐
   $1,000 ─────────►│    Wallet    │
   (Salary)         │              │
                    │  USD: $1,000 │
                    └──────────────┘
```

**Database changes:**
1. Creates `transaction` record (type: 'income')
2. Creates `transaction_entry` with positive amount
3. Updates or creates `wallet_balance` for the currency

### Edge Function

`create-income-transaction` — See [Backend](../architecture/backend.md#function-list)

**Validations:**
- Amount must be positive
- User must own the wallet
- User must own the income source

---

## Expense

Removes money from a wallet.

### Use Cases
- Shopping
- Bills and utilities
- Subscriptions
- Dining out

### Required Fields

| Field | Description |
|-------|-------------|
| Amount | Positive number |
| Currency | Currency code |
| Category | Expense category |
| Description | Optional note |

### How It Works

```
                    ┌──────────────┐
                    │    Wallet    │
   $50 ◄────────────│              │
   (Groceries)      │  USD: $950   │
                    └──────────────┘
```

**Database changes:**
1. Creates `transaction` record (type: 'expense')
2. Creates `transaction_entry` with negative amount
3. Decreases `wallet_balance` for the currency

### Edge Function

`create-expense-transaction` — See [Backend](../architecture/backend.md#function-list)

**Validations:**
- Amount must be positive
- User must own the wallet
- User must own the category
- **Sufficient funds required**

### Insufficient Funds

If the wallet doesn't have enough balance, the transaction fails with error "Insufficient funds". The user must either:
- Reduce the amount
- Add income first
- Use a different wallet

---

## Transfer

Moves money between two wallets.

### Use Cases
- Savings contributions
- Moving money between accounts
- Paying off personal loans
- Multi-currency portfolio rebalancing

### Required Fields

| Field | Description |
|-------|-------------|
| From Wallet | Source wallet |
| To Wallet | Destination wallet |
| From Amount | Amount to send |
| To Amount | Amount to receive |
| From Currency | Source currency |
| To Currency | Destination currency |
| Description | Optional note |

### How It Works

**Same currency:**
```
┌──────────────┐         ┌──────────────┐
│   Checking   │         │   Savings    │
│              │  $500   │              │
│  USD: $1,500 │────────►│  USD: $500   │
│      ↓       │         │      ↓       │
│  USD: $1,000 │         │  USD: $1,000 │
└──────────────┘         └──────────────┘
```

**Different currencies:**
```
┌──────────────┐         ┌──────────────┐
│   USD Wallet │         │  EUR Wallet  │
│              │  $100   │              │
│  USD: $1,000 │────────►│  EUR: €92    │
│      ↓       │  = €92  │      ↓       │
│  USD: $900   │         │  EUR: €92    │
└──────────────┘         └──────────────┘
```

**Database changes:**
1. Creates `transaction` record (type: 'transfer')
2. Creates 2 `transaction_entry` records:
   - Debit entry (negative) on source wallet
   - Credit entry (positive) on destination wallet
3. Updates both `wallet_balance` records

### Edge Function

`create-transfer-transaction` — See [Backend](../architecture/backend.md#function-list)

**Validations:**
- Both amounts must be positive
- Wallets must be different
- User must own both wallets
- Sufficient funds in source wallet
- Destination balance won't exceed maximum

---

## Exchange

Converts between currencies within the same wallet.

### Use Cases
- Currency conversion
- Preparing for travel
- Taking advantage of exchange rates
- Crypto-to-fiat conversion

### Required Fields

| Field | Description |
|-------|-------------|
| Wallet | The wallet for exchange |
| From Currency | Currency to sell |
| To Currency | Currency to buy |
| From Amount | Amount to exchange |
| To Amount | Amount to receive |
| Description | Optional note |

### How It Works

```
┌─────────────────────────┐
│        Wallet           │
│                         │
│  USD: $1,000 ──┐        │
│       ↓       │ $100   │
│  USD: $900    │ = €92  │
│               │        │
│  EUR: €0  ◄───┘        │
│       ↓                │
│  EUR: €92              │
└─────────────────────────┘
```

**Database changes:**
1. Creates `transaction` record (type: 'exchange')
2. Creates 2 `transaction_entry` records:
   - Debit entry (negative) for source currency
   - Credit entry (positive) for target currency
3. Updates both currency balances in the wallet

### Edge Function

`create-exchange-transaction` — See [Backend](../architecture/backend.md#function-list)

**Validations:**
- Both amounts must be positive
- Currencies must be different
- User must own the wallet
- Sufficient funds in source currency
- Target balance won't exceed maximum

---

## Creating Transactions

All transactions are created from `/wallets/:id/transactions/create`.

### Transaction Form

The form dynamically changes based on selected type:

| Type | Shown Fields |
|------|--------------|
| Income | Amount, Currency, Income Source, Description |
| Expense | Amount, Currency, Category, Description |
| Transfer | From/To Wallet, From/To Amount, From/To Currency, Description |
| Exchange | From/To Currency, From/To Amount, Description |

### Form Validation

Vee-Validate with Zod schemas handle validation:

```typescript
const schema = z.object({
  type: z.enum(['income', 'expense', 'transfer', 'exchange']),
  amount: z.number().positive(),
  currency: z.string().min(1),
  // Conditional fields...
}).refine(
  (data) => data.type !== 'expense' || data.categoryId,
  { message: 'Category required', path: ['categoryId'] }
)
```

---

## Categories

Expense categories help organize spending.

### Default Categories

Users can create custom categories:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Health
- etc.

### Creating Categories

Categories can be created inline when creating an expense:
1. Click "Add Category" in the category dropdown
2. Enter category name
3. Category is created and selected

### Data Model

```typescript
type Category = {
  id: string
  user_id: string
  name: string
  type: string | null
}
```

See [Database Schema > categories](../architecture/database.md#categories).

---

## Income Sources

Track where income comes from.

### Example Sources
- Salary
- Freelance
- Investments
- Gifts
- Rental Income
- Side Business

### Creating Income Sources

Sources can be created inline when creating income:
1. Click "Add Source" in the source dropdown
2. Fill in source details
3. Source is created and selected

### Data Model

```typescript
type IncomeSource = {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  is_recurring: boolean
}
```

See [Database Schema > income_sources](../architecture/database.md#income_sources).

---

## Transaction Entries

Each transaction creates 1-2 entries that record the actual money movement.

### Entry Structure

```typescript
type TransactionEntry = {
  id: string
  transaction_id: string
  wallet_id: string
  currency_code: string
  amount: number        // Positive or negative
  balance_after: number // Balance after this entry
  category_id: string | null
  source_id: string | null
}
```

### Entry Count by Type

| Transaction Type | Entries | Entry Details |
|------------------|---------|---------------|
| Income | 1 | +amount to wallet |
| Expense | 1 | -amount from wallet |
| Transfer | 2 | -amount from source, +amount to destination |
| Exchange | 2 | -amount in source currency, +amount in target currency |

---

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `transaction-form.vue` | `pages/wallet/.../components/` | Main transaction form |
| `category-select.vue` | `pages/wallet/.../components/` | Category dropdown |
| `category-modal.vue` | `pages/wallet/.../components/` | Create category dialog |
| `income-source-select.vue` | `pages/wallet/.../components/` | Source dropdown |
| `income-source-modal.vue` | `pages/wallet/.../components/` | Create source dialog |
| `TransactionListItem.vue` | `components/transaction-list-item/` | Transaction display |

## Related Documentation

- [Wallets](./wallets.md) — Wallet management
- [Backend Architecture](../architecture/backend.md) — Edge Functions
- [Database Schema](../architecture/database.md) — Data model
