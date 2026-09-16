<script setup lang="ts">
import { ref } from 'vue';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline';
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import Alert from '@/components/common/Alert.vue';
import { useToast } from '@/composables/useToast';

const isSidebarOpen = ref(true);
const { toast, clearToast } = useToast();

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
  <div class="bg-gray-50 text-charcoal font-sans antialiased overflow-hidden flex h-screen w-full">
    <!-- Global Floating Toast Notification -->
    <div class="fixed top-5 right-5 z-50 max-w-sm w-full pointer-events-none">
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="toast"
          class="pointer-events-auto shadow-lg rounded-xl overflow-hidden cursor-pointer"
          @click="clearToast"
          title="Klik untuk menutup notifikasi"
        >
          <Alert
            :variant="toast.type === 'success' ? 'success' : 'danger'"
            :icon="toast.type === 'success' ? CheckCircleIcon : ExclamationCircleIcon"
            :title="toast.type === 'success' ? 'Berhasil' : 'Perhatian'"
            :description="toast.message"
          />
        </div>
      </Transition>
    </div>

    <Sidebar :isOpen="isSidebarOpen" />
    <div class="flex-1 flex flex-col h-screen relative bg-gray-50 overflow-hidden">
      <Header @toggleSidebar="toggleSidebar" />
      <main class="flex-1 overflow-y-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
