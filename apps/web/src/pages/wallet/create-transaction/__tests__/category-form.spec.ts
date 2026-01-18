import { describe, it, expect, beforeEach } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import CategoryForm from '../category-form.vue'

describe('CategoryForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  describe('rendering', () => {
    it('renders name field and submit button', async () => {
      const screen = renderWithPlugins(CategoryForm)

      await expect.element(screen.getByLabelText('Name')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Create Category' })).toBeVisible()
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const screen = renderWithPlugins(CategoryForm)

      await userEvent.click(screen.getByRole('button', { name: 'Create Category' }))

      await expect.element(screen.getByText('Name is required')).toBeVisible()
    })

    it('does not emit created event when validation fails', async () => {
      const screen = renderWithPlugins(CategoryForm)

      await userEvent.click(screen.getByRole('button', { name: 'Create Category' }))

      await expect.element(screen.getByText('Name is required')).toBeVisible()
      expect(screen.emitted().created).toBeUndefined()
    })
  })

  describe('form submission', () => {
    it('emits created event with category data after successful submission', async () => {
      const screen = renderWithPlugins(CategoryForm)

      await userEvent.fill(screen.getByLabelText('Name'), 'Food')
      await userEvent.click(screen.getByRole('button', { name: 'Create Category' }))

      await expect.poll(() => screen.emitted().created).toBeDefined()
      const createdEvents = screen.emitted().created as unknown[][]
      expect(createdEvents[0][0]).toHaveProperty('id')
    })
  })

  describe('error handling', () => {
    it('displays error when API returns error', async () => {
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

      const screen = renderWithPlugins(CategoryForm)

      await userEvent.fill(screen.getByLabelText('Name'), 'Test')
      await userEvent.click(screen.getByRole('button', { name: 'Create Category' }))

      await expect.element(screen.getByRole('alert')).toBeVisible()
      await expect.element(screen.getByText('Database error')).toBeVisible()
      expect(screen.emitted().created).toBeUndefined()
    })
  })
})
