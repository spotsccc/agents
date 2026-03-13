<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'

interface Balance {
  id: string
  balance: number
  currency_code: string
}

interface Props {
  balances: Balance[]
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3,
})

const isExpanded = ref(false)

const sortedBalances = computed(() => {
  return [...props.balances].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
})

const visibleBalances = computed(() => {
  if (isExpanded.value) {
    return sortedBalances.value
  }
  return sortedBalances.value.slice(0, props.maxVisible)
})

const hasMore = computed(() => {
  return sortedBalances.value.length > props.maxVisible
})

const hiddenCount = computed(() => {
  return sortedBalances.value.length - props.maxVisible
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
    return `${amount.toFixed(2)} ${currencyCode}`
  }
}

function toggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="space-y-1">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        v-for="balance in visibleBalances"
        :key="balance.id"
        class="text-sm font-medium text-foreground"
      >
        {{ formatCurrency(balance.balance, balance.currency_code) }}
      </span>
      <Button
        v-if="hasMore"
        variant="ghost"
        size="sm"
        class="h-6 px-2 text-xs text-muted-foreground"
        @click="toggle"
      >
        <template v-if="isExpanded">
          <ChevronUp class="mr-1 h-3 w-3" />
          Show less
        </template>
        <template v-else>
          <ChevronDown class="mr-1 h-3 w-3" />
          +{{ hiddenCount }} more
        </template>
      </Button>
    </div>
  </div>
</template>
