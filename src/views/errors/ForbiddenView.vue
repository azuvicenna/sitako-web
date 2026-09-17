<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  ShieldExclamationIcon,
  HomeIcon,
  ArrowLeftStartOnRectangleIcon,
} from '@heroicons/vue/24/outline';
import ErrorLayout from './ErrorLayout.vue';
import Button from '@/components/common/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const authStore = useAuthStore();
const { logoutAsync, isLoggingOut } = useAuth();

const handleGoHome = () => {
  if (authStore.isAuthenticated && authStore.role) {
    if (authStore.role === 'Anggota') {
      router.push('/anggota/dashboard');
    } else {
      router.push('/pustakawan/dashboard');
    }
  } else {
    router.push('/login');
  }
};

const handleLogout = async () => {
  try {
    await logoutAsync();
  } catch {
    // Selesaikan logout di client
  } finally {
    router.push('/login');
  }
};
</script>

<template>
  <ErrorLayout
    status-code="403"
    title="Akses Ditolak"
    description="Anda tidak memiliki wewenang atau hak akses untuk melihat halaman ini. Pastikan Anda masuk menggunakan akun dengan peran yang sesuai."
    :icon="ShieldExclamationIcon"
    icon-color="text-red-500"
    icon-bg-color="bg-red-50 border-red-200"
  >
    <template #actions>
      <Button variant="primary" @click="handleGoHome" class="w-full sm:w-auto shadow-xs">
        <template #icon>
          <HomeIcon class="w-5 h-5" />
        </template>
        Kembali ke Dashboard
      </Button>
      <Button
        variant="secondary"
        @click="handleLogout"
        :disabled="isLoggingOut"
        class="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <template #icon>
          <ArrowLeftStartOnRectangleIcon class="w-5 h-5 text-red-500" />
        </template>
        {{ isLoggingOut ? 'Mengeluarkan Akun...' : 'Ganti Akun' }}
      </Button>
    </template>
  </ErrorLayout>
</template>
