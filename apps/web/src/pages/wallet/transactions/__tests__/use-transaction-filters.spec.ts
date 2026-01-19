import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'

const mockRouterReplace = vi.fn()
const mockRouteQuery: Record<string, string | null> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mockRouteQuery }),
  useRouter: () => ({ replace: mockRouterReplace }),
}))

import { useTransactionFilters, TRANSACTION_TYPES } from '../composables/use-transaction-filters'

describe('useTransactionFilters', () => {
  beforeEach(() => {
    mockRouterReplace.mockClear()
    Object.keys(mockRouteQuery).forEach((key) => delete mockRouteQuery[key])
  })

  it('initializes with default null values when no query params', () => {
    const { filters } = useTransactionFilters()

    expect(filters.value).toEqual({
      type: null,
      dateFrom: null,
      dateTo: null,
      amountMin: null,
      amountMax: null,
      categoryId: null,
      incomeSourceId: null,
      destinationWalletId: null,
      currencyCode: null,
    })
  })

  it('initializes from URL query params', () => {
    mockRouteQuery.type = 'expense'
    mockRouteQuery.dateFrom = '2024-01-01'
    mockRouteQuery.amountMin = '100'

    const { filters } = useTransactionFilters()

    expect(filters.value.type).toBe('expense')
    expect(filters.value.dateFrom).toBe('2024-01-01')
    expect(filters.value.amountMin).toBe(100)
  })

  it('ignores invalid transaction type from URL', () => {
    mockRouteQuery.type = 'invalid-type'

    const { filters } = useTransactionFilters()

    expect(filters.value.type).toBeNull()
  })

  it('updates filter and syncs to URL', async () => {
    const { filters, updateFilter } = useTransactionFilters()

    updateFilter('type', 'income')
    await nextTick()

    expect(filters.value.type).toBe('income')
    expect(mockRouterReplace).toHaveBeenCalled()
  })

  it('clears categoryId when type changes from expense', async () => {
    const { filters, updateFilter } = useTransactionFilters()

    filters.value.type = 'expense'
    filters.value.categoryId = 'cat-1'

    updateFilter('type', 'income')

    expect(filters.value.categoryId).toBeNull()
  })

  it('clears incomeSourceId when type changes from income', async () => {
    const { filters, updateFilter } = useTransactionFilters()

    filters.value.type = 'income'
    filters.value.incomeSourceId = 'source-1'

    updateFilter('type', 'expense')

    expect(filters.value.incomeSourceId).toBeNull()
  })

  it('clears destinationWalletId when type changes from transfer', async () => {
    const { filters, updateFilter } = useTransactionFilters()

    filters.value.type = 'transfer'
    filters.value.destinationWalletId = 'wallet-1'

    updateFilter('type', 'income')

    expect(filters.value.destinationWalletId).toBeNull()
  })

  it('resets all filters', async () => {
    const { filters, resetFilters } = useTransactionFilters()

    filters.value.type = 'expense'
    filters.value.dateFrom = '2024-01-01'
    filters.value.amountMin = 100

    resetFilters()

    expect(filters.value.type).toBeNull()
    expect(filters.value.dateFrom).toBeNull()
    expect(filters.value.amountMin).toBeNull()
  })

  it('hasActiveFilters is true when any filter is set', () => {
    const { filters, hasActiveFilters } = useTransactionFilters()

    expect(hasActiveFilters.value).toBe(false)

    filters.value.type = 'expense'

    expect(hasActiveFilters.value).toBe(true)
  })

  it('exports TRANSACTION_TYPES constant', () => {
    expect(TRANSACTION_TYPES).toHaveLength(4)
    expect(TRANSACTION_TYPES.map((t) => t.value)).toEqual([
      'income',
      'expense',
      'transfer',
      'exchange',
    ])
  })
})
