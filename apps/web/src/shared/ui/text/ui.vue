<script lang="ts" setup>
import VBox from "@/shared/ui/box/ui.vue";
import {type BaseComponentProps, getTextStyles, type TextProps} from "@/shared/ui/types";
const props = defineProps<BaseComponentProps & TextProps>();


const textStyles = getTextStyles(props);
</script>

<script lang="ts">
export default {
  name: 'VText'
}
</script>

<template>
  <VBox :is="$attrs.is ?? 'p'" :style="textStyles" :class="$style.root">
    <slot/>
  </VBox>
</template>

<style module>
.root {
  margin: 0;
}
</style>
