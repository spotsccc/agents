<script setup lang="ts">
import {useLogOut, useUser} from "@/shared/auth/use-user.ts";
import {User} from "lucide-vue-next"

import {Skeleton} from "@/shared/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/shared/components/ui/dropdown-menu";
import VText from "@/shared/ui/text/ui.vue";

const user = useUser();

const logOut = useLogOut();

async function handleLogOut() {
  await logOut.mutateAsync();
  void window.location.reload();
}


</script>

<template>
  <div v-if="user.status.value !== 'success'" class="flex items-center gap-2">
    <Skeleton class="min-w-8 min-h-8"/>
    <Skeleton class="w-24 h-4"/>
  </div>
  <DropdownMenu v-else>
    <DropdownMenuTrigger>
      <div class="flex items-center">
        <User class="min-w-8 min-h-8"/>
        <VText class="overflow-hidden overflow-ellipsis">{{ user.data.value!.email }}</VText>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem @click="handleLogOut">Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>

</style>
