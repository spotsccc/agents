<script setup lang="ts">
import {useLogOut, useUser} from "@/shared/auth/use-user.ts";
import {User} from "lucide-vue-next"

import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/shared/components/ui/dropdown-menu";

const {user} = useUser();

const logOut = useLogOut();

async function handleLogOut() {
  await logOut.mutateAsync();
  void window.location.reload();
}


</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <div class="flex items-center">
        <User class="min-w-8 min-h-8"/>
        <p class="overflow-hidden overflow-ellipsis">{{ user!.email }}</p>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem @click="handleLogOut">Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>

</style>
