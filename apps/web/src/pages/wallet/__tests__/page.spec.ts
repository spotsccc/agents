import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithPlugins, createPendingPromise } from '@/shared/tests/utils'
import {
  mockSupabaseFrom,
  RouterLinkStub,
  mockSelectSingleQuery,
  mockSelectSingleQueryPending,
  mockOrderedQuery,
  setupSupabaseMock,
} from '@/shared/tests/mocks'
import WalletPage from '../page.vue'

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

function setupMocks(walletData: unknown, walletError: { message: string } | null = null) {
  setupSupabaseMock({
    wallets: mockSelectSingleQuery(walletData, walletError),
    transaction_entries: mockOrderedQuery([], null),
  })
}

function setupMocksPending(promise: Promise<{ data: unknown; error: { message: string } | null }>) {
  setupSupabaseMock({
    wallets: mockSelectSingleQueryPending(promise),
    transaction_entries: mockOrderedQuery([], null),
  })
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

  it('shows loading skeletons while fetching wallet data', async () => {
    const { promise, resolve } = createPendingPromise<{
      data: typeof mockWallet | null
      error: { message: string } | null
    }>()
    setupMocksPending(promise)

    const screen = renderPage()

    await vi.waitFor(() => {
      const skeletons = screen.container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    // Quick actions and transactions should be visible immediately (no waterfall)
    await expect.element(screen.getByRole('link', { name: /Income/ })).toBeVisible()
    await expect.element(screen.getByRole('heading', { name: 'Recent Transactions' })).toBeVisible()

    resolve({ data: mockWallet, error: null })
  })

  it('shows wallet name and balances after loading', async () => {
    setupMocks(mockWallet)

    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'My Savings' })).toBeVisible()
    await expect.element(screen.getByText('$1,000.00')).toBeVisible()
    await expect.element(screen.getByText('\u20AC500.00')).toBeVisible()
  })

  it('shows error message when wallet fetch fails but still shows quick actions', async () => {
    setupMocks(null, { message: 'Database error' })

    const screen = renderPage()

    await expect.element(screen.getByText('Failed to load wallet')).toBeVisible()
    // Quick actions are still visible (they don't depend on wallet data)
    await expect.element(screen.getByRole('link', { name: /Income/ })).toBeVisible()
  })

  it('handles wallet with empty balances', async () => {
    const walletWithoutBalances = { ...mockWallet, balances: [] }
    setupMocks(walletWithoutBalances)

    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'My Savings' })).toBeVisible()
    // Should not crash and should still show the page with quick action buttons
    await expect.element(screen.getByRole('link', { name: /Income/ })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Expense/ })).toBeVisible()
  })
})
