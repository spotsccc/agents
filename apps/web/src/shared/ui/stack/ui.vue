<script setup lang="ts">
import {computed, useTemplateRef} from 'vue'
import {
  type BaseComponentProps, GAP_VAR,
  mapMayBeSizeProperty,
  SPACING_VAR,
} from '../types'
import VBox from "@/shared/ui/box/ui.vue";

const rootRef = useTemplateRef('root')


defineExpose({
  el: computed(() => rootRef.value?.el),
});

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
    gap: mapMayBeSizeProperty(props.gap, GAP_VAR),
  }
})
</script>

<template>
  <VBox ref="root" v-bind="props" :class="$style.root" :style="styles">
    <slot />
  </VBox>
</template>

<style lang="css" module>
.root {
  box-sizing: border-box;
  flex-direction: column;
  display: flex;
}
</style>

<script lang="ts">
export default {
  name: 'VStack',
}
</script>
