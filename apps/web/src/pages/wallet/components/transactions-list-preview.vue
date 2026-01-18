<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import {
  TransactionListItem,
  TransactionListItemSkeleton,
} from '@/components/transaction-list-item'
import { Button } from '@/shared/components/ui/button'
import { supabase } from '@/shared/supabase'
import type { Tables } from 'supabase/scheme'

const PREVIEW_LIMIT = 5

type TransactionEntry = Pick<
  Tables<'transaction_entries'>,
  | 'id'
  | 'wallet_id'
  | 'currency_code'
  | 'amount'
  | 'balance_after'
  | 'category_id'
  | 'source_id'
  | 'notes'
  | 'created_at'
>

type TransactionPreview = Pick<
  Tables<'transactions'>,
  'id' | 'type' | 'description' | 'date' | 'created_at'
> & {
  entries: TransactionEntry[]
}

const props = defineProps<{
  walletId: string
}>()

const {
  data: transactions,
  isPending,
  isError,
} = useQuery({
  queryKey: ['walletTransactionsPreview', props.walletId],
  async queryFn(): Promise<TransactionPreview[]> {
    const { data, error } = await supabase
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
      .eq('wallet_id', props.walletId)
      .order('transaction(date)', { ascending: false })
      .limit(10)

    if (error) throw error

    // Deduplicate and limit to preview count
    const unique = Array.from(
      new Map(
        data
          .map((entry) => entry.transaction)
          .filter((t): t is NonNullable<typeof t> => t !== null)
          .map((transaction) => [transaction.id, transaction])
      ).values()
    )
    return unique.slice(0, PREVIEW_LIMIT)
  },
})
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold">Recent Transactions</h2>

    <Transition name="fade" mode="out-in">
      <ul v-if="isPending" key="skeleton" role="list" aria-label="Loading transactions">
        <TransactionListItemSkeleton v-for="i in PREVIEW_LIMIT" :key="i" />
      </ul>
      <p v-else-if="isError" key="error">Failed to load transactions</p>
      <div v-else key="content">
        <ul v-if="transactions && transactions.length > 0" role="list">
          <TransactionListItem
            v-for="transaction in transactions"
            :key="transaction.id"
            :transaction="transaction"
          />
        </ul>
        <p v-else>No transactions yet</p>

        <Button as-child variant="outline" class="mt-4">
          <RouterLink :to="`/wallets/${walletId}/transactions`"> View all transactions </RouterLink>
        </Button>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
