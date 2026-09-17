<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BookOpenIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/composables/useAuth';
import { sidebarMenuGroups } from '@/data/sidebar-menu';
import { appInfo } from '@/data/app-info';

defineProps<{
  isOpen: boolean;
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { logoutAsync } = useAuth();

const isLogoutModalOpen = ref(false);

const handleLogout = async () => {
  isLogoutModalOpen.value = false;
  try {
    await logoutAsync();
  } catch {
    // Abaikan galat logout pada sisi client
  } finally {
    router.push('/login');
  }
};

const activeRole = computed(() => {
  if (authStore.role) return authStore.role;
  return route.path.startsWith('/anggota') ? 'Anggota' : 'Pustakawan';
});

const filteredMenuGroups = computed(() => {
  const currentRole = activeRole.value;

  return sidebarMenuGroups
    .filter((group) => {
      if (group.roles && group.roles.length > 0) {
        return currentRole ? group.roles.includes(currentRole) : false;
      }
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles && item.roles.length > 0) {
          return currentRole ? item.roles.includes(currentRole) : false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
});

const isRouteActive = (path: string) => {
  return route.path === path;
};
</script>

<template>
  <aside
    :class="isOpen ? 'w-64' : 'w-0'"
    class="bg-white border-r border-gray-200 flex flex-col z-20 shrink-0 transition-all duration-300 overflow-hidden whitespace-nowrap"
  >
    <div class="h-16 flex items-center justify-between px-6 border-b border-gray-200 w-64">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-mustard rounded flex items-center justify-center text-charcoalDark shrink-0"
        >
          <BookOpenIcon class="w-5 h-5 shrink-0" />
        </div>
        <div>
          <h1 class="text-sm font-bold text-charcoalDark leading-tight">{{ appInfo.name }}</h1>
          <p class="text-[8px] text-gray-500 font-medium leading-tight whitespace-normal mt-0.5">
            {{ appInfo.description }}<br />Versi {{ appInfo.version }}
          </p>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto py-4 w-64">
      <div v-for="group in filteredMenuGroups" :key="group.title" class="mb-6 px-4 last:mb-0">
        <p
          v-if="group.title"
          class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2"
        >
          {{ group.title }}
        </p>
        <div class="space-y-1">
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors"
            :class="[
              isRouteActive(item.path)
                ? 'bg-mustard text-charcoalDark font-bold shadow-sm'
                : 'text-charcoal hover:bg-gray-100 font-medium',
            ]"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" />
            <span class="truncate">{{ item.title }}</span>
            <span
              v-if="item.badge"
              class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-charcoal/10 font-bold"
            >
              {{ item.badge }}
            </span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="p-4 bg-white w-64 border-t border-gray-200">
      <button
        @click="isLogoutModalOpen = true"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-mustard text-charcoalDark hover:bg-mustardHover font-bold transition-colors text-[13px] cursor-pointer"
      >
        <ArrowLeftStartOnRectangleIcon class="w-5 h-5 shrink-0" />
        <span class="truncate">Logout</span>
      </button>
    </div>
  </aside>

  <!-- Modal Konfirmasi Logout -->
  <Modal
    v-model="isLogoutModalOpen"
    title="Konfirmasi Logout"
    :description="`Apakah Anda yakin ingin keluar dari sistem ${appInfo.name}? Sesi aktif Anda saat ini akan diakhiri.`"
    :icon="ArrowLeftStartOnRectangleIcon"
    icon-variant="danger"
  >
    <template #footer="{ close }">
      <Button variant="secondary" @click="close"> Batal </Button>
      <Button variant="dark" @click="handleLogout"> Ya, Keluar </Button>
    </template>
  </Modal>
</template>
