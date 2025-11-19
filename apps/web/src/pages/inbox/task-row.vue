<script setup lang="ts">
import type {Task} from "@/shared/supabase/tasks.ts";
import VGroup from "@/shared/ui/group/ui.vue";
import {VText} from "@/shared/ui/text";
import {ref} from "vue";
import VStack from "@/shared/ui/stack/ui.vue";
import VBox from "@/shared/ui/box/ui.vue";
import TextInput from "@/shared/ui/text-input/ui.vue";

const props = defineProps<{ task: Task }>()

const taskModalOpened = ref(false);

const titleDraft = ref(props.task.title)

</script>

<template>
  <VStack>
    <VGroup @click="taskModalOpened = true">
      <input @click.prevent type="checkbox"/>
      <VText>{{ task.title }}</VText>
    </VGroup>
    <VText>{{ task.description }}</VText>
  </VStack>

  <Teleport to="body">
    <VBox v-if="taskModalOpened" :class="$style['modal-wrapper']">
      <VStack w="50%" h="50%" :class="$style.modal">
        <TextInput/>
      </VStack>
    </VBox>
  </Teleport>
</template>

<style module>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
}

.modal {
  background: white;
  border-radius: 8px;
}
</style>
