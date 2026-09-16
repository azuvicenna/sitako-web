<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { WrenchScrewdriverIcon } from '@heroicons/vue/24/outline';
import Card from '@/components/common/Card.vue';

const route = useRoute();
const title = computed(() => (route.meta.title as string) || 'Halaman Modul');
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-charcoalDark">{{ title }}</h2>
      <p class="text-sm text-gray-500 mt-1">Halaman fitur sistem perpustakaan SITAKO</p>
    </div>

    <Card class="p-12 flex flex-col items-center justify-center text-center">
      <div
        class="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 shadow-inner"
      >
        <WrenchScrewdriverIcon class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-charcoalDark mb-2">{{ title }}</h3>
      <p class="text-sm text-gray-500 max-w-md">
        Modul ini sedang dalam tahap pengembangan sesuai spesifikasi API_DOCUMENTATION.md.
      </p>
    </Card>
  </div>
</template>
