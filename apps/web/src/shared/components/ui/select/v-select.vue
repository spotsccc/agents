<script setup lang="ts">
import type {Item} from "./type.ts";
import Select from "@/shared/components/ui/select/Select.vue";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/shared/components/ui/select/index.ts";
import SelectLabel from "@/shared/components/ui/select/SelectLabel.vue";

const {loading = false, disabled = false, placeholder = "Select"} = defineProps<{
  items: Array<Item>;
  label?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}>();

const model = defineModel<string>()

</script>

<template>
  <Select v-model="model" :disabled>
    <p>{{ label }}</p>
    <SelectTrigger class="w-full">
      <SelectValue :placeholder/>
    </SelectTrigger>
    <SelectContent v-if="!loading">
      <SelectItem
        v-for="currency in items"
        :key="currency.id"
        :value="currency.id"
      >
        {{ currency.label }}
      </SelectItem>
      <SelectLabel v-if="items.length === 0">
        Not found
      </SelectLabel>
    </SelectContent>
    <SelectContent v-else>
      loading
    </SelectContent>
    <p>{{ error }}</p>
  </Select>
</template>

<style scoped>

</style>
