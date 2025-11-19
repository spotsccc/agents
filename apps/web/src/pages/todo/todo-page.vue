<script setup lang="ts">
import {useMutation, useQuery, useQueryClient} from "@tanstack/vue-query";
import {useRoute} from "vue-router";
import {VStack} from "@/shared/ui/stack";
import {VText} from "@/shared/ui/text";
import {VBox} from "@/shared/ui/box";
import {VButton} from "@/shared/ui/button";
import {VGroup} from "@/shared/ui/group";
import {TextInput} from "@/shared/ui/text-input";
import {
  createTodo,
  getTodoListWithTodos, type TodoListWithTodos,
  type TodoStatus,
  updateTodo,
  deleteTodo
} from "@/shared/repositories/todos.ts";
import {ref} from "vue";
import {useUser} from "@/shared/auth/use-user.ts";

const route = useRoute();
const queryClient = useQueryClient();
const newTodoTitle = ref('')

const user = useUser();

const todoListQuery = useQuery({
  queryKey: ['todo_list', route.params.id],
  retry: false,
  queryFn: () => getTodoListWithTodos(route.params.id as string),
})

const createTodoMutation = useMutation({
  mutationFn: () => {
    if (!user.data.value) {
      throw new Error('user not found');
    }
    return createTodo(newTodoTitle.value, user.data.value.id)
  },
  onSettled: () => {
    newTodoTitle.value = '';
    queryClient.invalidateQueries({queryKey: ['todo_list', route.params.id]});
  }
})

const deleteTodoMutation = useMutation({
  mutationFn: (id: string) => deleteTodo(id),
  onSettled: () => {
    queryClient.invalidateQueries({queryKey: ['todo_list', route.params.id]});
  }
})

const changeStatusMutation = useMutation({
  mutationFn: ({id, status}: {id: string, status: TodoStatus}) => updateTodo(id, {status}),
  onMutate: async ({id, status}) => {
    const prev = queryClient.getQueryData(['todo_list', route.params.id]);

    queryClient.setQueryData(['todo_list', route.params.id], (oldData: TodoListWithTodos) => {
      return {
        ...oldData,
        todos: oldData.todos.map(todo => todo.id === id ? {...todo, status } : todo)
      }
    })

    return {
      prev,
    }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['todos'], context?.prev)
  },
  onSettled: () => {
    queryClient.invalidateQueries({queryKey: ['todo_list', route.params.id]});
  }
})
</script>

<template>
  <VStack v-if="todoListQuery.status.value === 'success'">
    <VText>{{ todoListQuery.data.value?.title }}</VText>
    <VGroup>
      <TextInput v-model="newTodoTitle"/>
      <VButton @click="createTodoMutation.mutate()">
        Create new todo
      </VButton>
    </VGroup>

    <VStack>
      <VBox v-for="todo in todoListQuery.data.value?.todos" :key="todo.id">
        <VText>{{todo.title}}</VText>
        <VText>{{todo.status}}</VText>
        <VButton @click="changeStatusMutation.mutate({id: todo.id, status: todo.status === 'active' ? 'completed' : 'active'})">
          toggle
        </VButton>
        <VButton @click="deleteTodoMutation.mutate(todo.id)">
          delete
        </VButton>
      </VBox>
    </VStack>

  </VStack>
  <VStack v-if="todoListQuery.status.value === 'pending'">
    loading
  </VStack>
  <VStack v-if="todoListQuery.status.value === 'error'">
    {{ todoListQuery.error.value }}
  </VStack>
</template>
