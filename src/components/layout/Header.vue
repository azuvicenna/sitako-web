<script setup lang="ts">
import { ref } from 'vue';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import Input from '@/components/common/Input.vue';

const emit = defineEmits<{
  (e: 'toggleSidebar'): void;
}>();

const searchQuery = ref('');
</script>

<template>
  <header
    class="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0"
  >
    <div class="flex items-center gap-4 w-full max-w-xl">
      <button
        type="button"
        @click="emit('toggleSidebar')"
        class="text-charcoal hover:text-mustardHover transition-colors shrink-0 p-1"
      >
        <Bars3Icon class="w-6 h-6" />
      </button>
      <Input
        v-model="searchQuery"
        :icon="MagnifyingGlassIcon"
        placeholder="Cari ISBN, Judul, atau Nama Anggota..."
      />
    </div>

    <div class="flex items-center gap-4 ml-6">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center shrink-0"
        >
          <img
            src="https://ui-avatars.com/api/?name=Admin+Pustakawan&background=eab308&color=1f2937&rounded=false&size=128"
            alt="Profile"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="hidden md:flex flex-col justify-center h-9 text-right">
          <p class="text-xs font-semibold text-charcoalDark leading-none">Admin Pustakawan</p>
          <p class="text-[10px] text-gray-500 leading-none mt-1">NIP: 192308350505</p>
          <p class="text-[9px] text-gray-400 leading-none mt-0.5">Pustakawan</p>
        </div>
      </div>
    </div>
  </header>
</template>
