<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar'
import { RouterLink } from 'vue-router'
import UserMenu from '@/shared/layouts/auth/user-menu.vue'

const finance = [
  {
    title: 'Wallets',
    url: '/wallets',
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
  },
]
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <UserMenu />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Finance</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in finance" :key="item.title">
              <SidebarMenuButton asChild>
                <RouterLink :to="item.url">
                  {{ item.title }}
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter />
  </Sidebar>
</template>
