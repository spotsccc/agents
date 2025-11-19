<script setup lang="ts">
import {computed, ref} from "vue";

import {VStack} from "@/shared/ui/stack";
import {VGroup} from "@/shared/ui/group";

import {Temporal} from "temporal-polyfill";
import CalendarDay from "@/pages/calendar/calendar-day.vue";
import CalendarWeek from "@/pages/calendar/calendar-week.vue";

const month = ref(Temporal.Now.zonedDateTimeISO());
const weeks = computed(() => {
  const startOfMonth = month.value.with({day: 1});
  const endOfMonth = startOfMonth.with({day: month.value.daysInMonth});
  const lastWeekLastDay = endOfMonth.add({days: 7 - endOfMonth.dayOfWeek});

  let start = startOfMonth;
  let weeks = []

  while (start.epochMilliseconds <= lastWeekLastDay.epochMilliseconds) {
    weeks.push(createWeek(start));
    start = weeks.at(-1)!.at(-1)!.add({days: 1});
  }
  console.log(weeks)
   return weeks
});

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

</script>

<template>
  <CalendarWeek :date="month"/>
</template>

<script lang="ts">
export default {
  name: "CalendarPage",
}
</script>
