<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  BookOpenIcon,
  BanknotesIcon,
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowUpCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Card from '@/components/common/Card.vue';
import AccentCard from '@/components/common/AccentCard.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { useAuthStore } from '@/stores/auth';
import type { MemberDashboardResponse } from '@/types/member-dashboard';

const router = useRouter();
const authStore = useAuthStore();
const queryClient = useQueryClient();

// --- QUERY DASHBOARD ANGGOTA ---
const {
  data: dashboardData,
  isLoading,
  isFetching,
} = useQuery({
  queryKey: ['member-dashboard'],
  queryFn: async () => {
    const res = await api.get<MemberDashboardResponse>('/member/dashboard');
    return res.data;
  },
});

const statistik = computed(() => dashboardData.value?.statistik || {
  bukuDipinjam: 0,
  totalDenda: 0,
  totalBookmark: 0,
});

const transaksiAktif = computed(() => dashboardData.value?.transaksiAktif || []);
const tagihanDenda = computed(() => dashboardData.value?.tagihanDenda || []);
const bookmarkTerbaru = computed(() => dashboardData.value?.bookmarkTerbaru || []);

// URL checkout denda pertama yang tersedia (jika ada)
const primaryCheckoutUrl = computed(() => {
  const bill = tagihanDenda.value.find((b) => !!b.checkoutUrl);
  return bill ? bill.checkoutUrl : null;
});

const refreshDashboard = () => {
  queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
};

// Helper badge status peminjaman
const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dipinjam':
      return 'warning';
    case 'Menunggu Diambil':
      return 'mustard';
    case 'Menunggu Persetujuan':
      return 'info';
    case 'Terlambat':
      return 'danger';
    case 'Dikembalikan':
      return 'success';
    default:
      return 'neutral';
  }
};

