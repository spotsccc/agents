import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import TransactionsFilters from '../components/transactions-filters.vue'
import type { TransactionFilters } from '../composables/use-transaction-filters'

const defaultFilters: TransactionFilters = {
  type: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
  categoryId: null,
  incomeSourceId: null,
  destinationWalletId: null,
  currencyCode: null,
}

function mockCurrenciesQuery() {
  return {
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

function renderComponent(
  filters: TransactionFilters = defaultFilters,
  hasActiveFilters = false,
  walletId = 'wallet-1'
) {
  mockSupabaseFrom.mockReturnValue(mockCurrenciesQuery())

  return renderWithPlugins(TransactionsFilters, {
    props: {
      modelValue: filters,
      walletId,
      hasActiveFilters,
    },
  })
}

describe('TransactionsFilters', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('renders filter heading', async () => {
    const screen = renderComponent()

    await expect.element(screen.getByRole('heading', { name: 'Filters' })).toBeVisible()
  })

  it('shows clear all button when filters are active', async () => {
    const screen = renderComponent(defaultFilters, true)

    await expect.element(screen.getByRole('button', { name: /Clear all/i })).toBeVisible()
  })

  it('hides clear all button when no active filters', async () => {
    const screen = renderComponent(defaultFilters, false)

    expect(screen.getByRole('button', { name: /Clear all/i }).query()).toBeNull()
  })

  it('always shows type, date range, amount range, and currency filters', async () => {
    const screen = renderComponent()

    await expect.element(screen.getByText('Type', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('Date range')).toBeVisible()
    await expect.element(screen.getByText('Amount range')).toBeVisible()
    await expect.element(screen.getByText('Currency')).toBeVisible()
  })

  it('shows category filter only for expense type', async () => {
    const filtersWithExpense = { ...defaultFilters, type: 'expense' as const }
    const screen = renderComponent(filtersWithExpense, false)

    await expect.element(screen.getByText('Category')).toBeVisible()
  })

  it('shows income source filter only for income type', async () => {
    const filtersWithIncome = { ...defaultFilters, type: 'income' as const }
    const screen = renderComponent(filtersWithIncome, false)

    await expect.element(screen.getByText('Income Source')).toBeVisible()
  })

  it('shows destination wallet filter only for transfer type', async () => {
    const filtersWithTransfer = { ...defaultFilters, type: 'transfer' as const }
    const screen = renderComponent(filtersWithTransfer, false)

    await expect.element(screen.getByText('Destination Wallet')).toBeVisible()
  })

  it('does not show type-specific filters for exchange type', async () => {
    const filtersWithExchange = { ...defaultFilters, type: 'exchange' as const }
    const screen = renderComponent(filtersWithExchange, false)

    expect(screen.getByText('Category').query()).toBeNull()
    expect(screen.getByText('Income Source').query()).toBeNull()
    expect(screen.getByText('Destination Wallet').query()).toBeNull()
  })
})
