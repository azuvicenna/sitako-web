<script setup lang="ts">
import { useRouter } from 'vue-router';
import { MagnifyingGlassIcon, HomeIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/outline';
import ErrorLayout from './ErrorLayout.vue';
import Button from '@/components/common/Button.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

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

const handleGoBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    handleGoHome();
  }
};
</script>

<template>
  <ErrorLayout
    status-code="404"
    title="Halaman Tidak Ditemukan"
    description="Maaf, halaman yang Anda tuju tidak dapat ditemukan. Alamat tautan mungkin salah ketik, telah kedaluwarsa, atau dipindahkan."
    :icon="MagnifyingGlassIcon"
    icon-color="text-mustardHover"
    icon-bg-color="bg-amber-50 border-amber-200"
  >
    <template #actions>
      <Button variant="primary" @click="handleGoHome" class="w-full sm:w-auto shadow-xs">
        <template #icon>
          <HomeIcon class="w-5 h-5" />
        </template>
        {{ authStore.isAuthenticated ? 'Kembali ke Dashboard' : 'Kembali ke Login' }}
      </Button>
      <Button variant="secondary" @click="handleGoBack" class="w-full sm:w-auto">
        <template #icon>
          <ArrowUturnLeftIcon class="w-5 h-5 text-gray-500" />
        </template>
        Halaman Sebelumnya
      </Button>
    </template>
  </ErrorLayout>
</template>
