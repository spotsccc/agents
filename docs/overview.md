# Project Overview

[← Back to Documentation](./README.md)

## What is Wallet Manager?

Wallet Manager is a personal finance application for tracking multi-currency wallets and transactions. It provides a modern, type-safe solution for managing personal finances with support for multiple currencies, various transaction types, and real-time balance tracking.

## Problems Solved

### 1. Multi-Currency Tracking

**Problem:** Traditional finance apps struggle with multiple currencies. Users who deal with different currencies (travelers, freelancers with international clients, crypto holders) need to track balances across various currencies.

**Solution:** Each wallet can hold multiple currency balances simultaneously. The app tracks each currency separately and supports [currency exchange](./features/transactions.md#exchange) within a single wallet.

### 2. Complex Transaction Types

**Problem:** Most apps only support simple income/expense tracking. Real financial scenarios include transfers between accounts, currency exchanges, and need to maintain accurate balance history.

**Solution:** Four distinct [transaction types](./features/transactions.md):
- **Income** — Money coming in with source tracking
- **Expense** — Money going out with category classification
- **Transfer** — Moving money between wallets
- **Exchange** — Converting between currencies

### 3. Data Integrity

**Problem:** Financial data must be accurate. Race conditions, partial updates, or system failures can corrupt balance information.

**Solution:** All financial operations use [PostgreSQL transactions](./architecture/backend.md#transaction-safety) with row-level locking. Operations are atomic — they either complete fully or roll back entirely.

### 4. Categorization and Insights

**Problem:** Understanding spending patterns requires proper categorization of transactions.

**Solution:** Flexible [category system](./features/transactions.md#categories) for expenses and [income sources](./features/transactions.md#income-sources) for tracking where money comes from.

## Key Features

| Feature | Description | Documentation |
|---------|-------------|---------------|
| Multi-wallet | Create and manage multiple wallets | [Wallets](./features/wallets.md) |
| Multi-currency | Track different currencies per wallet | [Wallet Balances](./features/wallets.md#multi-currency-support) |
| Transaction Types | Income, Expense, Transfer, Exchange | [Transactions](./features/transactions.md) |
| Categories | Organize expenses by category | [Categories](./features/transactions.md#categories) |
| Income Sources | Track income origins | [Income Sources](./features/transactions.md#income-sources) |
| Balance History | Track balance after each transaction | [Transaction Entries](./architecture/database.md#transaction_entries) |
| Secure Auth | User authentication and data isolation | [Authentication](./features/authentication.md) |

## User Flow

```
┌─────────────────┐
│   Sign Up/In    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Wallets List   │◄────────────────┐
└────────┬────────┘                 │
         │                          │
         ▼                          │
┌─────────────────┐                 │
│ Wallet Details  │                 │
│ - Balances      │                 │
│ - Quick Actions │                 │
│ - Recent Txns   │                 │
└────────┬────────┘                 │
         │                          │
         ▼                          │
┌─────────────────┐                 │
│ Create          │                 │
│ Transaction     │─────────────────┘
│ - Income        │
│ - Expense       │
│ - Transfer      │
│ - Exchange      │
└─────────────────┘
```

## Target Users

- **Personal finance enthusiasts** — Track daily expenses and income
- **Freelancers** — Manage payments in multiple currencies
- **Travelers** — Track spending across different countries/currencies
- **Small business owners** — Separate business and personal finances
- **Crypto holders** — Track crypto alongside fiat currencies

## Next Steps

- [Architecture Overview](./architecture/README.md) — Understand how the system is built
- [Features Guide](./features/README.md) — Detailed feature documentation
- [Database Schema](./architecture/database.md) — Data model reference
