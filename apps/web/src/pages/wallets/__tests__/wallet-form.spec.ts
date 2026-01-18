import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import WalletForm from '../components/wallet-form.vue'

const mockUser = { id: 'user-123', email: 'test@example.com' }

vi.mock('@/shared/auth/use-user.ts', () => ({
  useUser: () => ({ user: { value: mockUser } }),
}))

function mockInsertSuccess() {
  mockSupabaseFrom.mockReturnValueOnce({
    insert: () => Promise.resolve({ data: { id: 'new-wallet-id' }, error: null }),
  } as unknown as ReturnType<typeof mockSupabaseFrom>)
}

function renderForm() {
  return renderWithPlugins(WalletForm)
}

describe('WalletForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  describe('rendering', () => {
    it('renders form elements', async () => {
      const screen = renderForm()

      await expect.element(screen.getByLabelText('Name')).toBeVisible()
      await expect.element(screen.getByPlaceholder('description')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Create wallet' })).toBeVisible()
    })
  })

  describe('submission', () => {
    it('submits form with valid data', async () => {
      mockInsertSuccess()
      const screen = renderForm()

      await userEvent.fill(screen.getByLabelText('Name'), 'My New Wallet')
      await userEvent.fill(screen.getByPlaceholder('description'), 'A test wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

      await vi.waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('wallets')
      })
    })

    it('emits success event after successful creation', async () => {
      mockInsertSuccess()
      const screen = renderWithPlugins(WalletForm)

      await userEvent.fill(screen.getByLabelText('Name'), 'My New Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

      await vi.waitFor(() => {
        expect(screen.emitted().success).toBeTruthy()
      })
    })

    it('resets form after successful creation', async () => {
      mockInsertSuccess()
      const screen = renderForm()

      const nameInput = screen.getByLabelText('Name')
      await userEvent.fill(nameInput, 'My New Wallet')
      await userEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

      await vi.waitFor(() => {
        expect(nameInput.element()).toHaveValue('')
      })
    })

    it('does not submit when name is invalid', async () => {
      const screen = renderForm()

      // Fill with too short name and try to submit
      await userEvent.fill(screen.getByLabelText('Name'), 'ab')
      await userEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

      // Wait a bit to ensure nothing was submitted
      await new Promise((r) => setTimeout(r, 100))

      // Supabase should not have been called because validation failed
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })
  })
})
