import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import OnboardingPage from '../page.vue'

const mockUser = { id: 'user-123', email: 'test@example.com' }
const mockRouterPush = vi.fn()
const mockMutateAsync = vi.fn()
const mockClearOnboardingCache = vi.fn()

vi.mock('@/shared/auth/use-user.ts', () => ({
  useUser: () => ({ user: { value: mockUser } }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

vi.mock('@/app/router', () => ({
  clearOnboardingCache: () => mockClearOnboardingCache(),
}))

vi.mock('@/shared/auth/use-user-settings', () => ({
  useCompleteOnboarding: () => ({
    mutateAsync: mockMutateAsync,
    isPending: { value: false },
  }),
}))

const mockSetupWalletWithBalance = vi.fn()

vi.mock('@/shared/supabase/edge-functions', () => ({
  setupWalletWithBalance: (params: unknown) => mockSetupWalletWithBalance(params),
}))

let shouldReturnWallets = false

function mockSupabaseQueries() {
  mockSupabaseFrom.mockImplementation(((table: string) => {
    if (table === 'wallets') {
      return {
        select: () => ({
          eq: () => ({
            is: () => {
              const wallets = shouldReturnWallets
                ? [{ id: 'wallet-1', name: 'My Wallet', wallet_balances: [] }]
                : []
              const result = Promise.resolve({ data: wallets, error: null })
              return Object.assign(result, {
                order: () => Promise.resolve({ data: wallets, error: null }),
              })
            },
          }),
        }),
      }
    }
    if (table === 'currencies') {
      return {
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({
                data: [{ code: 'USD', name: 'US Dollar', symbol: '$' }],
                error: null,
              }),
          }),
        }),
      }
    }
    return {}
  }) as unknown as typeof mockSupabaseFrom)
}

function mockSetupWalletWithBalanceAndEnableWallets() {
  mockSetupWalletWithBalance.mockImplementation(() => {
    shouldReturnWallets = true
    return Promise.resolve({
      data: { wallet_id: 'new-wallet', wallet_name: 'My Wallet', balances: [] },
      error: null,
    })
  })
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    shouldReturnWallets = false
    mockSupabaseFrom.mockClear()
    mockRouterPush.mockClear()
    mockMutateAsync.mockClear()
    mockClearOnboardingCache.mockClear()
    mockSetupWalletWithBalance.mockClear()
    mockMutateAsync.mockResolvedValue(undefined)
  })

  describe('rendering', () => {
    it('renders welcome message', async () => {
      mockSupabaseQueries()
      const screen = renderWithPlugins(OnboardingPage)

      await expect.element(screen.getByText('Welcome!')).toBeVisible()
      await expect
        .element(screen.getByText("Let's set up your wallets to get started."))
        .toBeVisible()
    })

    it('renders wallet form initially', async () => {
      mockSupabaseQueries()
      const screen = renderWithPlugins(OnboardingPage)

      await expect.element(screen.getByLabelText('Wallet Name')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Create Wallet' })).toBeVisible()
    })

    it('shows "Create Your First Wallet" when no wallets exist', async () => {
      mockSupabaseQueries()
      const screen = renderWithPlugins(OnboardingPage)

      await expect.element(screen.getByText('Create Your First Wallet')).toBeVisible()
    })
  })

  describe('wallet list', () => {
    it('shows message when no wallets created', async () => {
      mockSupabaseQueries()
      const screen = renderWithPlugins(OnboardingPage)

      await expect
        .element(screen.getByText('No wallets created yet. Create your first wallet below.'))
        .toBeVisible()
    })
  })

  describe('wallet creation flow', () => {
    it('creates wallet and shows finish buttons', async () => {
      mockSupabaseQueries()
      mockSetupWalletWithBalanceAndEnableWallets()

      const screen = renderWithPlugins(OnboardingPage)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await expect.element(screen.getByRole('button', { name: 'Add Another Wallet' })).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Finish Setup' })).toBeVisible()
    })

    it('shows wallet form again when clicking "Add Another Wallet"', async () => {
      mockSupabaseQueries()
      mockSetupWalletWithBalanceAndEnableWallets()

      const screen = renderWithPlugins(OnboardingPage)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await expect.element(screen.getByRole('button', { name: 'Add Another Wallet' })).toBeVisible()

      await userEvent.click(screen.getByRole('button', { name: 'Add Another Wallet' }))

      await expect.element(screen.getByLabelText('Wallet Name')).toBeVisible()
    })
  })

  describe('finish onboarding', () => {
    it('calls completeOnboarding, clears cache, and navigates when clicking Finish Setup', async () => {
      mockSupabaseQueries()
      mockSetupWalletWithBalanceAndEnableWallets()

      const screen = renderWithPlugins(OnboardingPage)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      const finishButton = screen.getByRole('button', { name: 'Finish Setup' })
      await expect.element(finishButton).toBeVisible()

      await vi.waitFor(async () => {
        const element = finishButton.element()
        expect(element).not.toBeDisabled()
      })

      await userEvent.click(finishButton)

      await vi.waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })

      await vi.waitFor(() => {
        expect(mockClearOnboardingCache).toHaveBeenCalled()
      })

      await vi.waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith({ name: 'wallets' })
      })
    })
  })
})
