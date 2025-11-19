<script setup lang="ts">
import {type BaseComponentProps, mapBaseComponentPropsToStyles} from "@/shared/ui/types";
import {computed, useTemplateRef} from "vue";

const props = defineProps<BaseComponentProps>()
const rootRef = useTemplateRef<HTMLElement>('root')

const style = computed(() => {
  return ({
    ...mapBaseComponentPropsToStyles(props),
  })
})

defineExpose({
  el: rootRef,
});

</script>

<script lang="ts">
export default {
  name: "VBox",
}
</script>

<template>
  <component ref="root" :is="$attrs.is ?? 'div'" :style="style" :class="$style.root">
    <slot/>
  </component>
</template>

<style module>
.root {
  box-sizing: border-box;
}
</style>
