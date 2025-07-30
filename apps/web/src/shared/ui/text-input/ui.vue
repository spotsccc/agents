<script setup lang="ts">
import {VBox} from "@/shared/ui/box";
import type {InputHTMLAttributes} from "vue";
import {Ui as VStack} from "@/shared/ui/stack";
import VText from "@/shared/ui/text/ui.vue";

const model = defineModel<string>();

const id = crypto.randomUUID();
const props = defineProps<{
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
    <input v-bind="$attrs" :id v-model="model"/>
    <VText size="xs" :class="classes?.error">{{ error }}</VText>
  </VStack>
</template>

<style module>
.root {
}

.label {
  text-align: left;
}
</style>


