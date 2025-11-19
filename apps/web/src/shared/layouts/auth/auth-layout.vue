<script setup lang="ts">
import {SidebarProvider, SidebarTrigger} from '@/shared/components/ui/sidebar'
import AuthSidebar from './auth-sidebar.vue'

</script>

<template>
  <SidebarProvider>
    <AuthSidebar/>
    <main class="w-full">
      <SidebarTrigger/>
      <div class="p-4">
        <router-view/>
      </div>
    </main>
  </SidebarProvider>
</template>
