<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import TransactionListItem from './transaction-list-item.vue'
import { Button } from '@/shared/components/ui/button'
import { supabase } from '@/shared/supabase'
import type { Tables } from 'supabase/scheme'

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

    // Deduplicate and take first 5
    const unique = Array.from(
      new Map(
        data
          .map((entry) => entry.transaction)
          .filter((t): t is NonNullable<typeof t> => t !== null)
          .map((transaction) => [transaction.id, transaction])
      ).values()
    )
    return unique.slice(0, 5)
  },
})
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold">Recent Transactions</h2>

    <p v-if="isPending">Loading...</p>
    <p v-else-if="isError">Failed to load transactions</p>
    <template v-else>
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
    </template>
  </section>
</template>
