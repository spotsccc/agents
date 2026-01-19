import { ref, computed, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type TransactionType = 'income' | 'expense' | 'transfer' | 'exchange'

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'exchange', label: 'Exchange' },
]

export interface TransactionFilters {
  type: TransactionType | null
  dateFrom: string | null
  dateTo: string | null
  amountMin: number | null
  amountMax: number | null
  categoryId: string | null
  incomeSourceId: string | null
  destinationWalletId: string | null
  currencyCode: string | null
}

export interface UseTransactionFiltersReturn {
  filters: Ref<TransactionFilters>
  hasActiveFilters: Ref<boolean>
  updateFilter: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: TransactionFilters = {
  type: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
  categoryId: null,
  incomeSourceId: null,
  destinationWalletId: null,
  currencyCode: null,
}

type LocationQueryValue = string | null
type LocationQueryValueRaw = LocationQueryValue | LocationQueryValue[]

function parseQueryParam(value: LocationQueryValueRaw | undefined): string | null {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) {
    const first = value[0]
    return first ?? null
  }
  return value
}

function parseNumberParam(value: LocationQueryValueRaw | undefined): number | null {
  const str = parseQueryParam(value)
  if (!str) return null
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

const VALID_TRANSACTION_TYPES = new Set<string>(['income', 'expense', 'transfer', 'exchange'])

function parseTransactionType(value: LocationQueryValueRaw | undefined): TransactionType | null {
  const str = parseQueryParam(value)
  if (!str) return null
  return VALID_TRANSACTION_TYPES.has(str) ? (str as TransactionType) : null
}

export function useTransactionFilters(): UseTransactionFiltersReturn {
  const route = useRoute()
  const router = useRouter()

  const filters = ref<TransactionFilters>({
    type: parseTransactionType(route.query.type),
    dateFrom: parseQueryParam(route.query.dateFrom),
    dateTo: parseQueryParam(route.query.dateTo),
    amountMin: parseNumberParam(route.query.amountMin),
    amountMax: parseNumberParam(route.query.amountMax),
    categoryId: parseQueryParam(route.query.categoryId),
    incomeSourceId: parseQueryParam(route.query.incomeSourceId),
    destinationWalletId: parseQueryParam(route.query.destinationWalletId),
    currencyCode: parseQueryParam(route.query.currencyCode),
  })

  const hasActiveFilters = computed(() => {
    return Object.values(filters.value).some((value) => value !== null)
  })

  function updateFilter<K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) {
    filters.value = { ...filters.value, [key]: value }

    // Clear dependent filters when type changes
    if (key === 'type') {
      if (value !== 'expense') {
        filters.value.categoryId = null
      }
      if (value !== 'income') {
        filters.value.incomeSourceId = null
      }
      if (value !== 'transfer') {
        filters.value.destinationWalletId = null
      }
    }
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
  }

  // Sync filters to URL query params
  watch(
    filters,
    (newFilters) => {
      const query: Record<string, string> = {}

      for (const [key, value] of Object.entries(newFilters)) {
        if (value !== null && value !== undefined) {
          query[key] = String(value)
        }
      }

      router.replace({ query })
    },
    { deep: true }
  )

  return {
    filters,
    hasActiveFilters,
    updateFilter,
    resetFilters,
  }
}
