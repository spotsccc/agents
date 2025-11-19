<script setup lang="ts">
import {useTransactionForm} from "@/pages/wallet/use-transaction-form.ts";
import VSelect from "@/shared/components/ui/select/v-select.vue";

const { form } = useTransactionForm()!

const items = [{
  id: 'expense',
  label: 'expense',
}, {
  id: 'transfer',
  label: 'transfer',
},
  {
    id: 'exchange',
    label: 'exchange',
  },
  {
    id: 'income',
    label: 'income',
  }]

const [kind] = form.defineField('kind')

</script>

<template>
    <VSelect
      id="kind"
      :items
      label="Kind"
      :error="form.errors.value.kind"
      v-model="kind"
    />
</template>

<style scoped>

</style>
