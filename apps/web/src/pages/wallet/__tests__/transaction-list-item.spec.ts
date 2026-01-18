import { describe, it, expect } from 'vitest'
import { format, subDays } from 'date-fns'
import { renderWithPlugins } from '@/shared/tests/utils'
import TransactionListItem from '../transaction-list-item.vue'
import type { Transaction } from '@/shared/supabase'
import type { Tables } from 'supabase/scheme'

type TransactionEntry = Tables<'transaction_entries'>

function createEntry(overrides: Partial<TransactionEntry> = {}): TransactionEntry {
  return {
    id: 'entry-1',
    transaction_id: 'tx-1',
    wallet_id: 'wallet-1',
    currency_code: 'USD',
    amount: -100,
    balance_after: 900,
    category_id: null,
    source_id: null,
    notes: null,
    created_at: '2024-01-15T10:00:00Z',
    metadata: null,
    ...overrides,
  }
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    description: null,
    date: '2024-01-15',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    deleted_at: null,
    user_id: 'user-1',
    entries: [createEntry({ category_id: 'cat-1' })],
    ...overrides,
  }
}

function createIncomeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return createTransaction({
    type: 'income',
    entries: [
      createEntry({
        amount: 500,
        balance_after: 1500,
        category_id: null,
        source_id: 'src-1',
      }),
    ],
    ...overrides,
  })
}

function createTransferTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return createTransaction({
    type: 'transfer',
    entries: [
      createEntry({
        amount: -200,
        balance_after: 800,
        category_id: null,
      }),
      createEntry({
        id: 'entry-2',
        wallet_id: 'wallet-2',
        amount: 200,
        balance_after: 200,
        category_id: null,
      }),
    ],
    ...overrides,
  })
}

function createExchangeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return createTransaction({
    type: 'exchange',
    entries: [
      createEntry({
        category_id: null,
      }),
      createEntry({
        id: 'entry-2',
        currency_code: 'EUR',
        amount: 90,
        balance_after: 90,
        category_id: null,
      }),
    ],
    ...overrides,
  })
}

describe('TransactionListItem', () => {
  describe('rendering', () => {
    it('renders transaction with description', async () => {
      const transaction = createTransaction({ description: 'Grocery shopping' })
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('Grocery shopping')).toBeVisible()
    })

    it('renders expense type title when no description', async () => {
      const transaction = createTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('Expense')).toBeVisible()
    })

    it('renders income type title when no description', async () => {
      const transaction = createIncomeTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('Income')).toBeVisible()
    })

    it('renders transfer type title when no description', async () => {
      const transaction = createTransferTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('Transfer')).toBeVisible()
    })

    it('renders exchange type title when no description', async () => {
      const transaction = createExchangeTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('Exchange')).toBeVisible()
    })

    it('renders balance after transaction', async () => {
      const transaction = createTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('Balance: $900.00')).toBeVisible()
    })
  })

  describe('amount formatting', () => {
    it('formats expense amount with minus sign', async () => {
      const transaction = createTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('-$100.00')).toBeVisible()
    })

    it('formats income amount with plus sign', async () => {
      const transaction = createIncomeTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('+$500.00')).toBeVisible()
    })

    it('formats transfer amount without prefix', async () => {
      const transaction = createTransferTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('$200.00')).toBeVisible()
    })

    it('formats EUR currency correctly', async () => {
      const transaction = createTransaction({
        entries: [createEntry({ currency_code: 'EUR', balance_after: 850 })],
      })

      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('-\u20AC100.00')).toBeVisible()
      await expect.element(screen.getByText('Balance: \u20AC850.00')).toBeVisible()
    })

    it('formats GBP currency correctly', async () => {
      const transaction = createTransaction({
        entries: [createEntry({ currency_code: 'GBP', balance_after: 750 })],
      })

      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText('-\u00A3100.00')).toBeVisible()
      await expect.element(screen.getByText('Balance: \u00A3750.00')).toBeVisible()
    })
  })

  describe('secondary info', () => {
    it('shows category name for expense', async () => {
      const transaction = createTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction, categoryName: 'Food' },
      })

      await expect.element(screen.getByText(/Food/)).toBeVisible()
    })

    it('shows source name for income', async () => {
      const transaction = createIncomeTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction, sourceName: 'Salary' },
      })

      await expect.element(screen.getByText(/Salary/)).toBeVisible()
    })

    it('shows target wallet name for transfer', async () => {
      const transaction = createTransferTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction, targetWalletName: 'Savings' },
      })

      await expect.element(screen.getByText(/To Savings/)).toBeVisible()
    })

    it('shows currency conversion for exchange', async () => {
      const transaction = createExchangeTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText(/USD → EUR/)).toBeVisible()
    })
  })

  describe('date formatting', () => {
    it('shows "Today" for current date', async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const transaction = createTransaction({ date: today })
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText(/Today/)).toBeVisible()
    })

    it('shows "Yesterday" for previous date', async () => {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
      const transaction = createTransaction({ date: yesterday })
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText(/Yesterday/)).toBeVisible()
    })

    it('shows short date for older dates in current year', async () => {
      // Use a date 10 days ago to ensure it's not Today/Yesterday
      const pastDate = subDays(new Date(), 10)
      const dateStr = format(pastDate, 'yyyy-MM-dd')
      const expectedFormat = format(pastDate, 'MMM d')
      const transaction = createTransaction({ date: dateStr })
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText(new RegExp(expectedFormat))).toBeVisible()
    })

    it('shows full date for dates in different year', async () => {
      const transaction = createTransaction({ date: '2023-03-15' })
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByText(/Mar 15, 2023/)).toBeVisible()
    })
  })

  describe('accessibility', () => {
    it('has listitem role', async () => {
      const transaction = createTransaction()
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      await expect.element(screen.getByRole('listitem')).toBeVisible()
    })

    it('has time element with datetime attribute', async () => {
      const transaction = createTransaction({ date: '2024-01-15' })
      const screen = renderWithPlugins(TransactionListItem, {
        props: { transaction },
      })

      const timeElement = screen.container.querySelector('time')
      expect(timeElement).not.toBeNull()
      expect(timeElement?.getAttribute('datetime')).toBe('2024-01-15')
    })
  })
})
