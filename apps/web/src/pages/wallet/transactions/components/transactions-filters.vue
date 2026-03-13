<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'
import type { TransactionFilters } from '../composables/use-transaction-filters'
import FilterTypeSelect from './filter-type-select.vue'
import FilterDateRange from './filter-date-range.vue'
import FilterAmountRange from './filter-amount-range.vue'
import FilterCategorySelect from './filter-category-select.vue'
import FilterIncomeSourceSelect from './filter-income-source-select.vue'
import FilterDestinationWallet from './filter-destination-wallet.vue'
import FilterCurrencySelect from './filter-currency-select.vue'

const props = defineProps<{
  walletId: string
  hasActiveFilters: boolean
}>()

const filters = defineModel<TransactionFilters>({ required: true })

defineEmits<{
  reset: []
}>()
</script>

<template>
  <div class="space-y-4 rounded-lg border p-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium">Filters</h3>
      <Button v-if="props.hasActiveFilters" variant="ghost" size="sm" @click="$emit('reset')">
        <X class="mr-1 h-4 w-4" />
        Clear all
      </Button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FilterTypeSelect v-model="filters.type" />
      <FilterDateRange v-model:date-from="filters.dateFrom" v-model:date-to="filters.dateTo" />
      <FilterAmountRange
        v-model:amount-min="filters.amountMin"
        v-model:amount-max="filters.amountMax"
      />
      <FilterCurrencySelect v-model="filters.currencyCode" />
    </div>

    <div
      v-if="filters.type === 'expense' || filters.type === 'income' || filters.type === 'transfer'"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <FilterCategorySelect v-if="filters.type === 'expense'" v-model="filters.categoryId" />
      <FilterIncomeSourceSelect v-if="filters.type === 'income'" v-model="filters.incomeSourceId" />
      <FilterDestinationWallet
        v-if="filters.type === 'transfer'"
        v-model="filters.destinationWalletId"
        :current-wallet-id="props.walletId"
      />
    </div>
  </div>
</template>
