<script setup lang="ts">
import {
  type CreateIncomeTransactionRequest,
  CREATE_INCOME_TRANSACTION,
} from "supabase/create-income-transaction";
import { Input } from "@/shared/components/ui/input";
import VSelect from "@/shared/components/ui/select/v-select.vue";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { supabase } from "@/shared/supabase";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import { useUser } from "@/shared/auth/use-user";
import Button from "@/shared/components/ui/button/Button.vue";

const { walletId } = defineProps<{ walletId: string }>();

const { user } = useUser();

const scheme = z.object({
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  type: z.enum(["income", "expense", "transfer", "exchange"]),
  category: z.string().optional(),
});

const form = useForm({
  validationSchema: toTypedSchema(scheme),
  initialValues: {
    amount: 0,
    currency: "USD",
    description: "",
    type: "expense",
  },
});

const [amount] = form.defineField("amount");
const [type] = form.defineField("type");
// const [to_amount] = form.defineField("to_amount");
// const [to_wallet] = form.defineField("to_wallet");
const [currency] = form.defineField("currency");
// const [to_currency] = form.defineField("to_currency");
const [category] = form.defineField("category");

// const wallets = useQuery({
//   queryKey: ["wallets"],
//   async queryFn() {
//     const res = await supabase.from("wallets").select().neq("id", walletId);

//     if (res.error) {
//       throw res.error;
//     }

//     return res.data;
//   },
// });

// const walletItems = computed(() => {
//   return wallets.data.value?.map((wallet) => ({ id: wallet.id, label: wallet.name })) ?? [];
// });

const currenciesQuery = useQuery({
  queryKey: ["currencies"],
  async queryFn() {
    const res = await supabase.from("currencies").select();

    if (res.error) {
      throw res.error;
    }

    return res.data;
  },
});

const currencyItems = computed(() => {
  return (
    currenciesQuery.data.value?.map((currency) => ({
      id: currency.code,
      label: currency.code,
    })) ?? []
  );
});

const categories = useQuery({
  queryKey: ["categories"],
  async queryFn() {
    const res = await supabase.from("categories").select();

    if (res.error) {
      throw res.error;
    }

    return res.data;
  },
});

const categoryItems = computed(() => {
  return (
    categories.data.value?.map((category) => ({ id: category.id, label: category.name })) ?? []
  );
});

const createIncomeTransactionMutation = useMutation({
  mutationFn: async (params: CreateIncomeTransactionRequest) => {
    const { data, error } = await supabase.functions.invoke(CREATE_INCOME_TRANSACTION, {
      body: params,
    });
    if (error) {
      throw error;
    }
    return data;
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  debugger;
  await createIncomeTransactionMutation.mutateAsync({
    userId: user.value!.id,
    walletId,
    sourceId: "84b09fe9-68ae-4d37-8a41-dfc069779d85",
    amount: values.amount,
    currency: values.currency,
    description: values.description,
  });
});
</script>

<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-2">
    <VSelect
      id="type"
      v-model="type"
      :items="[
        { id: 'expense', label: 'Expense' },
        { id: 'income', label: 'Income' },
        // Пока не реализовано
        // { id: 'transfer', label: 'Transfer' },
        // { id: 'exchange', label: 'Exchange' },
      ]"
      label="Transaction type"
    />
    <!-- <VSelect
      v-if="type === 'transfer'"
      id="to_wallet"
      :items="walletItems"
      :loading="wallets.isPending.value"
      v-model="to_wallet"
      :error="form.errors.value.to_wallet"
      label="To wallet"
    /> -->
    <VSelect
      id="currency"
      :items="currencyItems"
      label="Currency"
      :loading="currenciesQuery.isPending.value"
      :error="form.errors.value.currency"
      v-model="currency"
    />
    <Input
      label="Amount"
      :error="form.errors.value.amount"
      id="amount"
      type="number"
      v-model="amount"
    />
    <VSelect
      v-if="type === 'expense'"
      :items="categoryItems"
      v-model="category"
      label="Category"
      :error="form.errors.value.category"
      :loading="categories.isPending.value"
      id="category"
    />
    <!-- <Input
      v-if="type === 'transfer' || type === 'exchange'"
      label="To amount"
      :error="form.errors.value.to_amount"
      id="to_amount"
      type="number"
      v-model="to_amount"
    /> -->
    <!-- <VSelect
      v-if="type === 'transfer' || type === 'exchange'"
      id="to_currency"
      :items="currencyItems"
      label="To currency"
      :loading="currenciesQuery.isPending.value"
      :error="form.errors.value.to_currency"
      v-model="to_currency"
    /> -->
    <Button type="submit" class="w-full">Create</Button>
  </form>
</template>
