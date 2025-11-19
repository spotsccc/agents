<script setup lang="ts">
import {Temporal} from "temporal-polyfill";
import {VGroup} from "@/shared/ui/group";
import {computed} from "vue";
import VStack from "@/shared/ui/stack/ui.vue";
import VBox from "@/shared/ui/box/ui.vue";
import DayTimeline from "@/pages/calendar/day-timeline.vue";
const props = defineProps<{
  date: Temporal.ZonedDateTime
}>()

function createWeek(day: Temporal.ZonedDateTime) {
  let firstDay = day;
  if (day.dayOfWeek !== 1) {
    firstDay = day.add({days: 1 - day.dayOfWeek});
  }

  const week = [];
  for (let i = 0; i < 7; i++) {
    week.push(firstDay.add({days: i}));
  }
  return week;
}

const week = computed(() => {
  return createWeek(props.date)
})

const hours: Array<number> = [];
for (let i = 0; i < 24; i++) {
  hours.push(i)
}

const formatter = Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
})

</script>

<template>
  <VGroup>
    <VStack>
      <VBox :class="$style.hour"/>
      <VBox v-for="hour in hours" :key="hour" :class="$style.hour">{{ hour }}</VBox>
    </VStack>
    <VStack w="100%">
      <VGroup>
        <VStack v-for="day in week" :key="day.toString()" w="100%">
          <VBox h="100%">{{formatter.format(new Date(day.epochMilliseconds))}}</VBox>
        </VStack>
      </VGroup>
      <VGroup>
        <VStack v-for="day in week" :key="day.toString()" w="100%">
          <DayTimeline :date="day"/>
        </VStack>
      </VGroup>
    </VStack>
  </VGroup>
</template>

<style module>
.hour {
  height: 40px;
}
</style>
