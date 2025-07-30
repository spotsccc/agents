<script setup lang="ts">
import { computed } from 'vue'
import {
  type BaseComponentProps,
  mapMayBeSizeProperty,
  SPACING_VAR,
} from '../types'
import VBox from "@/shared/ui/box/ui.vue";

const props = defineProps<
  {
    gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    justify?: 'flex-start' | 'flex-end' | 'space-between' | 'space-around' | 'center'
    align?: 'scratch' | 'center' | 'flex-start' | 'flex-end'
  } & BaseComponentProps
>()

const styles = computed(() => {
  return {
    justifyContent: props.justify ?? 'flex-start',
    alignItems: props.align ?? 'scratch',
    gap: mapMayBeSizeProperty(props.gap, SPACING_VAR),
  }
})
</script>

<template>
  <VBox v-bind="props" :class="$style.root" :style="styles">
    <slot />
  </VBox>
</template>

<style lang="css" module>
.root {
  display: flex;
}
</style>

<script lang="ts">
export default {
  name: 'VStack',
}
</script>
