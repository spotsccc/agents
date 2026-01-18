# Wallets

[← Back to Features](./README.md) | [Transactions →](./transactions.md)

## Overview

Wallets are the core containers for tracking finances. Each wallet can hold multiple currency balances and maintains a complete transaction history.

## Creating a Wallet

Users can create wallets from the wallets list page (`/wallets`):

**Required fields:**
- **Name** — Display name for the wallet (e.g., "Main Account", "Savings")

**Optional fields:**
- **Description** — Additional context about the wallet
- **Primary Currency** — Default currency for the wallet

### Wallet Types

Currently supports `personal` wallet type. The type field is available for future expansion (e.g., business, shared wallets).

## Wallet Details

The wallet detail page (`/wallets/:id`) displays:

### Balance Display

Shows current balance for each currency in the wallet:

```
┌─────────────────────────────┐
│  Main Wallet                │
├─────────────────────────────┤
│  USD     $1,234.56          │
│  EUR       €890.00          │
│  GBP       £450.25          │
└─────────────────────────────┘
```

See [Multi-Currency Support](#multi-currency-support) for details.

### Quick Actions

Four buttons for creating transactions:

| Action | Color | Transaction Type | Link |
|--------|-------|------------------|------|
| Income | Green | Add money | [Income](./transactions.md#income) |
| Expense | Red | Spend money | [Expense](./transactions.md#expense) |
| Transfer | Blue | Move to another wallet | [Transfer](./transactions.md#transfer) |
| Exchange | Purple | Convert currency | [Exchange](./transactions.md#exchange) |

### Recent Transactions

Preview of the latest transactions for quick reference. Click "View All" to see full transaction history.

## Multi-Currency Support

Each wallet can hold balances in multiple currencies simultaneously.

### How It Works

```
┌─────────────────────────────────────────────┐
│                 Wallet                       │
│  ┌─────────────────────────────────────┐    │
│  │          wallet_balances            │    │
│  │                                     │    │
│  │  ┌─────────┐  ┌─────────┐          │    │
│  │  │  USD    │  │  EUR    │  ...     │    │
│  │  │ $1,234  │  │  €890   │          │    │
│  │  └─────────┘  └─────────┘          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Database model:**
- Each wallet has multiple `wallet_balances` records
- One record per currency
- Balances are updated atomically during transactions

### Adding Currency to Wallet

New currencies are automatically added when:
1. Creating an income transaction in a new currency
2. Receiving a transfer in a new currency
3. Exchanging to a new currency

### Balance Tracking

Each transaction entry records:
- Amount of the transaction
- Balance **after** the transaction (`balance_after`)

This enables:
- Accurate balance history
- Point-in-time balance queries
- Audit trail for financial data

See [Database Schema > wallet_balances](../architecture/database.md#wallet_balances) for technical details.

## Transaction History

Full transaction history is available at `/wallets/:id/transactions`.

### Transaction List

Displays all transactions for the wallet:
- Transaction type (icon + color coded)
- Amount and currency
- Description
- Date
- Category (for expenses) or Source (for income)

### Filtering and Sorting

Transactions are sorted by date (newest first).

## Data Model

### Wallet Table

```typescript
type Wallet = {
  id: string
  user_id: string
  name: string
  description: string | null
  type: 'personal'
  primary_currency: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null  // Soft delete
}
```

### Wallet Balance Table

```typescript
type WalletBalance = {
  id: string
  wallet_id: string
  currency_code: string  // 'USD', 'EUR', etc.
  balance: number
  created_at: string
  updated_at: string
}
```

See [Database Schema](../architecture/database.md#wallets) for complete schema.

## Security

### Data Isolation

- Users can only see their own wallets
- Row Level Security (RLS) enforces this at database level
- All API calls verify wallet ownership

### Balance Integrity

- Balance updates use database transactions
- Row-level locks prevent race conditions
- See [Backend > Transaction Safety](../architecture/backend.md#transaction-safety)

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `wallet-form.vue` | `pages/wallets/components/` | Create wallet form |
| `wallet-row.vue` | `pages/wallets/components/` | Wallet list item |
| `wallet-balance-display.vue` | `pages/wallet/components/` | Balance display |
| `quick-action-buttons.vue` | `pages/wallet/components/` | Transaction shortcuts |

## Related Documentation

- [Transactions](./transactions.md) — Transaction types and creation
- [Database Schema](../architecture/database.md) — Data model details
- [Backend Architecture](../architecture/backend.md) — Edge Functions
