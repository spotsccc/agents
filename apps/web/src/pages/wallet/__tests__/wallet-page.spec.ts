import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom, RouterLinkStub } from '@/shared/tests/mocks'
import WalletPage from '../wallet-page.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'wallet-123' } }),
}))

const mockWallet = {
  id: 'wallet-123',
  name: 'My Savings',
  description: 'Personal savings account',
  balances: [
    { id: 'bal-1', balance: 1000, currency_code: 'USD' },
    { id: 'bal-2', balance: 500, currency_code: 'EUR' },
  ],
}

function createPendingPromise<T = unknown>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function mockWalletQuery(data: unknown, error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data, error }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

function mockWalletQueryPending(promise: Promise<unknown>) {
  return {
    select: () => ({
      eq: () => ({
        single: () => promise,
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

function mockTransactionsQuery() {
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>
}

function setupMocks(walletResponse: ReturnType<typeof mockSupabaseFrom>) {
  mockSupabaseFrom.mockImplementation(((table: string) => {
    if (table === 'wallets') return walletResponse
    if (table === 'transaction_entries') return mockTransactionsQuery()
    return walletResponse
  }) as typeof mockSupabaseFrom)
}

function renderPage() {
  return renderWithPlugins(WalletPage, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('WalletPage', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('shows loading skeletons and hides content while fetching', async () => {
    const { promise, resolve } = createPendingPromise()
    setupMocks(mockWalletQueryPending(promise))

    const screen = renderPage()

    await vi.waitFor(() => {
      const skeletons = screen.container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    // Content should be hidden during loading
    expect(screen.getByRole('link', { name: /Income/ }).query()).toBeNull()
    expect(screen.getByRole('heading', { name: 'Recent Transactions' }).query()).toBeNull()

    resolve({ data: mockWallet, error: null })
  })

  it('shows wallet name and balances after loading', async () => {
    setupMocks(mockWalletQuery(mockWallet))

    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'My Savings' })).toBeVisible()
    await expect.element(screen.getByText('$1,000.00')).toBeVisible()
    await expect.element(screen.getByText('\u20AC500.00')).toBeVisible()
  })

  it('shows error message and hides content when fetch fails', async () => {
    setupMocks(mockWalletQuery(null, { message: 'Database error' }))

    const screen = renderPage()

    await expect.element(screen.getByText('Failed to load wallet')).toBeVisible()
    expect(screen.getByRole('link', { name: /Income/ }).query()).toBeNull()
  })

  it('renders quick action buttons', async () => {
    setupMocks(mockWalletQuery(mockWallet))

    const screen = renderPage()

    // Verify all quick action buttons are rendered (details tested in quick-action-buttons.spec.ts)
    await expect.element(screen.getByRole('link', { name: /Income/ })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Expense/ })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Transfer/ })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Exchange/ })).toBeVisible()
  })

  it('renders transactions preview section', async () => {
    setupMocks(mockWalletQuery(mockWallet))

    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'Recent Transactions' })).toBeVisible()
  })

  it('handles wallet with empty balances', async () => {
    const walletWithoutBalances = { ...mockWallet, balances: [] }
    setupMocks(mockWalletQuery(walletWithoutBalances))

    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'My Savings' })).toBeVisible()
    // Should not crash and should still show the page with quick action buttons
    await expect.element(screen.getByRole('link', { name: /Income/ })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Expense/ })).toBeVisible()
  })
})
