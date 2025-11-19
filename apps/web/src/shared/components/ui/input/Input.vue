<script setup lang="ts">
import type {HTMLAttributes} from "vue"
import {useVModel} from "@vueuse/core"
import {cn} from '@/shared/lib/utils'
import {VText} from "@/shared/ui/text";
import {VStack} from "@/shared/ui/stack";

const props = defineProps<{
  id: string;
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
  classes?: {
    root?: string;
    label?: string;
    description?: string;
    error?: string;
  }
  label?: string;
  description?: string;
  error?: string;
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <VStack :class="[classes?.root, $style.root]" w="100%" gap="xs">

    <VText size="sm" is="label" :class="[$style.label, classes?.label]" v-if="label" :for="id">
      {{ label }}
    </VText>
    <VText size="xs" :class="classes?.description" v-if="description">{{ description }}</VText>
    <input
      :id
      v-bind="$attrs"
      v-model="modelValue"
      data-slot="input"
      :class="cn(
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      props.class,
    )"
    >
    <VText
      v-if="error"
      size="xs"
      :class="classes?.error"
    >
      {{ error }}
    </VText>
  </VStack>
</template>

<style module>
.root {
}

.label {
  text-align: left;
}
</style>
