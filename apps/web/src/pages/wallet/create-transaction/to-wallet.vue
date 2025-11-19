<script setup lang="ts">
import VSelect from "@/shared/components/ui/select/v-select.vue";
import {useTransactionForm} from "@/pages/wallet/create-transaction/use-transaction-form.ts";
import {useQuery} from "@tanstack/vue-query";
import {supabase} from "@/shared/supabase";
import {computed} from "vue";

const {form, walletId} = useTransactionForm()!

const [toWallet] = form.defineField('to_wallet');

const wallets = useQuery({
  queryKey: ['wallets'],
  async queryFn() {
    const res = await supabase.from('wallets').select().neq("id", walletId);

    if (res.error) {
      throw res.error;
    }

    return res.data;
  }
})

const items = computed(() => wallets.data.value?.map(wallet => ({
  id: wallet.id,
  label: wallet.name
})) ?? []);

</script>

<template>
  <VSelect
    id="to_wallet"
    :items
    :loading="wallets.isPending.value"
    v-model="toWallet"
    :error="form.errors.value.to_wallet"
    label="To wallet"
  />
</template>

<style scoped>

</style>
