import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithPlugins, createPendingPromise } from '@/shared/tests/utils'
import {
  mockSupabaseFrom,
  RouterLinkStub,
  mockSelectQuery,
  mockSelectQueryPending,
  setupSupabaseMock,
} from '@/shared/tests/mocks'
import WalletsPage from '../page.vue'

const mockWallets = [
  {
    id: 'wallet-1',
    name: 'My Savings',
    description: 'Personal savings account',
    balances: [
      { id: 'bal-1', balance: 1000, currency_code: 'USD' },
      { id: 'bal-2', balance: 500, currency_code: 'EUR' },
    ],
  },
  {
    id: 'wallet-2',
    name: 'Business Account',
    description: null,
    balances: [{ id: 'bal-3', balance: 2500, currency_code: 'USD' }],
  },
]

function renderPage() {
  return renderWithPlugins(WalletsPage, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('WalletsPage', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  it('renders page header with title and "New Wallet" button', async () => {
    setupSupabaseMock({ wallets: mockSelectQuery(mockWallets) })

    const screen = renderPage()

    await expect.element(screen.getByRole('heading', { name: 'Wallets' })).toBeVisible()
    await expect.element(screen.getByRole('link', { name: /New Wallet/ })).toBeVisible()
  })

  it('shows loading skeletons while fetching wallets', async () => {
    const { promise, resolve } = createPendingPromise<{
      data: typeof mockWallets | null
      error: { message: string } | null
    }>()
    setupSupabaseMock({ wallets: mockSelectQueryPending(promise) })

    const screen = renderPage()

    await vi.waitFor(() => {
      const skeletons = screen.container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    resolve({ data: mockWallets, error: null })
  })

  it('shows wallet cards after loading', async () => {
    setupSupabaseMock({ wallets: mockSelectQuery(mockWallets) })

    const screen = renderPage()

    await expect.element(screen.getByText('My Savings')).toBeVisible()
    await expect.element(screen.getByText('Business Account')).toBeVisible()
  })

  it('shows error state when fetch fails', async () => {
    setupSupabaseMock({ wallets: mockSelectQuery(null, { message: 'Database error' }) })

    const screen = renderPage()

    await expect.element(screen.getByText('Failed to load wallets')).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  it('shows empty state when no wallets exist', async () => {
    setupSupabaseMock({ wallets: mockSelectQuery([]) })

    const screen = renderPage()

    await expect.element(screen.getByText('No wallets yet')).toBeVisible()
    await expect
      .element(screen.getByText('Create your first wallet to start tracking your finances'))
      .toBeVisible()
    await expect.element(screen.getByRole('link', { name: /Create Wallet/ })).toBeVisible()
  })

  it('refetches wallets when "Try again" is clicked', async () => {
    setupSupabaseMock({ wallets: mockSelectQuery(null, { message: 'Database error' }) })

    const screen = renderPage()

    await expect.element(screen.getByText('Failed to load wallets')).toBeVisible()

    // Update mock to return success
    setupSupabaseMock({ wallets: mockSelectQuery(mockWallets) })

    const retryButton = screen.getByRole('button', { name: 'Try again' })
    await retryButton.click()

    await expect.element(screen.getByText('My Savings')).toBeVisible()
  })
})
