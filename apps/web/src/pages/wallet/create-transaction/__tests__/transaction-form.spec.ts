import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import TransactionForm from '../transaction-form.vue'

/**
 * TransactionForm Unit Tests
 *
 * Note: Some tests for successful submissions and complete form flows are limited
 * because Reka UI Select components don't work well in JSDOM environments.
 * The Select component's model doesn't update when interacting with the native
 * select element in tests.
 *
 * For full integration testing of form submissions with all transaction types,
 * use E2E tests with Playwright.
 */

// Mock edge functions
const mockCreateIncome = vi.fn()
const mockCreateExpense = vi.fn()
const mockCreateExchange = vi.fn()
const mockCreateTransfer = vi.fn()

vi.mock('@/shared/supabase/edge-functions', () => ({
  createIncomeTransaction: (...args: unknown[]) => mockCreateIncome(...args),
  createExpenseTransaction: (...args: unknown[]) => mockCreateExpense(...args),
  createExchangeTransaction: (...args: unknown[]) => mockCreateExchange(...args),
  createTransferTransaction: (...args: unknown[]) => mockCreateTransfer(...args),
}))

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock data
const mockCurrencies = [{ code: 'USD' }, { code: 'EUR' }, { code: 'GBP' }]

const mockWallets = [
  { id: 'wallet-1', name: 'Main Wallet' },
  { id: 'wallet-2', name: 'Savings' },
]

const mockIncomeSources = [
  { id: 'src-1', name: 'Salary', user_id: 'test-user-id', deleted_at: null },
  { id: 'src-2', name: 'Freelance', user_id: 'test-user-id', deleted_at: null },
]

const mockCategories = [
  { id: 'cat-1', name: 'Food', user_id: 'test-user-id' },
  { id: 'cat-2', name: 'Transport', user_id: 'test-user-id' },
]

function setupMocks() {
  mockSupabaseFrom.mockImplementation(((table: string) => {
    if (table === 'currencies') {
      return {
        select: () => Promise.resolve({ data: mockCurrencies, error: null }),
      }
    }
    if (table === 'wallets') {
      return {
        select: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: mockWallets, error: null }),
          }),
        }),
      }
    }
    if (table === 'income_sources') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              order: () => Promise.resolve({ data: mockIncomeSources, error: null }),
            }),
          }),
        }),
      }
    }
    if (table === 'categories') {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockCategories, error: null }),
          }),
        }),
      }
    }
    return {}
  }) as unknown as typeof mockSupabaseFrom)
}

describe('TransactionForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
    mockCreateIncome.mockClear()
    mockCreateExpense.mockClear()
    mockCreateExchange.mockClear()
    mockCreateTransfer.mockClear()
    mockPush.mockClear()
  })

  describe('rendering', () => {
    it('shows all base fields', () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      expect(screen.getByText('Transaction type')).toBeInTheDocument()
      expect(screen.getByText('Currency')).toBeInTheDocument()
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    })

    it('shows category field for expense type (default)', async () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      // Expense is the default type
      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument()
      })
    })

    it('has transaction type select with default value', async () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      // The hidden native select should have expense as the default value
      await waitFor(() => {
        const nativeSelects = document.querySelectorAll('select')
        // First select is transaction type, should have expense value
        expect(nativeSelects.length).toBeGreaterThan(0)
        const firstSelect = nativeSelects[0]
        // Note: toHaveValue doesn't work when select has no option children,
        // so we check the attribute directly
        expect(firstSelect.getAttribute('value')).toBe('expense')
      })
    })

    it('shows amount input with default value of 0', () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      const amountInput = screen.getByLabelText('Amount')
      expect(amountInput).toHaveValue(0)
    })
  })

  describe('validation', () => {
    describe('common fields', () => {
      it('shows error when amount is not positive', async () => {
        setupMocks()
        const { user } = renderWithPlugins(TransactionForm, {
          props: { walletId: 'wallet-1' },
        })

        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText('Category')).toBeInTheDocument()
        })

        // Amount is 0 by default, try to submit
        await user.click(screen.getByRole('button', { name: 'Create' }))

        await waitFor(() => {
          expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
        })
      })
    })

    describe('expense transaction', () => {
      it('shows error when category not selected', async () => {
        setupMocks()
        const { user } = renderWithPlugins(TransactionForm, {
          props: { walletId: 'wallet-1' },
        })

        // Expense is default, fill amount but not category
        const amountInput = screen.getByLabelText('Amount')
        await user.clear(amountInput)
        await user.type(amountInput, '100')

        await user.click(screen.getByRole('button', { name: 'Create' }))

        await waitFor(() => {
          expect(screen.getByText('Category is required')).toBeInTheDocument()
        })
      })

      it('shows both validation errors together', async () => {
        setupMocks()
        const { user } = renderWithPlugins(TransactionForm, {
          props: { walletId: 'wallet-1' },
        })

        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText('Category')).toBeInTheDocument()
        })

        // Try to submit with default values (amount=0, no category)
        await user.click(screen.getByRole('button', { name: 'Create' }))

        await waitFor(() => {
          expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
          expect(screen.getByText('Category is required')).toBeInTheDocument()
        })
      })
    })
  })

  describe('data fetching', () => {
    it('fetches currencies on mount', async () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('currencies')
      })
    })

    it('fetches wallets on mount', async () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('wallets')
      })
    })

    it('fetches categories on mount for expense type', async () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('categories')
      })
    })
  })

  describe('edge functions are properly mocked', () => {
    it('has mocked createExpenseTransaction', () => {
      expect(mockCreateExpense).toBeDefined()
      expect(vi.isMockFunction(mockCreateExpense)).toBe(true)
    })

    it('has mocked createIncomeTransaction', () => {
      expect(mockCreateIncome).toBeDefined()
      expect(vi.isMockFunction(mockCreateIncome)).toBe(true)
    })

    it('has mocked createExchangeTransaction', () => {
      expect(mockCreateExchange).toBeDefined()
      expect(vi.isMockFunction(mockCreateExchange)).toBe(true)
    })

    it('has mocked createTransferTransaction', () => {
      expect(mockCreateTransfer).toBeDefined()
      expect(vi.isMockFunction(mockCreateTransfer)).toBe(true)
    })

    it('has mocked router push', () => {
      expect(mockPush).toBeDefined()
      expect(vi.isMockFunction(mockPush)).toBe(true)
    })
  })

  describe('submit button', () => {
    it('is enabled by default', () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      const submitButton = screen.getByRole('button', { name: 'Create' })
      expect(submitButton).not.toBeDisabled()
    })

    it('has correct default text', () => {
      setupMocks()
      renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    })
  })
})
