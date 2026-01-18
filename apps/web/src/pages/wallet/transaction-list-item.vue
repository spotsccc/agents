<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, ArrowLeftRight, RefreshCcw } from 'lucide-vue-next'
import { isToday, isYesterday, isSameYear, format } from 'date-fns'

type TransactionType = 'income' | 'expense' | 'transfer' | 'exchange'

interface TypeConfig {
  icon: typeof TrendingUp
  iconClass: string
  bgClass: string
  amountPrefix: string
  amountClass: string
}

interface TransactionEntry {
  amount: number
  balance_after: number
  currency_code: string
}

interface TransactionData {
  type: string
  description: string | null
  date: string | null
  entries: TransactionEntry[]
}

interface Props {
  transaction: TransactionData
  categoryName?: string
  sourceName?: string
  targetWalletName?: string
}

const props = defineProps<Props>()

const typeConfig = {
  income: {
    icon: TrendingUp,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-100',
    amountPrefix: '+',
    amountClass: 'text-emerald-600',
  },
  expense: {
    icon: TrendingDown,
    iconClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    amountPrefix: '-',
    amountClass: 'text-destructive',
  },
  transfer: {
    icon: ArrowLeftRight,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    amountPrefix: '',
    amountClass: 'text-foreground',
  },
  exchange: {
    icon: RefreshCcw,
    iconClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    amountPrefix: '',
    amountClass: 'text-foreground',
  },
} as const satisfies Record<TransactionType, TypeConfig>

const transactionType = computed<TransactionType>(() => {
  return (props.transaction.type as TransactionType) || 'expense'
})

const config = computed(() => typeConfig[transactionType.value])

// Get the primary entry for this wallet (first entry or the one with the main amount)
const primaryEntry = computed(() => {
  return props.transaction.entries[0] ?? null
})

// For exchange/transfer, get the secondary entry if it exists
const secondaryEntry = computed(() => {
  if (props.transaction.entries.length > 1) {
    return props.transaction.entries[1]
  }
  return null
})

const displayTitle = computed(() => {
  const type = transactionType.value
  if (props.transaction.description) {
    return props.transaction.description
  }
  switch (type) {
    case 'income':
      return 'Income'
    case 'expense':
      return 'Expense'
    case 'transfer':
      return 'Transfer'
    case 'exchange':
      return 'Exchange'
    default:
      return 'Transaction'
  }
})

const secondaryInfo = computed(() => {
  const type = transactionType.value
  const parts: string[] = []

  if (type === 'expense' && props.categoryName) {
    parts.push(props.categoryName)
  } else if (type === 'income' && props.sourceName) {
    parts.push(props.sourceName)
  } else if (type === 'transfer' && props.targetWalletName) {
    parts.push(`To ${props.targetWalletName}`)
  } else if (type === 'exchange' && primaryEntry.value && secondaryEntry.value) {
    const from = primaryEntry.value.currency_code
    const to = secondaryEntry.value.currency_code
    parts.push(`${from} → ${to}`)
  }

  parts.push(formattedDate.value)

  return parts.join(' \u2022 ')
})

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback for unknown currency codes
    return `${amount.toFixed(2)} ${currencyCode}`
  }
}

const formattedAmount = computed(() => {
  const entry = primaryEntry.value
  if (!entry) return ''

  const absAmount = Math.abs(entry.amount)
  const formatted = formatCurrency(absAmount, entry.currency_code)
  const prefix = config.value.amountPrefix

  return `${prefix}${formatted}`
})

const formattedBalance = computed(() => {
  const entry = primaryEntry.value
  if (!entry) return ''

  return formatCurrency(entry.balance_after, entry.currency_code)
})

function parseLocalDate(dateString: string): Date | null {
  // Extract date part (YYYY-MM-DD) to avoid timezone issues
  const datePart = dateString.slice(0, 10)
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match
  // Create date as local midnight (not UTC)
  return new Date(Number(year), Number(month) - 1, Number(day))
}

const formattedDate = computed(() => {
  if (!props.transaction.date) {
    return ''
  }

  const date = parseLocalDate(props.transaction.date)

  if (!date || isNaN(date.getTime())) {
    return props.transaction.date
  }

  if (isToday(date)) {
    return 'Today'
  }

  if (isYesterday(date)) {
    return 'Yesterday'
  }

  const now = new Date()
  if (isSameYear(date, now)) {
    return format(date, 'MMM d')
  }

  return format(date, 'MMM d, yyyy')
})
</script>

<template>
  <div
    role="listitem"
    class="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
  >
    <!-- Icon -->
    <div
      :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.bgClass]"
    >
      <component :is="config.icon" :class="['h-5 w-5', config.iconClass]" />
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-foreground">{{ displayTitle }}</p>
      <p class="truncate text-sm text-muted-foreground">
        <time :datetime="transaction.date ?? undefined">{{ secondaryInfo }}</time>
      </p>
    </div>

    <!-- Amount -->
    <div class="shrink-0 text-right">
      <p :class="['font-semibold', config.amountClass]">{{ formattedAmount }}</p>
      <p class="text-sm text-muted-foreground">Balance: {{ formattedBalance }}</p>
    </div>
  </div>
</template>
