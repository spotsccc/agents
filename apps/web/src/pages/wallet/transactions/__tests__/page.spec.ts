import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom, RouterLinkStub } from '@/shared/tests/mocks'
import TransactionsPage from '../page.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'wallet-1' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}))

function createMockEntry(transactionId: string, description: string) {
  return {
    transaction_id: transactionId,
    transaction: {
      id: transactionId,
      type: 'expense',
      description,
      date: '2024-01-15',
      created_at: '2024-01-15T10:30:00+00:00',
      entries: [
        {
          id: `entry-${transactionId}`,
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
    },
  }
}

function mockInfiniteQuery(data: unknown, error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          range: () => Promise.resolve({ data, error }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
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

function renderComponent() {
  return renderWithPlugins(TransactionsPage, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  })
}

describe('TransactionsPage', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
    mockSupabaseFrom.mockImplementation(((table: string) => {
      if (table === 'currencies') {
        return mockCurrenciesQuery()
      }
      return mockInfiniteQuery([])
    }) as typeof mockSupabaseFrom)
  })

  it('renders page heading', async () => {
    const screen = renderComponent()

    await expect.element(screen.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  })

  it('renders back button with correct link', async () => {
    const screen = renderComponent()

    await vi.waitFor(() => {
      const backLink = screen.getByRole('link', { name: 'Back to wallet' })
      expect(backLink.element().getAttribute('href')).toBe('/wallets/wallet-1')
    })
  })

  it('renders filters section', async () => {
    const screen = renderComponent()

    await expect.element(screen.getByRole('heading', { name: 'Filters' })).toBeVisible()
  })

  it('renders transactions list', async () => {
    const mockEntries = [createMockEntry('tx-1', 'Groceries'), createMockEntry('tx-2', 'Coffee')]

    mockSupabaseFrom.mockImplementation(((table: string) => {
      if (table === 'currencies') {
        return mockCurrenciesQuery()
      }
      return mockInfiniteQuery(mockEntries)
    }) as typeof mockSupabaseFrom)

    const screen = renderComponent()

    await expect.element(screen.getByText('Groceries')).toBeVisible()
    await expect.element(screen.getByText('Coffee')).toBeVisible()
  })

  it('shows empty state when no transactions', async () => {
    mockSupabaseFrom.mockImplementation(((table: string) => {
      if (table === 'currencies') {
        return mockCurrenciesQuery()
      }
      return mockInfiniteQuery([])
    }) as typeof mockSupabaseFrom)

    const screen = renderComponent()

    await expect.element(screen.getByText('No transactions found')).toBeVisible()
  })

  it('deduplicates transactions with multiple entries', async () => {
    // Same transaction appears twice in response (e.g., exchange with 2 entries)
    const duplicateEntries = [
      createMockEntry('tx-1', 'Currency Exchange'),
      createMockEntry('tx-1', 'Currency Exchange'),
    ]

    mockSupabaseFrom.mockImplementation(((table: string) => {
      if (table === 'currencies') {
        return mockCurrenciesQuery()
      }
      return mockInfiniteQuery(duplicateEntries)
    }) as typeof mockSupabaseFrom)

    const screen = renderComponent()

    await vi.waitFor(async () => {
      // Should only render once despite duplicate entries
      const items = screen.container.querySelectorAll('[role="listitem"]')
      expect(items).toHaveLength(1)
    })
  })
})
