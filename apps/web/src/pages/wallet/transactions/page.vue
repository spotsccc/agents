<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/shared/components/ui/button'
import { supabase } from '@/shared/supabase'
import {
  useTransactionFilters,
  type TransactionFilters,
} from './composables/use-transaction-filters'
import TransactionsFilters from './components/transactions-filters.vue'
import TransactionsVirtualList from './components/transactions-virtual-list.vue'
import type { Transaction } from './types'

const PAGE_SIZE = 20

const route = useRoute()
const walletId = computed(() => route.params.id as string)
// todo хуйня с фильтрацией
const { filters, hasActiveFilters, resetFilters } = useTransactionFilters()

function buildQuery(pageParam: number, filters: TransactionFilters) {
  let query = supabase
    .from('transaction_entries')
    .select(
      `
      transaction_id,
      transaction:transactions (
        id,
        type,
        description,
        date,
        created_at,
        entries:transaction_entries (
          id,
          wallet_id,
          currency_code,
          amount,
          balance_after,
          category_id,
          source_id,
          notes,
          created_at
        )
      )
    `
    )
    .eq('wallet_id', walletId.value)
    .order('transaction(date)', { ascending: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

  // Apply filters
  if (filters.currencyCode) {
    query = query.eq('currency_code', filters.currencyCode)
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.incomeSourceId) {
    query = query.eq('source_id', filters.incomeSourceId)
  }

  return query
}

interface PageResult {
  transactions: Transaction[]
  rawCount: number
}

const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } =
  useInfiniteQuery({
    queryKey: ['walletTransactions', walletId, filters],
    queryFn: async ({ pageParam }): Promise<PageResult> => {
      const query = buildQuery(pageParam, filters.value)
      const { data, error } = await query

      if (error) throw error

      // Store raw count before filtering for pagination
      const rawCount = data.length

      // Filter by transaction type if specified
      let filteredData = data
      if (filters.value.type) {
        filteredData = data.filter((entry) => entry.transaction?.type === filters.value.type)
      }

      // Filter by date range on transactions
      if (filters.value.dateFrom || filters.value.dateTo) {
        filteredData = filteredData.filter((entry) => {
          const date = entry.transaction?.date
          if (!date) return false
          if (filters.value.dateFrom && date < filters.value.dateFrom) return false
          if (filters.value.dateTo && date > filters.value.dateTo) return false
          return true
        })
      }

      // Filter by amount range
      if (filters.value.amountMin !== null || filters.value.amountMax !== null) {
        filteredData = filteredData.filter((entry) => {
          const entries = entry.transaction?.entries ?? []
          const walletEntry = entries.find((e) => e.wallet_id === walletId.value)
          if (!walletEntry) return false
          const amount = Math.abs(walletEntry.amount)
          if (filters.value.amountMin !== null && amount < filters.value.amountMin) return false
          if (filters.value.amountMax !== null && amount > filters.value.amountMax) return false
          return true
        })
      }

      // Filter by destination wallet (for transfers)
      if (filters.value.destinationWalletId) {
        filteredData = filteredData.filter((entry) => {
          const entries = entry.transaction?.entries ?? []
          return entries.some(
            (e) =>
              e.wallet_id === filters.value.destinationWalletId && e.wallet_id !== walletId.value
          )
        })
      }

      // Deduplicate transactions
      const unique = Array.from(
        new Map(
          filteredData
            .map((entry) => entry.transaction)
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .map((transaction) => [transaction.id, transaction])
        ).values()
      )

      return {
        transactions: unique as Transaction[],
        rawCount,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // Use raw count to determine if there are more pages
      return lastPage.rawCount === PAGE_SIZE ? lastPageParam + 1 : undefined
    },
  })

const transactions = computed<Transaction[]>(() => {
  if (!data.value) return []
  return data.value.pages.flatMap((page) => page.transactions)
})

function handleLoadMore() {
  if (hasNextPage.value && !isFetchingNextPage.value) {
    fetchNextPage()
  }
}
</script>

<template>
  <div class="container mx-auto max-w-4xl space-y-6 py-6">
    <div class="flex items-center gap-4">
      <Button as-child variant="ghost" size="icon">
        <RouterLink :to="`/wallets/${walletId}`" aria-label="Back to wallet">
          <ArrowLeft class="h-5 w-5" />
        </RouterLink>
      </Button>
      <h1 class="text-2xl font-bold">Transactions</h1>
    </div>

    <TransactionsFilters
      v-model="filters"
      :wallet-id="walletId"
      :has-active-filters="hasActiveFilters"
      @reset="resetFilters"
    />

    <TransactionsVirtualList
      :transactions="transactions"
      :is-loading="isPending"
      :is-error="isError"
      :is-fetching-next-page="isFetchingNextPage"
      :has-next-page="hasNextPage ?? false"
      :filters="filters"
      @load-more="handleLoadMore"
    />
  </div>
</template>
