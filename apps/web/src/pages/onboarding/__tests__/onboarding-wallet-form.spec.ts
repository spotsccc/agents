import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import OnboardingWalletForm from '../components/onboarding-wallet-form.vue'

const mockUser = { id: 'user-123', email: 'test@example.com' }

vi.mock('@/shared/auth/use-user.ts', () => ({
  useUser: () => ({ user: { value: mockUser } }),
}))

const mockSetupWalletWithBalance = vi.fn()

vi.mock('@/shared/supabase/edge-functions', () => ({
  setupWalletWithBalance: (params: unknown) => mockSetupWalletWithBalance(params),
}))

function mockCurrenciesQuery() {
  mockSupabaseFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        order: () =>
          Promise.resolve({
            data: [
              { code: 'USD', name: 'US Dollar', symbol: '$' },
              { code: 'EUR', name: 'Euro', symbol: '€' },
            ],
            error: null,
          }),
      }),
    }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>)
}

function mockEdgeFunctionSuccess() {
  mockSetupWalletWithBalance.mockResolvedValueOnce({
    data: {
      wallet_id: 'new-wallet-id',
      wallet_name: 'Test Wallet',
      balances: [{ id: 'balance-1', currency_code: 'USD', balance: 100 }],
    },
    error: null,
  })
}

function mockEdgeFunctionError(message: string) {
  mockSetupWalletWithBalance.mockResolvedValueOnce({
    data: null,
    error: { message },
  })
}

describe('OnboardingWalletForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
    mockSetupWalletWithBalance.mockClear()
    mockCurrenciesQuery()
  })

  describe('rendering', () => {
    it('renders wallet name input', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await expect.element(screen.getByLabelText('Wallet Name')).toBeVisible()
    })

    it('renders balances section with currency and amount', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await expect.element(screen.getByText('Balances')).toBeVisible()
      await expect.element(screen.getByText('Currency', { exact: true })).toBeVisible()
      await expect.element(screen.getByLabelText('Amount')).toBeVisible()
    })

    it('renders submit button', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await expect.element(screen.getByRole('button', { name: 'Create Wallet' })).toBeVisible()
    })

    it('renders Add Currency button', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await expect.element(screen.getByRole('button', { name: /Add Currency/i })).toBeVisible()
    })

    it('does not show remove button for single balance row', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      const removeButton = screen.getByRole('button', { name: /Remove balance/i })
      await expect.element(removeButton).not.toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error when wallet name is less than 3 characters', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'ab')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await expect.element(screen.getByText('Name must be at least 3 characters')).toBeVisible()

      expect(mockSetupWalletWithBalance).not.toHaveBeenCalled()
    })
  })

  describe('submission', () => {
    it('submits form with valid wallet name', async () => {
      mockEdgeFunctionSuccess()
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await vi.waitFor(() => {
        expect(mockSetupWalletWithBalance).toHaveBeenCalledWith(
          expect.objectContaining({
            walletName: 'My Wallet',
          })
        )
      })
    })

    it('emits success event after successful creation', async () => {
      mockEdgeFunctionSuccess()
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await vi.waitFor(() => {
        expect(screen.emitted().success).toBeTruthy()
      })
    })

    it('resets form after successful creation', async () => {
      mockEdgeFunctionSuccess()
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await vi.waitFor(() => {
        expect(screen.emitted().success).toBeTruthy()
      })

      await expect.element(screen.getByLabelText('Wallet Name')).toHaveValue('')
    })

    it('shows error message when creation fails', async () => {
      mockEdgeFunctionError('Server error')
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.fill(screen.getByLabelText('Wallet Name'), 'My Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create Wallet' }))

      await expect.element(screen.getByText('Server error')).toBeVisible()
    })
  })

  describe('balance management', () => {
    it('adds new balance row when Add Currency is clicked', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.click(screen.getByRole('button', { name: /Add Currency/i }))

      const removeButtons = screen.getByRole('button', { name: /Remove balance/i })
      await expect.element(removeButtons.first()).toBeVisible()
    })

    it('removes balance row when clicking remove button', async () => {
      const screen = renderWithPlugins(OnboardingWalletForm)

      await userEvent.click(screen.getByRole('button', { name: /Add Currency/i }))

      const removeButtons = screen.getByRole('button', { name: /Remove balance/i })
      await expect.element(removeButtons.first()).toBeVisible()

      await userEvent.click(removeButtons.first())

      await expect
        .element(screen.getByRole('button', { name: /Remove balance/i }))
        .not.toBeInTheDocument()
    })
  })
})
