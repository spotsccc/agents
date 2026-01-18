import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import TransactionForm from '../transaction-form.vue'

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

// Helper to wait for form to be ready and get all comboboxes
async function waitForFormReady(screen: ReturnType<typeof renderWithPlugins>) {
  await expect.element(screen.getByText('Transaction type')).toBeVisible()
}

// Combobox indices vary by transaction type:
// Expense: [type=0, currency=1, category=2]
// Income: [type=0, currency=1, source=2]
// Exchange: [type=0, fromCurrency=1, toCurrency=2]
// Transfer: [type=0, fromCurrency=1, wallet=2, toCurrency=3]
const COMBOBOX = {
  TYPE: 0,
  CURRENCY: 1,
  THIRD: 2, // category, source, toCurrency, or destinationWallet
  FOURTH: 3, // destinationCurrency for transfer
} as const

async function selectCombobox(
  screen: ReturnType<typeof renderWithPlugins>,
  index: number,
  optionName: string
) {
  const combobox = screen.getByRole('combobox').nth(index)
  await userEvent.click(combobox)
  await expect.element(screen.getByRole('option', { name: optionName })).toBeVisible()
  await userEvent.click(screen.getByRole('option', { name: optionName }))
}

async function selectTransactionType(screen: ReturnType<typeof renderWithPlugins>, type: string) {
  await waitForFormReady(screen)
  await selectCombobox(screen, COMBOBOX.TYPE, type)
}

async function fillAmount(screen: ReturnType<typeof renderWithPlugins>, value: string) {
  // For exchange/transfer, there are two Amount inputs. Use the first one (Amount to Send)
  const amountInput = screen.getByLabelText(/Amount/).first()
  await userEvent.clear(amountInput)
  await userEvent.fill(amountInput, value)
}

