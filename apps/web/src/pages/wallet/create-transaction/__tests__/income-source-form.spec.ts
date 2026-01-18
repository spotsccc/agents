import { describe, it, expect, beforeEach } from 'vitest'
import { userEvent } from 'vitest/browser'
import { renderWithPlugins } from '@/shared/tests/utils'
import { mockSupabaseFrom } from '@/shared/tests/mocks'
import IncomeSourceForm from '../income-source-form.vue'

describe('IncomeSourceForm', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockClear()
  })

  describe('rendering', () => {
    it('renders all form fields', async () => {
      const screen = renderWithPlugins(IncomeSourceForm)

      await expect.element(screen.getByLabelText('Name')).toBeVisible()
      await expect.element(screen.getByLabelText('Description')).toBeVisible()
      await expect.element(screen.getByLabelText('Recurring income')).toBeVisible()
      await expect.element(screen.getByLabelText('Icon')).toBeVisible()
      await expect.element(screen.getByLabelText('Color')).toBeVisible()
      await expect.element(screen.getByRole('button', { name: 'Create Source' })).toBeVisible()
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const screen = renderWithPlugins(IncomeSourceForm)

      await userEvent.click(screen.getByRole('button', { name: 'Create Source' }))

      await expect.element(screen.getByText('Name is required')).toBeVisible()
    })

    it('does not emit created event when validation fails', async () => {
      const screen = renderWithPlugins(IncomeSourceForm)

      await userEvent.click(screen.getByRole('button', { name: 'Create Source' }))

      await expect.element(screen.getByText('Name is required')).toBeVisible()
      expect(screen.emitted().created).toBeUndefined()
    })
  })

  describe('form submission', () => {
    it('emits created event with source data after successful submission', async () => {
      const screen = renderWithPlugins(IncomeSourceForm)

      await userEvent.fill(screen.getByLabelText('Name'), 'Salary')
      await userEvent.click(screen.getByRole('button', { name: 'Create Source' }))

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

      const screen = renderWithPlugins(IncomeSourceForm)

      await userEvent.fill(screen.getByLabelText('Name'), 'Test')
      await userEvent.click(screen.getByRole('button', { name: 'Create Source' }))

      await expect.element(screen.getByRole('alert')).toBeVisible()
      await expect.element(screen.getByText('Database error')).toBeVisible()
      expect(screen.emitted().created).toBeUndefined()
    })
  })
})
