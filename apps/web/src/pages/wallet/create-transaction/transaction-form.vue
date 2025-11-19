<script setup lang="ts">
import {Input} from "@/shared/components/ui/input";
import {Button} from "@/shared/components/ui/button";
import CurrencySelect from "@/pages/wallet/currency-select.vue";
import KindSelect from "@/pages/wallet/kind-select.vue";
import {useProvideTransactionForm} from "@/pages/wallet/use-transaction-form.ts";
import ToCurrencySelect from "@/pages/wallet/to-currency-select.vue";
import ToWallet from "@/pages/wallet/to-wallet.vue";
import CategorySelect from "@/pages/wallet/category-select.vue";

const {walletId} = defineProps<{ walletId: string }>()

const {form, onSubmit} = useProvideTransactionForm(walletId)

const [amount] = form.defineField('amount')
const [kind] = form.defineField('kind')
const [to_amount] = form.defineField('to_amount')

</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-2">
    <KindSelect/>
    <ToWallet v-if="kind === 'transfer'"/>
    <CurrencySelect/>
    <Input label="Amount" :error="form.errors.value.amount" id="amount" type="number"
           v-model="amount"/>
    <CategorySelect />
    <Input v-if="kind === 'transfer' || kind === 'exchange'" label="To amount"
           :error="form.errors.value.to_amount" id="to_amount" type="number"
           v-model="to_amount"/>
    <ToCurrencySelect v-if="kind === 'transfer' || kind === 'exchange'"/>
    <Button type="submit" class="w-full">Create</Button>
  </form>
</template>
