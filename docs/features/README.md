# Features Overview

[← Back to Documentation](../README.md)

## Core Features

| Feature | Description | Documentation |
|---------|-------------|---------------|
| Authentication | User registration and sign-in | [Authentication](./authentication.md) |
| Wallets | Create and manage wallets | [Wallets](./wallets.md) |
| Transactions | Track income, expenses, transfers, exchanges | [Transactions](./transactions.md) |

## Feature Summary

### Authentication

Secure user authentication via Supabase Auth:
- Email/password registration
- Sign in / sign out
- Session management
- Route protection

→ [Read more](./authentication.md)

### Wallets

Multi-currency wallet management:
- Create wallets with custom names
- Track balances in multiple currencies
- View wallet details and transaction history
- Quick actions for common operations

→ [Read more](./wallets.md)

### Transactions

Four transaction types for complete financial tracking:

| Type | Description | Example |
|------|-------------|---------|
| **Income** | Money coming in | Salary, freelance payment |
| **Expense** | Money going out | Groceries, bills |
| **Transfer** | Between wallets | Savings to checking |
| **Exchange** | Currency conversion | USD to EUR |

→ [Read more](./transactions.md)

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐       │
│   │ Sign Up  │────────►│ Sign In  │────────►│  Signed  │       │
│   │          │         │          │         │    In    │       │
│   └──────────┘         └──────────┘         └────┬─────┘       │
│                                                  │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          WALLETS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐         ┌───────────────┐                   │
│   │ Wallets List │────────►│ Wallet Detail │                   │
│   │              │         │               │                   │
│   │ • My Wallet  │         │ • Balance     │                   │
│   │ • Savings    │         │ • History     │                   │
│   │ + Create New │         │ • Actions     │                   │
│   └──────────────┘         └───────┬───────┘                   │
│                                    │                            │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TRANSACTIONS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │  Income  │  │ Expense  │  │ Transfer │  │ Exchange │       │
│   │          │  │          │  │          │  │          │       │
│   │ + Amount │  │ - Amount │  │ A ──► B  │  │ $ ──► €  │       │
│   │ + Source │  │ + Categ. │  │          │  │          │       │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Application Routes

| Route | Page | Feature |
|-------|------|---------|
| `/auth/sign-in` | Sign In | [Authentication](./authentication.md) |
| `/auth/sign-up` | Sign Up | [Authentication](./authentication.md) |
| `/wallets` | Wallets List | [Wallets](./wallets.md) |
| `/wallets/:id` | Wallet Details | [Wallets](./wallets.md#wallet-details) |
| `/wallets/:id/transactions` | Transaction History | [Transactions](./transactions.md) |
| `/wallets/:id/transactions/create` | Create Transaction | [Transactions](./transactions.md#creating-transactions) |

## Related Documentation

- [Architecture Overview](../architecture/README.md) — How the system is built
- [Database Schema](../architecture/database.md) — Data model reference
- [Project Overview](../overview.md) — Goals and problems solved
