<script setup lang="ts">
import VSelect from "@/shared/components/ui/select/v-select.vue";
import {useTransactionForm} from "@/pages/wallet/create-transaction/use-transaction-form.ts";
import {useQuery} from "@tanstack/vue-query";
import {supabase} from "@/shared/supabase";
import {computed} from "vue";

const {form} = useTransactionForm()!

const [category] = form.defineField('category')

const categories = useQuery({
  queryKey: ['categories'],
  async queryFn() {
    const res = await supabase.from('categories').select();

    if (res.error) {
      throw res.error;
    }

    return res.data;
  }
})

const items = computed(() => {
  return categories.data.value?.map(category => ({id: category.id, label: category.name})) ?? []
})
</script>

<template>
  <VSelect
    :items
    v-model="category"
    label="Category"
    :error="form.errors.value.category"
    :loading="categories.isPending.value"
    id="category"
  />
</template>

<style scoped>

</style>
