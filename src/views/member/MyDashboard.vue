<script setup lang="ts">
import {
    BookOpenIcon,
    BanknotesIcon,
    BookmarkIcon,
    ArrowTopRightOnSquareIcon,
    ClockIcon,
} from '@heroicons/vue/24/outline'

import Button from '@/components/common/Button.vue'
import Card from '@/components/common/Card.vue'
import AccentCard from '@/components/common/AccentCard.vue'
import Alert from '@/components/common/Alert.vue'
</script>

<template>
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold text-charcoalDark">Dashboard Anggota</h2>
            <p class="text-sm text-gray-500 mt-1">Pantau aktivitas peminjaman dan riwayat bacaan Anda</p>
        </div>

        <!-- Statistik Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AccentCard>
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Buku Dipinjam</p>
                    <BookOpenIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">2</h3>
                <p class="text-xs text-gray-500 mt-3">Sedang aktif dipinjam</p>
            </AccentCard>

            <AccentCard>
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Denda</p>
                    <BanknotesIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">Rp 15.000</h3>
                <p class="text-xs text-gray-500 mt-3">Menunggu pembayaran</p>
            </AccentCard>

            <AccentCard>
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Bookmark</p>
                    <BookmarkIcon class="w-5 h-5 text-charcoal" />
                </div>
                <h3 class="text-3xl font-bold text-charcoalDark">8</h3>
                <p class="text-xs text-gray-500 mt-3">Buku tersimpan di wishlist</p>
            </AccentCard>
        </div>

        <!-- Banner Tagihan Denda -->
        <Alert class="items-center justify-between p-4! bg-amber-50! border-amber-200!">
            <template #icon>
                <div class="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <BanknotesIcon class="w-6 h-6" />
                </div>
            </template>
            <template #title>
                <h4 class="text-sm font-bold text-charcoalDark">Tagihan Denda Belum Lunas</h4>
            </template>
            <template #description>
                <p class="text-xs text-gray-600 mt-0.5">
                    Total kewajiban denda keterlambatan:
                    <span class="font-bold text-charcoalDark">Rp 15.000</span>
                </p>
            </template>
            <template #action>
                <Button
                    variant="primary"
                    href="https://tripay.co.id/checkout/..."
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs! py-2! px-4! rounded-lg! gap-1.5! shrink-0"
                >
                    Bayar Sekarang
                    <template #iconRight>
                        <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                    </template>
                </Button>
            </template>
        </Alert>

        <!-- Grid Transaksi & Bookmark -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Transaksi Aktif -->
            <Card class="p-6 flex flex-col">
                <h3 class="text-base font-bold text-charcoalDark mb-4">Peminjaman Aktif</h3>
                <div class="space-y-3">
                    <div
                        class="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=60"
                            alt="Atomic Habits"
                            class="w-14 h-20 object-cover rounded-md bg-gray-100 shrink-0 border border-gray-200">
                        <div class="flex-1 min-w-0">
                            <span
                                class="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 mb-1">
                                Dipinjam
                            </span>
                            <h4 class="text-sm font-bold text-charcoalDark truncate">Atomic Habits</h4>
                            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <ClockIcon class="w-4 h-4 text-gray-400 shrink-0" />
                                Batas kembali: 20 Sep 2026
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- Bookmark Terbaru -->
            <Card class="p-6 flex flex-col">
                <h3 class="text-base font-bold text-charcoalDark mb-4">Bookmark Terbaru</h3>
                <div class="space-y-3">
                    <div
                        class="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=60"
                            alt="Filosofi Teras"
                            class="w-14 h-20 object-cover rounded-md bg-gray-100 shrink-0 border border-gray-200">
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-charcoalDark truncate">Filosofi Teras</h4>
                            <p class="text-xs text-gray-500 mt-1">Penulis: Henry Manampiring</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>