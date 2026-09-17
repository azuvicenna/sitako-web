<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline';
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import Alert from '@/components/common/Alert.vue';
import { useToast } from '@/composables/useToast';

const isSidebarOpen = ref(true);
const isMobile = ref(false);
const { toast, clearToast } = useToast();

const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 1024;
  }
};

const handleResize = () => {
  if (typeof window !== 'undefined') {
    const wasMobile = isMobile.value;
    isMobile.value = window.innerWidth < 1024;
    // Otomatis sesuaikan state sidebar jika ukuran breakpoint berubah
    if (!wasMobile && isMobile.value) {
      isSidebarOpen.value = false;
    } else if (wasMobile && !isMobile.value) {
      isSidebarOpen.value = true;
    }
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    checkScreenSize();
    if (isMobile.value) {
      isSidebarOpen.value = false;
    }
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize);
  }
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleSidebarClose = () => {
  if (isMobile.value) {
    isSidebarOpen.value = false;
  }
};
</script>

<template>
  <div class="bg-gray-50 text-charcoal font-sans antialiased overflow-hidden flex h-screen w-full relative">
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

    <!-- Backdrop Overlay untuk Mobile Drawer -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-charcoalDark/50 backdrop-blur-xs z-30 lg:hidden"
        @click="isSidebarOpen = false"
        aria-label="Tutup menu navigasi"
      />
    </Transition>

    <Sidebar :isOpen="isSidebarOpen" @close="handleSidebarClose" />
    <div class="flex-1 flex flex-col h-screen relative bg-gray-50 overflow-hidden min-w-0">
      <Header @toggleSidebar="toggleSidebar" />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
