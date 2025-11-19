<script setup lang="ts">
import {useRouter} from "vue-router";
import {VGroup} from '@/shared/ui/group'
import {VStack} from '@/shared/ui/stack'
import {useLogOut, useUser} from "@/shared/auth/use-user.ts";
import ShevronDown from '@/shared/ui/icons/shevron-down.svg'
import VButton from "@/shared/ui/button/ui.vue";
import {
  Sidebar,
  SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from "@/shared/components/ui/sidebar";
import {SidebarProvider, SidebarTrigger} from '@/shared/components/ui/sidebar'
import {
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenu
} from "@/shared/components/ui/dropdown-menu";
import {Button} from "@/shared/components/ui/button";
import {Skeleton} from "@/shared/components/ui/skeleton";


const user = useUser();

const logOut = useLogOut();

const router = useRouter();

async function handleLogOut() {
  await logOut.mutateAsync();
  void router.push("/auth/sign-in");
}

const finance = [
  {
    title: "Wallets",
    url: "/wallets",
  },
  {
    title: "Dashboard",
    url: "/wallets",
  },
];
</script>

<template>
  <SidebarProvider>
    <Sidebar>
      <SidebarHeader>
        <div class="flex items-center gap-2">
          <Skeleton class="w-8 h-8" />
          <Skeleton class="w-24 h-4"/>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in finance" :key="item.title">
                <SidebarMenuButton asChild>
                  <a :href="item.url">
                    <span>{{ item.title }}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter/>
    </Sidebar>
    <main>
      <SidebarTrigger/>
      <slot/>
    </main>
  </SidebarProvider>
</template>

<style module>
.sidebar {
  border-right: 1px solid black;
}
</style>
