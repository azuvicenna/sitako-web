<script setup lang="ts">
import { ref } from 'vue'
import {
    BookmarkIcon,
    UserGroupIcon,
    ArrowUpCircleIcon,
    ExclamationCircleIcon,
    QrCodeIcon,
    PlusCircleIcon,
    ArrowRightCircleIcon,
    BookOpenIcon,
} from '@heroicons/vue/24/outline'
import { ShieldCheckIcon } from '@heroicons/vue/24/solid'

const barcodeInput = ref('')
</script>

<template>
    <div>
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-charcoalDark">Dashboard Pustakawan</h2>
            <p class="text-sm text-gray-500 mt-1">Meja sirkulasi utama dan monitoring</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-mustard">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Koleksi Buku</p>
                    <BookmarkIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">300 <span class="text-xl text-gray-400 font-medium">/
                        200</span></h3>
                <p class="text-xs text-gray-500 mt-4">Total Buku Fisik / Digital</p>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-mustard">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Anggota Aktif</p>
                    <UserGroupIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">1000</h3>
                <p class="text-xs text-gray-500 mt-4">Total Siswa Anggota Aktif</p>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-mustard">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Buku Dipinjam</p>
                    <ArrowUpCircleIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">300</h3>
                <p class="text-xs text-gray-500 mt-4">Total Buku yang Masih Dipinjam</p>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-mustard">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Jatuh Tempo</p>
                    <ExclamationCircleIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">200</h3>
                <p class="text-xs text-gray-500 mt-4">Total Peminjaman Terkena Denda</p>
            </div>
        </div>

        <!-- Quick Action Bar -->
        <div
            class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4 mb-8">
            <div class="flex-1 flex gap-2">
                <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <QrCodeIcon class="w-5 h-5 text-gray-500" />
                    </div>
                    <input v-model="barcodeInput" type="text"
                        class="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
                        placeholder="NIS Anggota atau ISBN Buku...">
                </div>
                <button
                    class="bg-charcoalDark hover:bg-charcoal text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shrink-0">
                    Enter
                </button>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <button
                    class="bg-mustard hover:bg-mustardHover text-charcoalDark px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap">
                    <PlusCircleIcon class="w-5 h-5" /> Proses Pinjam
                </button>
                <button
                    class="bg-gray-100 hover:bg-gray-200 text-charcoalDark px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors border border-gray-200 whitespace-nowrap">
                    <ArrowRightCircleIcon class="w-5 h-5" /> Kembalikan Cepat
                </button>
                <button
                    class="bg-gray-100 hover:bg-gray-200 text-charcoalDark px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors border border-gray-200 whitespace-nowrap">
                    <BookOpenIcon class="w-5 h-5" /> Tambah Koleksi
                </button>
            </div>
        </div>

        <!-- Data Table & Chart -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div class="lg:col-span-2 flex flex-col">
                <div class="flex justify-between items-end mb-4">
                    <h3 class="text-lg font-bold text-charcoalDark leading-tight">Transaksi Sirkulasi<br>Hari Ini</h3>
                    <div class="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                        <button
                            class="px-3 py-1.5 bg-mustard shadow-sm rounded-md text-xs font-bold text-charcoalDark">Semua<br><span
                                class="font-normal text-charcoal">(84)</span></button>
                        <button
                            class="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-colors text-center">Dipinjam<br><span
                                class="font-normal">(84)</span></button>
                        <button
                            class="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-colors text-center">Lewat
                            Tempo<br><span class="font-normal">(84)</span></button>
                        <button
                            class="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-md transition-colors text-center">Selesai<br><span
                                class="font-normal">(84)</span></button>
                        <span
                            class="px-3 py-1.5 text-xs font-medium text-gray-400 border-l border-gray-200 ml-1 text-center">84<br>entri</span>
                    </div>
                </div>
                <div class="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-75">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr
                                class="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                                <th class="px-4 py-3">ID Pinjam</th>
                                <th class="px-4 py-3">Anggota</th>
                                <th class="px-4 py-3">Judul Buku</th>
                                <th class="px-4 py-3">Tgl Pinjam</th>
                                <th class="px-4 py-3">Batas Kembali</th>
                                <th class="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Row items -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-lg font-bold text-charcoalDark">Statistik Peminjaman</h3>
                        <p class="text-xs text-gray-500 mt-1">Aktivitas 7 Hari Terakhir</p>
                    </div>
                    <span class="text-xs font-bold text-mustard bg-mustard/10 px-2 py-1 rounded">Minggu Ke-3</span>
                </div>

                <div class="flex-1 flex flex-col justify-end border-b border-gray-200 pb-4 mb-4 relative">
                    <div class="absolute inset-0 flex items-end justify-between px-2 opacity-30">
                        <div class="w-1/6 bg-charcoal h-1/3 rounded-t-sm"></div>
                        <div class="w-1/6 bg-charcoal h-2/3 rounded-t-sm"></div>
                        <div class="w-1/6 bg-charcoal h-1/2 rounded-t-sm"></div>
                        <div class="w-1/6 bg-mustard h-full rounded-t-sm opacity-100"></div>
                        <div class="w-1/6 bg-charcoal h-3/4 rounded-t-sm"></div>
                    </div>
                </div>

                <div class="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-auto">
                    <p class="text-sm font-semibold text-charcoalDark">Rata-rata Harian: <span
                            class="text-mustardHover">70
                            Buku</span></p>
                </div>
            </div>
        </div>

        <!-- Alert Box -->
        <div class="bg-mustard/10 p-5 rounded-xl border border-mustard/30 flex items-start gap-4">
            <div class="mt-0.5">
                <ShieldCheckIcon class="w-6 h-6 text-mustardHover" />
            </div>
            <div>
                <h4 class="font-bold text-charcoalDark text-sm">Regulasi Sirkulasi Aktif</h4>
                <p class="text-xs text-charcoal mt-1">
                    Batas pinjam mahasiswa maks 3 buku (7 hari kerja). Perpanjangan mandiri diperbolehkan 1x apabila
                    buku tidak sedang direservasi anggota lain. Denda Rp 1.000 / hari / buku.
                </p>
            </div>
        </div>
    </div>
</template>