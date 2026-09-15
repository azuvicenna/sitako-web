<script setup lang="ts">
import { ref } from 'vue'
import {
    BookOpenIcon,
    Squares2X2Icon,
    ArchiveBoxIcon,
    BanknotesIcon,
    UsersIcon,
    UserGroupIcon,
    ArrowUpCircleIcon,
    ArrowDownCircleIcon,
    DocumentTextIcon,
    ArrowLeftStartOnRectangleIcon,
} from '@heroicons/vue/24/outline'

import Button from '@/components/common/Button.vue'
import Modal from '@/components/common/Modal.vue'

defineProps<{
    isOpen: boolean
}>()

const isLogoutModalOpen = ref(false)

const handleLogout = () => {
    isLogoutModalOpen.value = false
    // Logika logout bisa ditambahkan di sini
}
</script>

<template>
    <aside :class="isOpen ? 'w-64' : 'w-0'"
        class="bg-white border-r border-gray-200 flex flex-col z-20 shrink-0 transition-all duration-300 overflow-hidden whitespace-nowrap">
        <div class="h-16 flex items-center justify-between px-6 border-b border-gray-200 w-64">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-mustard rounded flex items-center justify-center text-charcoalDark shrink-0">
                    <BookOpenIcon class="w-5 h-5 shrink-0" />
                </div>
                <div>
                    <h1 class="text-sm font-bold text-charcoalDark leading-tight">SITAKO</h1>
                    <p class="text-[8px] text-gray-500 font-medium leading-tight whitespace-normal mt-0.5">
                        Sistem Informasi Perpustakaan Sekolah<br>Versi v1.0.0
                    </p>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto py-4 w-64">
            <div class="mb-6 px-4">
                <p class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan</p>
                <router-link to="/pustakawan/dashboard"
                    class="flex items-center gap-3 px-3 py-2.5 bg-mustard rounded-lg text-charcoalDark font-bold shadow-sm text-[13px]">
                    <Squares2X2Icon class="w-5 h-5 shrink-0" />
                    <span class="truncate">Dashboard Pustakawan</span>
                </router-link>
            </div>

            <div class="mb-6 px-4">
                <p class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Master Data</p>
                <div class="space-y-1">
                    <router-link to="/rak"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <ArchiveBoxIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Kelola Rak Buku</span>
                    </router-link>
                    <router-link to="/buku"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <BookOpenIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Kelola Buku Perpustakaan</span>
                    </router-link>
                    <router-link to="/denda"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <BanknotesIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Kelola Denda Buku</span>
                    </router-link>
                    <router-link to="/anggota"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <UsersIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Daftar Anggota</span>
                    </router-link>
                    <router-link to="/pustakawan"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <UserGroupIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Daftar Pustakawan</span>
                    </router-link>
                </div>
            </div>

            <div class="mb-6 px-4">
                <p class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Layanan Sirkulasi</p>
                <div class="space-y-1">
                    <router-link to="/peminjaman"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <ArrowUpCircleIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Daftar Peminjaman</span>
                    </router-link>
                    <router-link to="/pengembalian"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                        <ArrowDownCircleIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Daftar
                            Pengembalian</span>
                    </router-link>
                </div>
            </div>

            <div class="px-4">
                <p class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cetak Laporan</p>
                <router-link to="/laporan"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal hover:bg-gray-100 font-medium transition-colors text-[13px]">
                    <DocumentTextIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Buat Laporan</span>
                </router-link>
            </div>
        </div>

        <div class="p-4 bg-white w-64 border-t border-gray-200">
            <button
                @click="isLogoutModalOpen = true"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-mustard text-charcoalDark hover:bg-mustardHover font-bold transition-colors text-[13px] cursor-pointer">
                <ArrowLeftStartOnRectangleIcon class="w-5 h-5 shrink-0" /> <span class="truncate">Logout</span>
            </button>
        </div>
    </aside>

    <!-- Modal Konfirmasi Logout -->
    <Modal
        v-model="isLogoutModalOpen"
        title="Konfirmasi Logout"
        description="Apakah Anda yakin ingin keluar dari sistem SITAKO? Sesi aktif Anda saat ini akan diakhiri."
        :icon="ArrowLeftStartOnRectangleIcon"
        icon-variant="danger"
    >
        <template #footer="{ close }">
            <Button variant="secondary" @click="close">
                Batal
            </Button>
            <Button variant="dark" @click="handleLogout">
                Ya, Keluar
            </Button>
        </template>
    </Modal>
</template>