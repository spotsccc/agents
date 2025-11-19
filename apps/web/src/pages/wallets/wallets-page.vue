<script setup lang="ts">
import VText from "@/shared/ui/text/ui.vue";
import {useQuery} from '@tanstack/vue-query'
import {supabase} from "@/shared/supabase";
import WalletForm from "@/pages/wallets/wallet-form.vue";
import WalletRow from "@/pages/wallets/wallet-row.vue";

const walletsQuery = useQuery({
  queryKey: ['wallets'],
  queryFn: async () => {
    const res = await supabase.from('wallets').select(
      `
      id,
      name,
      description,
      created_at,
      updated_at,
      deleted_at,
      metadata,
      primary_currency,
      settings,
      type,
      user_id,
      balances:wallet_balances (
        id,
        balance,
        currency_code
      )
      `
    );
    if (res.error) {
      throw res.error;
    }
    return res.data;
  }
})

</script>

<template>
  <VText>Wallets</VText>
  <div class="flex flex-col">
    <VText v-if="walletsQuery.isPending.value">Loading</VText>
    <VText v-else-if="walletsQuery.isError.value">Error</VText>
    <div v-else>
      <WalletRow v-for="wallet in walletsQuery.data.value" :key="wallet.id" :wallet="wallet"/>
      <WalletForm/>
    </div>
  </div>
</template>
