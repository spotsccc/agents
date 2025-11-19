<script setup lang="ts">
import {useQuery} from "@tanstack/vue-query";
import {supabase} from "@/shared/supabase";
import VSelect from "@/shared/components/ui/select/v-select.vue";
import {computed} from "vue";
import {useTransactionForm} from "@/pages/wallet/create-transaction/use-transaction-form.ts";

const {form} = useTransactionForm()!

const [currency] = form.defineField('to_currency')

const currenciesQuery = useQuery({
  queryKey: ['currencies'],
  async queryFn() {
    const res = await supabase.from('currencies').select();

    if (res.error) {
      throw res.error;
    }

    return res.data;
  }
})

const items = computed(() => {
  return currenciesQuery.data.value?.map(currency => ({
    id: currency.code,
    label: currency.code,
  })) ?? []
})

</script>

<template>
  <VSelect
    id="to_currency"
    :items
    label="To currency"
    :loading="currenciesQuery.isPending.value"
    :error="form.errors.value.to_currency"
    v-model="currency"
  />
</template>
