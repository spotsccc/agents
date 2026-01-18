<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, ArrowLeftRight, RefreshCcw } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip'
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
} from '@/shared/constants/transaction-types'

const props = defineProps<{ walletId: string }>()

const typeStyles: Record<TransactionType, { icon: typeof TrendingUp; className: string }> = {
  income: {
    icon: TrendingUp,
    className:
      'text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200 bg-emerald-50',
  },
  expense: {
    icon: TrendingDown,
    className: 'text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 bg-red-50',
  },
  transfer: {
    icon: ArrowLeftRight,
    className: 'text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200 bg-blue-50',
  },
  exchange: {
    icon: RefreshCcw,
    className:
      'text-violet-600 hover:bg-violet-100 hover:text-violet-700 border-violet-200 bg-violet-50',
  },
}

const transactionTypes = computed(() =>
  TRANSACTION_TYPES.map((type) => ({
    id: type,
    label: TRANSACTION_TYPE_LABELS[type],
    ...typeStyles[type],
  }))
)

function getHref(type: TransactionType): string {
  return `/wallets/${props.walletId}/transactions/create?type=${type}`
}
</script>

<template>
  <section v-if="walletId">
    <h2 class="mb-2 text-xs font-medium text-muted-foreground">Quick Actions</h2>
    <div class="flex gap-2">
      <TooltipProvider>
        <Tooltip v-for="type in transactionTypes" :key="type.id">
          <TooltipTrigger as-child>
            <Button
              as-child
              variant="outline"
              size="icon"
              :class="['h-9 w-9 rounded-full', type.className]"
            >
              <RouterLink :to="getHref(type.id)" :data-transaction-type="type.id">
                <component :is="type.icon" class="h-4 w-4" aria-hidden="true" />
                <span class="sr-only">{{ type.label }}</span>
              </RouterLink>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{{ type.label }}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </section>
</template>
