<script setup lang="ts">
import {Temporal} from "temporal-polyfill";

defineProps<{
  date: Temporal.ZonedDateTime
}>()

const formatter = Intl.DateTimeFormat('ru-RU', {
   weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

</script>

<template>
  <div>
    {{formatter.format(new Date(date.epochMilliseconds))}}
  </div>
</template>