// Helper kalkulasi sisa hari tempo
const getDueInfo = (tglKembali: string | null) => {
  if (!tglKembali) return null;
  const target = dayjs(tglKembali);
  const now = dayjs().startOf('day');
  const diffDays = target.diff(now, 'day');

  if (diffDays < 0) {
    return {
      text: `Terlambat ${Math.abs(diffDays)} hari`,
      isOverdue: true,
      isNear: false,
    };
  }
  if (diffDays === 0) {
    return {
      text: 'Jatuh tempo hari ini',
      isOverdue: true,
      isNear: true,
    };
  }
  if (diffDays <= 2) {
    return {
      text: `Batas: ${diffDays} hari lagi`,
      isOverdue: false,
      isNear: true,
    };
  }
  return {
    text: `Batas: ${target.format('DD MMM YYYY')}`,
    isOverdue: false,
    isNear: false,
  };
};
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">
          Halo, {{ authStore.user?.nama || 'Anggota Perpustakaan' }} 👋
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Pantau buku yang sedang Anda pinjam, tenggat pengembalian, dan riwayat bacaan Anda.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="isFetching"
          @click="refreshDashboard"
          class="text-xs font-semibold text-gray-600"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isFetching }" />
          Segarkan Data
        </Button>
      </div>
    </div>

    <!-- STATISTIK KARTU (DYNAMIC) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Buku Dipinjam -->
      <AccentCard
        accent-color="border-t-mustard"
        class="cursor-pointer hover:shadow-md transition-shadow duration-200"
        @click="router.push('/anggota/peminjaman')"
      >
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Buku Dipinjam</p>
          <BookOpenIcon class="w-5 h-5 text-charcoal" />
        </div>
        <div v-if="isLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div v-else>
          <h3 class="text-3xl font-bold text-charcoalDark">
            {{ statistik.bukuDipinjam }}
          </h3>
          <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Sedang aktif dipinjam</span>
            <span class="text-mustard font-semibold flex items-center gap-0.5 hover:underline">
              Kelola <ChevronRightIcon class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </AccentCard>

      <!-- 2. Total Denda -->
      <AccentCard
        :accent-color="statistik.totalDenda > 0 ? 'border-t-rose-500' : 'border-t-emerald-500'"
        class="cursor-pointer hover:shadow-md transition-shadow duration-200"
        @click="router.push('/anggota/denda')"
      >
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Denda</p>
          <BanknotesIcon
            class="w-5 h-5"
            :class="statistik.totalDenda > 0 ? 'text-rose-500' : 'text-emerald-500'"
          />
        </div>
        <div v-if="isLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else>
          <h3
            class="text-3xl font-bold"
            :class="statistik.totalDenda > 0 ? 'text-rose-600' : 'text-emerald-600'"
          >
            {{ formatRupiah(statistik.totalDenda) }}
          </h3>
          <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>
              {{ statistik.totalDenda > 0 ? 'Menunggu pembayaran' : 'Bebas tanggungan' }}
            </span>
            <span class="text-mustard font-semibold flex items-center gap-0.5 hover:underline">
              Detail <ChevronRightIcon class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </AccentCard>

      <!-- 3. Total Bookmark -->
      <AccentCard
        accent-color="border-t-sky-500"
        class="cursor-pointer hover:shadow-md transition-shadow duration-200"
        @click="router.push('/anggota/bookmark')"
      >
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Buku Tersimpan</p>
          <BookmarkIcon class="w-5 h-5 text-sky-600" />
        </div>
        <div v-if="isLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div v-else>
          <h3 class="text-3xl font-bold text-charcoalDark">
            {{ statistik.totalBookmark }}
          </h3>
          <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Buku di wishlist Anda</span>
            <span class="text-mustard font-semibold flex items-center gap-0.5 hover:underline">
              Buka <ChevronRightIcon class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </AccentCard>
    </div>

    <!-- BANNER TAGIHAN DENDA JIKA ADA -->
    <Alert
      v-if="statistik.totalDenda > 0"
      class="items-center justify-between p-4! bg-rose-50! border-rose-200!"
    >
      <template #icon>
        <div
          class="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0"
        >
          <ExclamationTriangleIcon class="w-6 h-6" />
        </div>
      </template>
      <template #title>
        <h4 class="text-sm font-bold text-charcoalDark">Anda Memiliki Tagihan Denda Aktif</h4>
      </template>
      <template #description>
        <p class="text-xs text-gray-600 mt-0.5">
          Total kewajiban denda keterlambatan/buku hilang:
          <span class="font-bold text-rose-700">{{ formatRupiah(statistik.totalDenda) }}</span>.
          Silakan selesaikan pembayaran untuk memulihkan akses peminjaman buku baru.
        </p>
      </template>
      <template #action>
        <Button
          v-if="primaryCheckoutUrl"
          variant="primary"
          :href="primaryCheckoutUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs! py-2! px-4! rounded-lg! gap-1.5! shrink-0 !bg-rose-600 hover:!bg-rose-700"
        >
          Bayar Online
          <template #iconRight>
            <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          </template>
        </Button>
        <Button
          v-else
          variant="primary"
          @click="router.push('/anggota/denda')"
          class="text-xs! py-2! px-4! rounded-lg! gap-1.5! shrink-0 !bg-rose-600 hover:!bg-rose-700"
        >
          Bayar Sekarang
          <template #iconRight>
            <ChevronRightIcon class="w-4 h-4" />
          </template>
        </Button>
      </template>
    </Alert>

    <!-- QUICK ACTIONS -->
    <Card class="p-4 flex flex-wrap items-center justify-between gap-3 bg-mustard/10 border-mustard/30">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-mustard text-charcoalDark">
          <MagnifyingGlassIcon class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-charcoalDark">Sedang Mencari Referensi atau Buku Baru?</h4>
          <p class="text-xs text-gray-600">
            Jelajahi ribuan koleksi buku fisik maupun digital perpustakaan Sitako.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          @click="router.push('/anggota/katalog')"
          class="text-xs font-semibold"
        >
          <BookOpenIcon class="w-4 h-4 mr-1.5" />
          Jelajahi Katalog
        </Button>
        <Button
          variant="secondary"
          size="sm"
          @click="router.push('/anggota/peminjaman')"
          class="text-xs font-semibold"
        >
          <ArrowUpCircleIcon class="w-4 h-4 mr-1.5" />
          Peminjaman Saya
        </Button>
      </div>
    </Card>

    <!-- GRID TRANSAKSI AKTIF & BOOKMARK -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 1. Peminjaman Aktif -->
      <Card class="p-6 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-base font-bold text-charcoalDark">Peminjaman Aktif</h3>
              <p class="text-xs text-gray-500 mt-0.5">Buku yang sedang dalam masa pinjam Anda</p>
            </div>
            <button
              type="button"
              @click="router.push('/anggota/peminjaman')"
              class="text-xs font-semibold text-mustard hover:text-mustardHover flex items-center gap-1"
            >
              Lihat Semua
              <ChevronRightIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading" class="space-y-3">
            <div v-for="n in 2" :key="n" class="animate-pulse flex gap-3 p-3 border border-gray-100 rounded-lg">
              <div class="w-14 h-20 bg-gray-200 rounded-md shrink-0"></div>
              <div class="flex-1 space-y-2 py-1">
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- List Peminjaman -->
          <div v-else-if="transaksiAktif.length > 0" class="space-y-3">
            <div
              v-for="item in transaksiAktif"
              :key="item.id"
              class="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50/80 transition-colors"
            >
              <!-- Cover Buku -->
              <div class="w-14 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
                <img
                  v-if="item.buku.cover"
                  :src="item.buku.cover"
                  :alt="item.buku.judul"
                  class="w-full h-full object-cover"
                />
                <BookOpenIcon v-else class="w-6 h-6 text-gray-400" />
              </div>

              <!-- Detail Buku & Status -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <Badge :variant="getStatusBadgeVariant(item.status)" size="sm">
                    {{ item.status }}
                  </Badge>
                </div>
                <h4 class="text-sm font-bold text-charcoalDark truncate" :title="item.buku.judul">
                  {{ item.buku.judul }}
                </h4>

                <!-- Info Due Date -->
                <div v-if="getDueInfo(item.tglKembali)" class="mt-1.5 flex items-center gap-1.5 text-xs">
                  <ClockIcon
                    class="w-4 h-4 shrink-0"
                    :class="getDueInfo(item.tglKembali)?.isOverdue ? 'text-rose-500' : 'text-gray-400'"
                  />
                  <span
                    :class="[
                      'font-medium',
                      getDueInfo(item.tglKembali)?.isOverdue
                        ? 'text-rose-600 font-semibold'
                        : getDueInfo(item.tglKembali)?.isNear
                          ? 'text-amber-600 font-semibold'
                          : 'text-gray-600',
                    ]"
                  >
                    {{ getDueInfo(item.tglKembali)?.text }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="py-10 text-center flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl"
          >
            <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <BookOpenIcon class="w-6 h-6" />
            </div>
            <p class="text-sm font-semibold text-charcoalDark">Tidak Ada Peminjaman Aktif</p>
            <p class="text-xs text-gray-500 mt-1 max-w-xs">
              Saat ini Anda tidak memiliki buku yang sedang dipinjam.
            </p>
            <Button
              variant="secondary"
              size="sm"
              class="mt-4 text-xs font-semibold"
              @click="router.push('/anggota/katalog')"
            >
              Pinjam Buku Baru
            </Button>
          </div>
        </div>
      </Card>

      <!-- 2. Bookmark Terbaru -->
      <Card class="p-6 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-base font-bold text-charcoalDark">Buku Tersimpan</h3>
              <p class="text-xs text-gray-500 mt-0.5">Daftar buku favorit yang ingin Anda baca</p>
            </div>
            <button
              type="button"
              @click="router.push('/anggota/bookmark')"
              class="text-xs font-semibold text-mustard hover:text-mustardHover flex items-center gap-1"
            >
              Lihat Semua
              <ChevronRightIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="isLoading" class="space-y-3">
            <div v-for="n in 2" :key="n" class="animate-pulse flex gap-3 p-3 border border-gray-100 rounded-lg">
              <div class="w-14 h-20 bg-gray-200 rounded-md shrink-0"></div>
              <div class="flex-1 space-y-2 py-1">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          <!-- List Bookmark -->
          <div v-else-if="bookmarkTerbaru.length > 0" class="space-y-3">
            <div
              v-for="item in bookmarkTerbaru"
              :key="item.id"
              class="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50/80 transition-colors"
            >
              <!-- Cover Buku -->
              <div class="w-14 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
                <img
                  v-if="item.buku.cover"
                  :src="item.buku.cover"
                  :alt="item.buku.judul"
                  class="w-full h-full object-cover"
                />
                <BookmarkIcon v-else class="w-6 h-6 text-gray-400" />
              </div>

              <!-- Info Buku -->
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold text-charcoalDark truncate" :title="item.buku.judul">
                  {{ item.buku.judul }}
                </h4>
                <p class="text-xs text-gray-500 mt-1">
                  Penulis: <span class="font-medium text-gray-700">{{ item.buku.penulis }}</span>
                </p>
                <button
                  type="button"
                  @click="router.push('/anggota/katalog')"
                  class="mt-2 text-xs font-semibold text-mustard hover:text-mustardHover flex items-center gap-1"
                >
                  Detail Buku <ChevronRightIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="py-10 text-center flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl"
          >
            <div class="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <BookmarkIcon class="w-6 h-6" />
            </div>
            <p class="text-sm font-semibold text-charcoalDark">Belum Ada Bookmark</p>
            <p class="text-xs text-gray-500 mt-1 max-w-xs">
              Simpan buku menarik yang Anda temukan di katalog untuk dibaca nanti.
            </p>
            <Button
              variant="secondary"
              size="sm"
              class="mt-4 text-xs font-semibold"
              @click="router.push('/anggota/katalog')"
            >
              Buka Katalog Buku
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