describe('TransactionForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
    mockCreateIncome.mockClear()
    mockCreateExpense.mockClear()
    mockCreateExchange.mockClear()
    mockCreateTransfer.mockClear()
    mockPush.mockClear()
    setupMocks()
  })

  describe('rendering', () => {
    it('renders common fields for all transaction types', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Transaction type')).toBeVisible()
      await expect.element(screen.getByText('Currency')).toBeVisible()
      await expect.element(screen.getByLabelText('Amount')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Create' })).toBeVisible()
    })

    it('shows category field for expense type (default)', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
    })

    it('defaults amount to 0', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByLabelText('Amount')).toHaveValue(0)
    })
  })

  describe('validation', () => {
    it('shows error when amount is not positive', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Amount must be positive')).toBeVisible()
    })

    it('shows error when category not selected for expense', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      await fillAmount(screen, '100')
      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Category is required')).toBeVisible()
    })

    it('shows multiple validation errors together', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Amount must be positive')).toBeVisible()
      await expect.element(screen.getByText('Category is required')).toBeVisible()
    })

    it('shows error when income source not selected for income', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Income')
      // Wait for the Income Source label (not the placeholder text)
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')
      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Income source is required')).toBeVisible()
    })

    it('shows error when target currency not selected for exchange', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Exchange')
      // Wait for exchange form to render (3 comboboxes)
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')
      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Target currency is required')).toBeVisible()
    })

    it('shows error when amount to receive is not positive for exchange', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Exchange')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'EUR')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Amount to receive must be positive')).toBeVisible()
    })

    it('shows error when exchanging to the same currency', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Exchange')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'USD')

      // Fill toAmount - use specific label
      const toAmountInput = screen.getByRole('spinbutton', { name: 'Amount to Receive' })
      await userEvent.fill(toAmountInput, '90')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Cannot exchange to the same currency')).toBeVisible()
    })

    it('shows error when destination wallet not selected for transfer', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Transfer')
      // Wait for transfer form to render (4 comboboxes)
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.FOURTH)).toBeVisible()
      await fillAmount(screen, '100')
      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Destination wallet is required')).toBeVisible()
    })

    it('shows error when destination currency not selected for transfer', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Transfer')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.FOURTH)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'Savings')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Destination currency is required')).toBeVisible()
    })

    it('shows error when amount to receive is not positive for transfer', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Transfer')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.FOURTH)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'Savings')

      await selectCombobox(screen, COMBOBOX.FOURTH, 'EUR')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Amount to receive must be positive')).toBeVisible()
    })
  })

  describe('successful submission', () => {
    it('creates expense transaction and navigates to wallet', async () => {
      mockCreateExpense.mockResolvedValueOnce({ data: { id: 'tx-1' }, error: null })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      await fillAmount(screen, '100')
      await selectCombobox(screen, COMBOBOX.THIRD, 'Food')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.poll(() => mockCreateExpense.mock.calls.length).toBe(1)
      expect(mockCreateExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-1',
          amount: 100,
          currency: 'USD',
          categoryId: 'cat-1',
        })
      )
      await expect.poll(() => mockPush.mock.calls.length).toBe(1)
      expect(mockPush).toHaveBeenCalledWith({ name: 'wallet', params: { id: 'wallet-1' } })
    })

    it('creates income transaction and navigates to wallet', async () => {
      mockCreateIncome.mockResolvedValueOnce({ data: { id: 'tx-1' }, error: null })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Income')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '500')
      await selectCombobox(screen, COMBOBOX.THIRD, 'Salary')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.poll(() => mockCreateIncome.mock.calls.length).toBe(1)
      expect(mockCreateIncome).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-1',
          amount: 500,
          currency: 'USD',
          sourceId: 'src-1',
        })
      )
      await expect.poll(() => mockPush.mock.calls.length).toBe(1)
    })

    it('creates exchange transaction and navigates to wallet', async () => {
      mockCreateExchange.mockResolvedValueOnce({ data: { id: 'tx-1' }, error: null })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Exchange')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')
      await selectCombobox(screen, COMBOBOX.THIRD, 'EUR')

      const toAmountInput = screen.getByRole('spinbutton', { name: 'Amount to Receive' })
      await userEvent.fill(toAmountInput, '90')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.poll(() => mockCreateExchange.mock.calls.length).toBe(1)
      expect(mockCreateExchange).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'wallet-1',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 100,
          toAmount: 90,
        })
      )
      await expect.poll(() => mockPush.mock.calls.length).toBe(1)
    })

    it('creates transfer transaction and navigates to wallet', async () => {
      mockCreateTransfer.mockResolvedValueOnce({ data: { id: 'tx-1' }, error: null })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Transfer')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.FOURTH)).toBeVisible()
      await fillAmount(screen, '200')
      await selectCombobox(screen, COMBOBOX.THIRD, 'Savings')
      await selectCombobox(screen, COMBOBOX.FOURTH, 'EUR')

      const toAmountInput = screen.getByRole('spinbutton', { name: 'Amount to Receive' })
      await userEvent.fill(toAmountInput, '180')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.poll(() => mockCreateTransfer.mock.calls.length).toBe(1)
      expect(mockCreateTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          fromWalletId: 'wallet-1',
          toWalletId: 'wallet-2',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          fromAmount: 200,
          toAmount: 180,
        })
      )
      await expect.poll(() => mockPush.mock.calls.length).toBe(1)
    })
  })

  describe('initialType prop', () => {
    it('defaults to expense when no initialType provided', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      // Expense shows Category field
      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
    })

    it('uses income initialType and shows income source field', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1', initialType: 'income' },
      })

      // Income shows Income Source field (use exact match to avoid matching placeholder)
      await expect.element(screen.getByText('Income Source', { exact: true })).toBeVisible()
    })

    it('uses exchange initialType and shows exchange fields', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1', initialType: 'exchange' },
      })

      await expect.element(screen.getByText('To Currency')).toBeVisible()
      await expect.element(screen.getByLabelText('Amount to Receive')).toBeVisible()
    })

    it('uses transfer initialType and shows transfer fields', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1', initialType: 'transfer' },
      })

      await expect.element(screen.getByText('Destination Wallet')).toBeVisible()
      await expect.element(screen.getByText('Destination Currency')).toBeVisible()
    })

    it('allows changing type after initial selection', async () => {
      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1', initialType: 'income' },
      })

      // Initially shows income source (use exact match)
      await expect.element(screen.getByText('Income Source', { exact: true })).toBeVisible()

      // Change to expense
      await selectCombobox(screen, COMBOBOX.TYPE, 'Expense')

      // Now shows category instead
      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      expect(screen.getByText('Income Source', { exact: true }).query()).toBeNull()
    })
  })

  describe('error handling', () => {
    it('displays error when expense creation fails', async () => {
      mockCreateExpense.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insufficient funds' },
      })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'Food')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Insufficient funds')).toBeVisible()
      await expect.element(screen.getByText('Error')).toBeVisible()
    })

    it('displays error when income creation fails', async () => {
      mockCreateIncome.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid income source' },
      })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Income')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'Salary')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Invalid income source')).toBeVisible()
    })

    it('displays error when exchange creation fails', async () => {
      mockCreateExchange.mockResolvedValueOnce({
        data: null,
        error: { message: 'Exchange rate unavailable' },
      })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Exchange')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.THIRD)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'EUR')

      const toAmountInput = screen.getByRole('spinbutton', { name: 'Amount to Receive' })
      await userEvent.fill(toAmountInput, '90')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Exchange rate unavailable')).toBeVisible()
    })

    it('displays error when transfer creation fails', async () => {
      mockCreateTransfer.mockResolvedValueOnce({
        data: null,
        error: { message: 'Wallet not found' },
      })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await selectTransactionType(screen, 'Transfer')
      await expect.element(screen.getByRole('combobox').nth(COMBOBOX.FOURTH)).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'Savings')

      await selectCombobox(screen, COMBOBOX.FOURTH, 'EUR')

      const toAmountInput = screen.getByRole('spinbutton', { name: 'Amount to Receive' })
      await userEvent.fill(toAmountInput, '90')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Wallet not found')).toBeVisible()
    })

    it('clears error when transaction type changes', async () => {
      mockCreateExpense.mockResolvedValueOnce({
        data: null,
        error: { message: 'Some error' },
      })

      const screen = renderWithPlugins(TransactionForm, {
        props: { walletId: 'wallet-1' },
      })

      await expect.element(screen.getByText('Category', { exact: true })).toBeVisible()
      await fillAmount(screen, '100')

      await selectCombobox(screen, COMBOBOX.THIRD, 'Food')

      await userEvent.click(screen.getByRole('button', { name: 'Create' }))

      await expect.element(screen.getByText('Some error')).toBeVisible()

      await selectCombobox(screen, COMBOBOX.TYPE, 'Income')

      await expect.element(screen.getByText('Some error')).not.toBeInTheDocument()
    })
  })
})
