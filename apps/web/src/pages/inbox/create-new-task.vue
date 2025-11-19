<script setup lang="ts">
import {ref} from "vue";
import VStack from "@/shared/ui/stack/ui.vue";
import VGroup from "@/shared/ui/group/ui.vue";
import TextInput from "@/shared/ui/text-input/ui.vue";
import VTextarea from "@/shared/ui/v-textarea.vue";
import {useMutation, useQueryClient} from "@tanstack/vue-query";
import {useUser} from "@/shared/auth/use-user.ts";
import VButton from "@/shared/ui/button/ui.vue";
import {supabase} from "@/shared/supabase";

const emit = defineEmits(['cancelClick', 'createClick'])

const title = ref("");
const description = ref("");
const repeatRuleOpened = ref(false);
const repeatRule = ref("");

const queryClient = useQueryClient();
const user = useUser();

const newTask = useMutation({
  async mutationFn() {
    const res = await supabase.from('tasks').insert({
      description: description.value,
      title: title.value,
      user_id: user.data.value!.id,
      status: 'todo',
    })

    if (res.error) {
      throw res.error;
    }

    return res.data;
  },
  onSuccess() {
    queryClient.invalidateQueries({queryKey: ['tasks']});
  },
  onSettled() {
    title.value = '';
    description.value = '';
  }
})

function handleCreateClick() {
  newTask.mutate();
  emit('createClick');
}

function handleCancelClick() {
  emit('cancelClick');
}

</script>

<template>
  <VStack>
    <TextInput v-model="title"/>
    <VTextarea v-model="description"/>
    <VButton @click="repeatRuleOpened = true">Repeat</VButton>
    <VGroup>
      <VButton @click="handleCancelClick" >Cancel</VButton>
      <VButton @click="handleCreateClick">Create</VButton>
    </VGroup>
  </VStack>
</template>

<style scoped>

</style>
