<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'

const isSidebarOpen = ref(true)

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
    <div class="bg-gray-50 text-charcoal font-sans antialiased overflow-hidden flex h-screen w-full">
        <Sidebar :isOpen="isSidebarOpen" />
        <div class="flex-1 flex flex-col h-screen relative bg-gray-50 overflow-hidden">
            <Header @toggleSidebar="toggleSidebar" />
            <main class="flex-1 overflow-y-auto p-8">
                <router-view />
            </main>
        </div>
    </div>
</template>