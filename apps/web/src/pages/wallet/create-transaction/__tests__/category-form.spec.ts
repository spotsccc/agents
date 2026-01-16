import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/vue'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import CategoryForm from '../category-form.vue'

describe('CategoryForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  describe('rendering', () => {
    it('renders the name field', () => {
      renderWithPlugins(CategoryForm)

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderWithPlugins(CategoryForm)

      expect(screen.getByRole('button', { name: 'Create Category' })).toBeInTheDocument()
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const { user } = renderWithPlugins(CategoryForm)

      await user.click(screen.getByRole('button', { name: 'Create Category' }))

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })
    })

    it('does not show errors for valid input', async () => {
      const { user } = renderWithPlugins(CategoryForm)

      await user.type(screen.getByLabelText('Name'), 'Food')
      await user.click(screen.getByRole('button', { name: 'Create Category' }))

      await waitFor(() => {
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('emits created event after successful submission', async () => {
      const { user, emitted } = renderWithPlugins(CategoryForm)

      await user.type(screen.getByLabelText('Name'), 'Food')
      await user.click(screen.getByRole('button', { name: 'Create Category' }))

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
      const { user, emitted } = renderWithPlugins(CategoryForm)

      await user.click(screen.getByRole('button', { name: 'Create Category' }))

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument()
      })

      expect(emitted().created).toBeUndefined()
    })

    it('calls supabase with correct table name', async () => {
      const { user } = renderWithPlugins(CategoryForm)

      await user.type(screen.getByLabelText('Name'), 'Food')
      await user.click(screen.getByRole('button', { name: 'Create Category' }))

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('categories')
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

      const { user, emitted } = renderWithPlugins(CategoryForm)

      await user.type(screen.getByLabelText('Name'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Create Category' }))

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalled()
      })

      expect(emitted().created).toBeUndefined()
    })
  })
})
