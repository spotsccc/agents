<script setup lang="ts">
import {useRoute} from "vue-router";
import {useQuery} from "@tanstack/vue-query";
import {supabase} from "@/shared/supabase";
import VText from "@/shared/ui/text/ui.vue";
import {ref} from "vue";
import TransactionRow from "@/pages/wallet/transaction-row.vue";
import {Button} from "@/shared/components/ui/button";

const route = useRoute();
const page = ref(1);
const pageSize = 10;
const walletId = route.params.id as string;

const wallet = useQuery({
  queryKey: ["wallets", {id: walletId}],
  async queryFn() {
    const res = await supabase.from("wallets")
      .select(`
      id,
      name,
      description,
      balances:wallet_balances (
        id,
        balance,
        currency_code
      )
      `)
      .eq("id", route.params.id as string)
      .single();

    if (res.error) {
      throw res.error;
    }

    return res.data;
  }
});

const transactions = useQuery({
    async queryFn() {
      const from = (page.value - 1) * pageSize
      const to = from + pageSize - 1

      const {data, error} = await supabase
        .from('transactions')
        .select(`
        id,
        kind,
        description,
        occured_at,
        metadata,
        entries:transaction_entries (
          id,
          wallet_id,
          currency_code,
          amount
        ),
        category:categories (
          id,
          name,
          type
        )
      `)
        .eq('transaction_entries.wallet_id', walletId)
        .order('occured_at', {ascending: false})
        .range(from, to)

      if (error) throw error

      const totalCount = await supabase
        .from('transaction_entries')
        .select('id', {count: 'exact', head: true})
        .eq('wallet_id', walletId)

      return {
        transactions: data,
        hasMore: data.length + from < (totalCount.count ?? 0),
      }
    },
    queryKey: ['walletTransactions', walletId, page.value],
  }
)
</script>

<template>
  <VText v-if="wallet.isPending.value">loading</VText>
  <VText v-else-if="wallet.isError.value">{{ wallet.error.value }}</VText>
  <template v-else>
    <VText>Balances</VText>
    <div class="flex">
      <div v-for="balance in wallet.data.value!.balances" :key="balance.id">
        {{ balance.balance }} {{ balance.currency_code }}
      </div>
    </div>
    <VText v-if="transactions.isPending.value">transactions loading</VText>
    <VText v-else-if="transactions.isError.value">transactions error</VText>
    <div v-else class="flex flex-col gap-2">
      <Button as-child>
        <RouterLink :to="`/wallets/${walletId}/transactions/create`">
          Create new transaction
        </RouterLink>
      </Button>
      <TransactionRow
        v-for="transaction in transactions.data.value?.transactions"
        :transaction="transaction"
        :key="transaction.id"
      />
    </div>
  </template>
</template>

<style scoped>

</style>
