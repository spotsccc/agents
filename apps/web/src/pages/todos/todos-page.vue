<script setup lang="ts">
import {VStack} from "@/shared/ui/stack";
import {VText} from "@/shared/ui/text";
import {VButton} from "@/shared/ui/button";
import {supabase} from "@/shared/supabase";
import {VBox} from "@/shared/ui/box";
import {RouterLink} from "vue-router";
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";

const queryClient = useQueryClient();

const query = useQuery({
  queryKey: ['todo_lists'],
  retry: false,
  queryFn: async () => {
    const res = await supabase.from('todo_lists').select();
    if (res.error) {
      throw res.error;
    }
    return res.data;
  }
})

async function createTodoList(title = "Untitled") {
  const res = await supabase.from('todo_lists').insert({
    title,
  })

  if (res.error) {
    throw res.error;
  }

  return res;
}

const mutation = useMutation({
  mutationFn: createTodoList,
  onSuccess: () => queryClient.invalidateQueries({queryKey: ['todo_lists']}),
  onError: (error) => console.log(error),
})

</script>

<template>
  <VStack>
    <VButton @click="mutation.mutate()">
      Create new todo list
    </VButton>
    <VStack v-if="query.status.value === 'success'">
      <VBox v-for="list in query.data.value" :key="list.id">
        <RouterLink :to="`/todos/${list.id}`">{{list.title}}</RouterLink>
      </VBox>
    </VStack>
    <VText v-if="query.status.value === 'error'">{{ query.error }}</VText>
    <VText v-if="query.status.value === 'pending'">loading</VText>
  </VStack>
</template>
