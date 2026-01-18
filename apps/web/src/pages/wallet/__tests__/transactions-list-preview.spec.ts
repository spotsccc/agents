import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom, RouterLinkStub } from '@/shared/tests/mocks'
import TransactionsListPreview from '../transactions-list-preview.vue'

function createMockTransactionEntry(
  overrides: {
    transaction_id?: string
    transaction?: {
      id: string
      type?: string
      description?: string
      date?: string
      created_at?: string
      entries?: Array<{
        id: string
        wallet_id: string
        currency_code: string
        amount: number
        balance_after: number
        category_id?: string | null
        source_id?: string | null
        notes?: string | null
        created_at?: string
      }>
    }
  } = {}
) {
  const baseTransaction = {
    id: 'tx-1',
    type: 'expense',
    description: 'Test Transaction',
    date: '2024-01-15T00:00:00+00:00',
    created_at: '2024-01-15T10:30:00+00:00',
    entries: [
      {
        id: 'entry-1',
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

  return {
    transaction_id: overrides.transaction_id ?? 'tx-1',
    transaction: overrides.transaction
      ? { ...baseTransaction, ...overrides.transaction }
      : baseTransaction,
  }
}

function mockSelectChain(data: unknown, error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data, error }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

function mockSelectChainPending(promise: Promise<unknown>) {
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => promise,
        }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

function renderComponent(walletId = 'wallet-1') {
  return renderWithPlugins(TransactionsListPreview, {
    props: { walletId },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('TransactionsListPreview', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('shows section heading', async () => {
    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain([]))

    const screen = renderComponent()

    await expect.element(screen.getByRole('heading', { name: 'Recent Transactions' })).toBeVisible()
  })

  it('shows loading state and hides button while fetching', async () => {
    let resolveQuery: (value: unknown) => void
    const queryPromise = new Promise((resolve) => {
      resolveQuery = resolve
    })

    mockSupabaseFrom.mockReturnValueOnce(mockSelectChainPending(queryPromise))

    const screen = renderComponent()

    await expect.element(screen.getByText('Loading...')).toBeVisible()
    expect(screen.getByRole('link', { name: 'View all transactions' }).query()).toBeNull()

    resolveQuery!({ data: [], error: null })
  })

  it('shows error message and hides button when fetch fails', async () => {
    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain(null, { message: 'Database error' }))

    const screen = renderComponent()

    await expect.element(screen.getByText('Failed to load transactions')).toBeVisible()
    expect(screen.getByRole('link', { name: 'View all transactions' }).query()).toBeNull()
  })

  it('shows empty state when no transactions', async () => {
    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain([]))

    const screen = renderComponent()

    await expect.element(screen.getByText('No transactions yet')).toBeVisible()
  })

  it('renders transactions after successful fetch', async () => {
    const mockEntries = [
      createMockTransactionEntry({
        transaction_id: 'tx-1',
        transaction: { id: 'tx-1', description: 'Groceries' },
      }),
      createMockTransactionEntry({
        transaction_id: 'tx-2',
        transaction: { id: 'tx-2', description: 'Coffee' },
      }),
    ]

    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain(mockEntries))

    const screen = renderComponent()

    await expect.element(screen.getByText('Groceries')).toBeVisible()
    await expect.element(screen.getByText('Coffee')).toBeVisible()
  })

  it('shows each transaction once even with duplicate entries', async () => {
    // Exchange transactions can have multiple entries for the same wallet
    const exchangeTransaction = {
      id: 'tx-exchange',
      type: 'exchange',
      description: 'Currency Exchange',
      date: '2024-01-15T00:00:00+00:00',
      created_at: '2024-01-15T10:30:00+00:00',
      entries: [
        {
          id: 'entry-1',
          wallet_id: 'wallet-1',
          currency_code: 'USD',
          amount: -100,
          balance_after: 900,
        },
        {
          id: 'entry-2',
          wallet_id: 'wallet-1',
          currency_code: 'EUR',
          amount: 90,
          balance_after: 90,
        },
      ],
    }

    // API returns duplicate entries for the same transaction
    const mockEntries = [
      { transaction_id: 'tx-exchange', transaction: exchangeTransaction },
      { transaction_id: 'tx-exchange', transaction: exchangeTransaction },
    ]

    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain(mockEntries))

    const screen = renderComponent()

    await vi.waitFor(async () => {
      const listItems = await screen.getByRole('listitem').all()
      expect(listItems).toHaveLength(1)
    })

    await expect.element(screen.getByText('Currency Exchange')).toBeVisible()
  })

  it('filters out null transactions from response', async () => {
    const mockEntries = [
      createMockTransactionEntry({
        transaction_id: 'tx-1',
        transaction: { id: 'tx-1', description: 'Valid Transaction' },
      }),
      { transaction_id: 'tx-null', transaction: null },
    ]

    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain(mockEntries))

    const screen = renderComponent()

    await vi.waitFor(async () => {
      const listItems = await screen.getByRole('listitem').all()
      expect(listItems).toHaveLength(1)
    })

    await expect.element(screen.getByText('Valid Transaction')).toBeVisible()
  })

  it('limits displayed transactions', async () => {
    const mockEntries = Array.from({ length: 10 }, (_, i) => ({
      transaction_id: `tx-${i}`,
      transaction: {
        id: `tx-${i}`,
        type: 'expense',
        description: `Transaction ${i}`,
        date: '2024-01-15T00:00:00+00:00',
        created_at: '2024-01-15T10:30:00+00:00',
        entries: [
          {
            id: `entry-${i}`,
            wallet_id: 'wallet-1',
            currency_code: 'USD',
            amount: -100,
            balance_after: 900 - i * 100,
          },
        ],
      },
    }))

    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain(mockEntries))

    const screen = renderComponent()

    await vi.waitFor(async () => {
      const listItems = await screen.getByRole('listitem').all()
      // Component should limit the number of displayed transactions
      expect(listItems.length).toBeLessThan(mockEntries.length)
    })

    // First transaction should be visible
    await expect.element(screen.getByText('Transaction 0')).toBeVisible()
  })

  it('shows button with correct link after successful fetch', async () => {
    mockSupabaseFrom.mockReturnValueOnce(mockSelectChain([]))

    const screen = renderComponent('test-wallet-123')

    await vi.waitFor(() => {
      const link = screen.getByRole('link', { name: 'View all transactions' })
      expect(link.element().getAttribute('href')).toBe('/wallets/test-wallet-123/transactions')
    })
  })
})
