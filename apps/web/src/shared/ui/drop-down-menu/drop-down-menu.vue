<script setup lang="ts">
import VBox from "@/shared/ui/box/ui.vue";
import {onBeforeUnmount, onMounted, ref, useTemplateRef} from "vue";
import VStack from "@/shared/ui/stack/ui.vue";
import {useElementBounding} from '@vueuse/core'

const triggerRef = useTemplateRef('trigger')
const menuRef = useTemplateRef('menu')
const opened = ref(false);

const triggerBounding = useElementBounding(triggerRef);

function close() {
  opened.value = false;
}

function toggle() {
  opened.value = !opened.value;
}

function handleClickOutside(e: MouseEvent) {
  if (!menuRef.value?.el?.contains(e.target as Node) && !triggerRef.value?.el?.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

</script>

<template>
  <VBox ref="trigger">
    <slot name="trigger" :click="toggle"></slot>
  </VBox>

  <Teleport to="body">
    <VStack
      ref="menu"
      :style="{
        top: triggerBounding.bottom.value + 'px',
        left: triggerBounding.left.value + 'px',
        minWidth: triggerBounding.width.value + 'px',
        zIndex: 1000,
      }"
      :class="$style.menu"
      v-if="opened"
    >
      <slot name="menu" :close="close"></slot>
    </VStack>
  </Teleport>
</template>

<style module>
.menu {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
