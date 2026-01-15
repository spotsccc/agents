<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/shared/supabase'
import { ref } from 'vue'
import { Button } from '@/shared/components/ui/button'

const route = useRoute()
const page = ref(1)
const walletId = route.params.id as string

const wallet = useQuery({
  queryKey: ['wallets', { id: walletId }],
  async queryFn() {
    const res = await supabase
      .from('wallets')
      .select(
        `
      id,
      name,
      description,
      balances:wallet_balances (
        id,
        balance,
        currency_code
      )
      `
      )
      .eq('id', route.params.id as string)
      .single()

    if (res.error) {
      throw res.error
    }

    return res.data
  },
})

const transactions = useQuery({
  async queryFn() {
    // Получаем записи транзакций для данного кошелька
    // вместе с полной информацией о каждой транзакции
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
      .eq('wallet_id', walletId)
      .order('transaction(date)', { ascending: false })

    if (error) {
      throw error
    }

    // Удаляем дубликаты транзакций, которые могут возникнуть
    // если одна транзакция имеет несколько entries для данного кошелька
    const uniqueTransactions = Array.from(
      new Map(
        data
          .map((entry) => entry.transaction)
          .filter((t) => t !== null)
          .map((transaction) => [transaction.id, transaction])
      ).values()
    )

    return uniqueTransactions
  },
  queryKey: ['walletTransactions', walletId, page.value],
})
</script>

<template>
  <p v-if="wallet.isPending.value">loading</p>
  <p v-else-if="wallet.isError.value">{{ wallet.error.value }}</p>
  <template v-else>
    <p>Balances</p>
    <div class="flex">
      <div v-for="balance in wallet.data.value!.balances" :key="balance.id">
        {{ balance.balance }} {{ balance.currency_code }}
      </div>
    </div>
    <p v-if="transactions.isPending.value">transactions loading</p>
    <p v-else-if="transactions.isError.value">transactions error</p>
    <div v-else class="flex flex-col gap-2">
      <Button as-child>
        <RouterLink :to="`/wallets/${walletId}/transactions/create`">
          Create new transaction
        </RouterLink>
      </Button>
      {{ transactions.data.value }}
    </div>
  </template>
</template>

<style scoped></style>
