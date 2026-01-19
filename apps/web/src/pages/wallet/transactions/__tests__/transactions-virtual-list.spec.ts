import { describe, it, expect, vi } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import TransactionsVirtualList from '../components/transactions-virtual-list.vue'
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

function createMockTransaction(id: string, description: string) {
  return {
    id,
    type: 'expense',
    description,
    date: '2024-01-15',
    created_at: '2024-01-15T10:30:00+00:00',
    entries: [
      {
        id: `entry-${id}`,
        wallet_id: 'wallet-1',
        currency_code: 'USD',
        amount: -100,
        balance_after: 900,
        category_id: null,
        source_id: null,
        notes: null,
        created_at: '2024-01-15T10:30:00+00:00',
      },
    ],
  }
}

function renderComponent(props: {
  transactions?: ReturnType<typeof createMockTransaction>[]
  isLoading?: boolean
  isError?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  filters?: TransactionFilters
}) {
  return renderWithPlugins(TransactionsVirtualList, {
    props: {
      transactions: props.transactions ?? [],
      isLoading: props.isLoading ?? false,
      isError: props.isError ?? false,
      isFetchingNextPage: props.isFetchingNextPage ?? false,
      hasNextPage: props.hasNextPage ?? false,
      filters: props.filters ?? defaultFilters,
    },
  })
}

describe('TransactionsVirtualList', () => {
  it('renders with aria-label for accessibility', async () => {
    const screen = renderComponent({})

    await expect.element(screen.getByRole('list', { name: 'Transactions list' })).toBeVisible()
  })

  it('shows skeleton items while loading', async () => {
    const screen = renderComponent({ isLoading: true })

    await vi.waitFor(async () => {
      const skeletons = screen.container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  it('shows error state when isError is true', async () => {
    const screen = renderComponent({ isError: true })

    await expect.element(screen.getByText('Failed to load transactions')).toBeVisible()
  })

  it('shows empty state when no transactions', async () => {
    const screen = renderComponent({ transactions: [] })

    await expect.element(screen.getByText('No transactions found')).toBeVisible()
  })

  it('renders transactions', async () => {
    const transactions = [
      createMockTransaction('tx-1', 'Groceries'),
      createMockTransaction('tx-2', 'Coffee'),
    ]

    const screen = renderComponent({ transactions })

    await expect.element(screen.getByText('Groceries')).toBeVisible()
    await expect.element(screen.getByText('Coffee')).toBeVisible()
  })

  it('shows loading indicator when fetching next page', async () => {
    const transactions = [createMockTransaction('tx-1', 'Groceries')]

    const screen = renderComponent({
      transactions,
      isFetchingNextPage: true,
      hasNextPage: true,
    })

    await vi.waitFor(async () => {
      const liveRegion = screen.container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeTruthy()
    })
  })
})
