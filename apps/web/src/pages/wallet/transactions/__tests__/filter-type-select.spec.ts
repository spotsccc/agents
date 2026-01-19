import { describe, it, expect } from 'vitest'
import { renderWithPlugins } from '@/shared/tests/utils'
import FilterTypeSelect from '../components/filter-type-select.vue'

function renderComponent(modelValue: string | null = null) {
  return renderWithPlugins(FilterTypeSelect, {
    props: { modelValue },
  })
}

describe('FilterTypeSelect', () => {
  it('renders with label', async () => {
    const screen = renderComponent()

    await expect.element(screen.getByText('Type', { exact: true })).toBeVisible()
  })

  it('shows "All types" as default placeholder', async () => {
    const screen = renderComponent()

    await expect.element(screen.getByRole('combobox')).toBeVisible()
  })

  it('displays all transaction type options', async () => {
    const screen = renderComponent()

    // Click to open dropdown
    await screen.getByRole('combobox').click()

    await expect.element(screen.getByRole('option', { name: 'All types' })).toBeVisible()
    await expect.element(screen.getByRole('option', { name: 'Income' })).toBeVisible()
    await expect.element(screen.getByRole('option', { name: 'Expense' })).toBeVisible()
    await expect.element(screen.getByRole('option', { name: 'Transfer' })).toBeVisible()
    await expect.element(screen.getByRole('option', { name: 'Exchange' })).toBeVisible()
  })
})
