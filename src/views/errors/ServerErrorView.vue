<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/vue/24/outline';
import ErrorLayout from './ErrorLayout.vue';
import Button from '@/components/common/Button.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleReload = () => {
  window.location.reload();
};

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
</script>

<template>
  <ErrorLayout
    status-code="500"
    title="Terjadi Kesalahan Server"
    description="Sistem sedang mengalami gangguan teknis saat memproses permintaan Anda. Silakan muat ulang halaman ini atau coba beberapa saat lagi."
    :icon="ExclamationTriangleIcon"
    icon-color="text-amber-600"
    icon-bg-color="bg-amber-50 border-amber-200"
  >
    <template #actions>
      <Button variant="primary" @click="handleReload" class="w-full sm:w-auto shadow-xs">
        <template #icon>
          <ArrowPathIcon class="w-5 h-5" />
        </template>
        Muat Ulang Halaman
      </Button>
      <Button variant="secondary" @click="handleGoHome" class="w-full sm:w-auto">
        <template #icon>
          <HomeIcon class="w-5 h-5 text-gray-500" />
        </template>
        {{ authStore.isAuthenticated ? 'Kembali ke Dashboard' : 'Kembali ke Login' }}
      </Button>
    </template>
  </ErrorLayout>
</template>
