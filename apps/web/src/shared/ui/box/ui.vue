<script setup lang="ts">
import {type BaseComponentProps, mapBaseComponentPropsToStyles} from "@/shared/ui/types";
import {computed} from "vue";

const props = defineProps<BaseComponentProps>()

const style = computed(() => {
  return ({
    ...mapBaseComponentPropsToStyles(props),
  })
})

</script>

<script lang="ts">
export default {
  name: "VBox",
}
</script>

<template>
  <component :is="$attrs.is ?? 'div'" :style="style" :class="$style.root">
    <slot/>
  </component>
</template>

<style module>
.root {
  box-sizing: border-box;
}
</style>
