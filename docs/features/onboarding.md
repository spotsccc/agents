# Onboarding

[← Back to Features](./README.md) | [Authentication →](./authentication.md)

## Overview

The onboarding flow guides new users through setting up their first wallets with initial balances. Users cannot access the main application until they complete onboarding.

## Flow

1. User signs up or signs in for the first time
2. System detects `onboarding_finished = false` in `user_settings`
3. User is redirected to `/onboarding`
4. User creates one or more wallets with initial balances
5. User clicks "Finish Setup"
6. System sets `onboarding_finished = true`
7. User is redirected to `/wallets`

## Onboarding Page

The onboarding page (`/onboarding`) provides:

### Wallet Creation Form

**Required fields:**
- **Wallet Name** — Display name (minimum 3 characters)

**Optional fields:**
- **Description** — Additional context about the wallet

### Multi-Currency Balances

Users can add multiple currency balances to each wallet:

```
┌─────────────────────────────────────┐
│  Currency    │  Amount              │
├─────────────────────────────────────┤
│  USD ($)     │  1000.00      [×]    │
│  EUR (€)     │   500.00      [×]    │
│              [+ Add Currency]       │
└─────────────────────────────────────┘
```

- Default currency is USD
- Users can add multiple currencies using "Add Currency" button
- Each balance row can be removed (except when only one remains)
- Balances are inserted directly into `wallet_balances` table

### Wallet List

Displays already created wallets with their balances:

```
┌─────────────────────────────────────┐
│  💳 My Wallet                       │
│  $1,000.00  €500.00                 │
└─────────────────────────────────────┘
```

### Completion

- "Finish Setup" button is enabled only when at least one wallet exists
- Clicking "Finish Setup" updates `onboarding_finished = true`
- User is redirected to the wallets page

## Router Guard

The router guard in `/apps/web/src/app/router/index.ts`:

1. Checks `onboarding_finished` status after authentication
2. Redirects to `/onboarding` if `false` and not already on onboarding page
3. Redirects to `/wallets` if `true` and user tries to access onboarding page
4. Caches the status to avoid repeated database queries
5. Clears cache on auth state change

## Database

### user_settings Table

```sql
onboarding_finished BOOLEAN DEFAULT false NOT NULL
```

- Auto-created on user signup via database trigger
- Users can only SELECT and UPDATE their own settings (RLS)

### Edge Function

`setup-wallet-with-balance` creates wallet and balances atomically:

```typescript
type SetupWalletWithBalanceRequest = {
  walletName: string
  walletDescription?: string
  balances: Array<{ currency: string; amount: number }>
}
```

Balances are inserted directly into `wallet_balances` without creating transactions.

## Files

### Backend
- `packages/supabase/functions/setup-wallet-with-balance/` — Edge Function

### Frontend
- `apps/web/src/pages/onboarding/page.vue` — Main page
- `apps/web/src/pages/onboarding/components/onboarding-wallet-form.vue` — Wallet form
- `apps/web/src/pages/onboarding/components/onboarding-balance-row.vue` — Balance row
- `apps/web/src/pages/onboarding/components/onboarding-wallet-list.vue` — Wallet list
- `apps/web/src/shared/auth/use-user-settings.ts` — Composables
- `apps/web/src/app/router/index.ts` — Router guard

## Testing

```bash
cd apps/web && pnpm test:unit -- src/pages/onboarding
```

Tests cover:
- Rendering of all form elements
- Form validation
- Wallet creation submission
- Balance management (add/remove)
- Error handling
