<script setup lang="ts">

import VBox from "@/shared/ui/box/ui.vue";
</script>

<script lang="ts">
export default {
  name: "VButton",
}
</script>

<template>
  <VBox :is="$attrs.is ?? 'button'">
    <slot/>
  </VBox>
</template>

<style scoped>

</style>
