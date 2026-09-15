<script setup lang="ts">
import { ref } from 'vue'
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
    (e: 'toggleSidebar'): void
}>()

const searchQuery = ref('')
</script>

<template>
    <header class="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div class="flex items-center gap-4 w-full max-w-xl">
            <button type="button" @click="emit('toggleSidebar')"
                class="text-charcoal hover:text-mustardHover transition-colors shrink-0 p-1">
                <Bars3Icon class="w-6 h-6" />
            </button>
            <div class="relative w-full">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
                </div>
                <input v-model="searchQuery" type="text"
                    class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
                    placeholder="Cari ISBN, Judul, atau Nama Anggota...">
            </div>
        </div>

        <div class="flex items-center gap-4 ml-6">
            <div class="flex items-center gap-3">
                <div
                    class="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                    <img src="https://ui-avatars.com/api/?name=Admin+Pustakawan&background=eab308&color=1f2937&rounded=false&size=128"
                        alt="Profile" class="w-full h-full object-cover">
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