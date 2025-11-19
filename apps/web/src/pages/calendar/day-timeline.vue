<script setup lang="ts">
import {Temporal} from "temporal-polyfill";
import VStack from "@/shared/ui/stack/ui.vue";
import VBox from "@/shared/ui/box/ui.vue";

const props = defineProps<{
  date: Temporal.ZonedDateTime
}>()

const hours: Array<number> = [];
for (let i = 0; i < 24; i++) {
  hours.push(i)
}


</script>

<template>
  <VStack :class="$style.day">
    <VBox :class="$style.hour" v-for="hour in hours" :key="hour">
    </VBox>
  </VStack>
</template>

<style module>
.day {
  border-left: 1px solid black;
}

.hour {
  height: 40px;
  border-top: 1px solid black;

  &:last-child {
    border-bottom: 1px solid black;
  }
}
</style>
