<script setup lang="ts">
import { computed } from 'vue'
import {VStack} from "@/shared/ui/stack";
import {VText} from "@/shared/ui/text";
import type { FormField } from "@/shared/forms";

const model = defineModel<string>();

const id = crypto.randomUUID();

const props = defineProps<{
  // FormField integration - when provided, individual props are ignored
  field?: FormField<string>
  // Individual props for backward compatibility
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

// Computed properties that work with either field or individual props
const computedValue = computed({
  get: (): string => {
    if (props.field) {
      return props.field.modelValue.value
    }
    return model.value || ''
  },
  set: (value: string): void => {
    if (props.field) {
      props.field.modelValue.value = value
    } else {
      model.value = value
    }
  }
})

const computedError = computed((): string | undefined => {
  if (props.field) {
    return props.field.error.value
  }
  return props.error
})

const inputHandlers = computed(() => {
  if (props.field) {
    return {
      onInput: props.field.onInput,
      onBlur: props.field.onBlur
    }
  }
  return {}
})
</script>

<script lang="ts">
export default {
  name: "TextInput",
}
</script>

<template>
  <VStack :class="[classes?.root, $style.root]" w="100%" gap="xs">
    <VText size="sm" is="label" :class="[classes?.label, $style.label]" v-if="label" :for="id">{{ label }}</VText>
    <VText size="xs" :class="classes?.description" v-if="description">{{ description }}</VText>
    <input 
      v-bind="{ ...$attrs, ...inputHandlers }" 
      :id="id"
      v-model="computedValue"
    />
    <VText 
      v-if="computedError" 
      size="xs" 
      :class="classes?.error"
    >
      {{ computedError }}
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


