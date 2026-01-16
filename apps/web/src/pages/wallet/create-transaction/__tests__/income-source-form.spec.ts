import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import IncomeSourceForm from '../income-source-form.vue'

describe('IncomeSourceForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  describe('rendering', () => {
    it('renders all form fields', () => {
      renderWithPlugins(IncomeSourceForm)

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Description')).toBeInTheDocument()
      expect(screen.getByLabelText('Recurring income')).toBeInTheDocument()
      expect(screen.getByLabelText('Icon')).toBeInTheDocument()
      expect(screen.getByLabelText('Color')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderWithPlugins(IncomeSourceForm)

      expect(screen.getByRole('button', { name: 'Create Source' })).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const { user } = renderWithPlugins(IncomeSourceForm)

      await user.click(screen.getByRole('button', { name: 'Create Source' }))

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
    })

    it('does not show errors for valid input', async () => {
      const { user } = renderWithPlugins(IncomeSourceForm)

      await user.type(screen.getByLabelText('Name'), 'Salary')
      await user.click(screen.getByRole('button', { name: 'Create Source' }))

      await waitFor(() => {
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('emits created event after successful submission', async () => {
      const { user, emitted } = renderWithPlugins(IncomeSourceForm)

      await user.type(screen.getByLabelText('Name'), 'Salary')
      await user.click(screen.getByRole('button', { name: 'Create Source' }))

      await waitFor(() => {
        const createdEvents = emitted().created as unknown[][]
        expect(createdEvents).toBeDefined()
        expect(createdEvents[0][0]).toMatchObject({
          id: 'test-id',
          name: 'Test Source',
        })
      })
    })

    it('does not emit created event when validation fails', async () => {
      const { user, emitted } = renderWithPlugins(IncomeSourceForm)

      await user.click(screen.getByRole('button', { name: 'Create Source' }))

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })

      expect(emitted().created).toBeUndefined()
    })

    it('calls supabase with correct table name', async () => {
      const { user } = renderWithPlugins(IncomeSourceForm)

      await user.type(screen.getByLabelText('Name'), 'Salary')
      await user.click(screen.getByRole('button', { name: 'Create Source' }))

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('income_sources')
      })
    })
  })

  describe('error handling', () => {
    it('does not emit created event when API returns error', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: 'Database error' },
              }),
          }),
        }),
      } as ReturnType<typeof mockSupabaseFrom>)

      const { user, emitted } = renderWithPlugins(IncomeSourceForm)

      await user.type(screen.getByLabelText('Name'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Create Source' }))

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalled()
      })

      expect(emitted().created).toBeUndefined()
    })
  })
})
