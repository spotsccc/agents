<script setup lang="ts">
import {VStack} from "@/shared/ui/stack";
import {VText} from "@/shared/ui/text";
import AuthLayout from "@/shared/layouts/auth/auth-layout.vue";
import {useQuery} from "@tanstack/vue-query";
import {supabase} from "@/shared/supabase";
import PageLoading from "@/pages/inbox/page-loading.vue";
import PageError from "@/pages/inbox/page-error.vue";
import TaskRow from "@/pages/inbox/task-row.vue";
import CreateNewTask from "@/pages/inbox/create-new-task.vue";
import {ref} from "vue";

const createNewTaskFormOpened = ref(false);

const inboxQuery = useQuery({
  queryKey: ['tasks', {project_id: null}],
  async queryFn() {
    const res = await supabase.from('tasks').select('*').is('project_id', null);
    if (res.error) {
      throw res.error;
    }
    return res.data;
  }
})

</script>

<template>
  <VText>
    Inbox
  </VText>
  <PageLoading v-if="inboxQuery.status.value === 'pending'"/>
  <PageError v-else-if="inboxQuery.status.value === 'error'"/>
  <VStack v-else gap="sm">
    <TaskRow v-for="task in inboxQuery.data.value" :key="task.id" :task="task"/>
  </VStack>
  <Button v-if="!createNewTaskFormOpened" @click="createNewTaskFormOpened = true">Create new task
  </Button>
  <CreateNewTask @cancelClick="createNewTaskFormOpened = false" v-else/>
</template>
