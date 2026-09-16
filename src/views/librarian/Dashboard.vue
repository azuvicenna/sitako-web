<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  BookmarkIcon,
  UserGroupIcon,
  ArrowUpCircleIcon,
  ExclamationCircleIcon,
  QrCodeIcon,
  PlusCircleIcon,
  ArrowRightCircleIcon,
  BookOpenIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import { ShieldCheckIcon } from '@heroicons/vue/24/solid';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Card from '@/components/common/Card.vue';
import AccentCard from '@/components/common/AccentCard.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';
import type { TableColumn } from '@/types/table';
import type {
  DashboardSummaryResponse,
  TodayTransactionItem,
  TodayTransactionResponse,
  TodayTransactionSummary,
  WeeklyStatisticsResponse,
} from '@/types/dashboard';

const router = useRouter();
const authStore = useAuthStore();
const queryClient = useQueryClient();

const barcodeInput = ref('');
const todayDate = dayjs().format('YYYY-MM-DD');

// --- 1. QUERY RINGKASAN UTAMA (SUMMARY CARDS) ---
const {
  data: summaryData,
  isLoading: isSummaryLoading,
  isFetching: isSummaryFetching,
} = useQuery({
  queryKey: ['dashboard-summary'],
  queryFn: async () => {
    const res = await api.get<DashboardSummaryResponse>('/dashboard/summary');
    return res.data;
  },
});

// --- 2. QUERY TRANSAKSI HARI INI ---
const currentStatus = ref('Semua');
const currentPage = ref(1);

const {
  data: todayTrxData,
  isLoading: isTrxLoading,
  isFetching: isTrxFetching,
} = useQuery({
  queryKey: ['dashboard-today-transactions', currentStatus, currentPage],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '10',
      ...(currentStatus.value !== 'Semua' && { status: currentStatus.value }),
    });

    const res = await api.get<TodayTransactionResponse>(`/dashboard/transaction/today?${params}`);
    return res.data;
  },
});

const transactions = computed<TodayTransactionItem[]>(() => todayTrxData.value?.data || []);
const meta = computed(() => todayTrxData.value?.meta || null);
const summary = computed<TodayTransactionSummary>(
  () =>
    todayTrxData.value?.summary || {
      semua: 0,
      menungguPersetujuan: 0,
      dibatalkan: 0,
      menungguDiambil: 0,
      dipinjam: 0,
      dikembalikan: 0,
      terlambat: 0,
      tidakMengembalikan: 0,
    },
);

// --- 3. QUERY STATISTIK MINGGUAN ---
const {
  data: weeklyStatsData,
  isLoading: isStatsLoading,
  isFetching: isStatsFetching,
} = useQuery({
  queryKey: ['dashboard-weekly-statistics'],
  queryFn: async () => {
    const res = await api.get<WeeklyStatisticsResponse>('/dashboard/statistics');
    return res.data;
  },
});

const weeklyStats = computed(() => weeklyStatsData.value?.statistik || []);
const weeklyAverage = computed(() => weeklyStatsData.value?.rataRata ?? 0);
const maxWeeklyTotal = computed(() => {
  const totals = weeklyStats.value.map((s) => s.total);
  return Math.max(...totals, 1);
});

// Refetch semua data dashboard
const isRefreshingAll = computed(
  () => isSummaryFetching.value || isTrxFetching.value || isStatsFetching.value,
);

const refreshAllDashboard = () => {
  queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-today-transactions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-weekly-statistics'] });
};

// --- QUICK ACTIONS & ROUTING ---
const handleQuickBorrow = () => {
  router.push('/pustakawan/peminjaman');
};

const handleQuickReturn = () => {
  router.push('/pustakawan/pengembalian');
};

const handleAddBook = () => {
  router.push('/pustakawan/buku');
};

const handleBarcodeInput = () => {
  const query = barcodeInput.value.trim();
  if (!query) return;

  if (query.toUpperCase().startsWith('TRX-')) {
    router.push({ path: '/pustakawan/peminjaman', query: { search: query } });
  } else {
    router.push({ path: '/pustakawan/buku', query: { search: query } });
  }
};

// --- TABEL COLUMNS & FILTER ---
const columns: TableColumn<TodayTransactionItem>[] = [
  { key: 'kdTransaksi', label: 'ID Pinjam' },
  { key: 'namaAnggota', label: 'Anggota' },
  { key: 'judulBuku', label: 'Judul Buku' },
  { key: 'tglPinjam', label: 'Tgl Pinjam' },
  { key: 'tglKembali', label: 'Batas Kembali' },
  { key: 'status', label: 'Status', align: 'center' },
];

const setStatusFilter = (status: string) => {
  currentStatus.value = status;
  currentPage.value = 1;
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dipinjam':
      return 'warning';
    case 'Dikembalikan':
      return 'success';
    case 'Terlambat':
      return 'danger';
    case 'Menunggu Persetujuan':
      return 'warning';
    case 'Menunggu Diambil':
      return 'info';
    case 'Dibatalkan':
    case 'Tidak Mengembalikan':
      return 'danger';
    default:
      return 'neutral';
  }
};
</script>

<template>
  <div>
    <!-- HEADER -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">
          Selamat Datang, {{ authStore.user?.nama || 'Pustakawan' }} 👋
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Pusat sirkulasi utama, pemantauan transaksi, dan ringkasan aktivitas perpustakaan.
        </p>
      </div>

      <!-- Tombol Refresh -->
      <Button
        variant="secondary"
        size="sm"
        :loading="isRefreshingAll"
        @click="refreshAllDashboard"
        class="self-start sm:self-auto text-xs font-semibold text-gray-600"
      >
        <ArrowPathIcon class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isRefreshingAll }" />
        Segarkan Data
      </Button>
    </div>

    <!-- STATS SUMMARY CARDS (DYNAMIC) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total Koleksi Buku -->
      <AccentCard accent-color="border-t-mustard">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Koleksi Buku
          </p>
          <BookmarkIcon class="w-5 h-5 text-charcoal" />
        </div>
        <div v-if="isSummaryLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else>
          <h3 class="text-3xl font-bold text-charcoalDark">
            {{ summaryData?.buku.fisik ?? 0 }}
            <span class="text-xl text-gray-400 font-medium">
              / {{ summaryData?.buku.digital ?? 0 }}
            </span>
          </h3>
          <p class="text-xs text-gray-500 mt-4">Koleksi Fisik / Digital Aktif</p>
        </div>
      </AccentCard>

      <!-- Total Anggota Aktif -->
      <AccentCard accent-color="border-t-sky-500">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Anggota Aktif
          </p>
          <UserGroupIcon class="w-5 h-5 text-sky-600" />
        </div>
        <div v-if="isSummaryLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else>
          <h3 class="text-3xl font-bold text-charcoalDark">
            {{ summaryData?.anggotaAktif ?? 0 }}
          </h3>
          <p class="text-xs text-gray-500 mt-4">Siswa & Civitas Terdaftar Aktif</p>
        </div>
      </AccentCard>

      <!-- Total Buku Dipinjam -->
      <AccentCard accent-color="border-t-amber-500">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Buku Dipinjam
          </p>
          <ArrowUpCircleIcon class="w-5 h-5 text-amber-600" />
        </div>
        <div v-if="isSummaryLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else>
          <h3 class="text-3xl font-bold text-charcoalDark">
            {{ summaryData?.bukuDipinjam ?? 0 }}
          </h3>
          <p class="text-xs text-gray-500 mt-4">Eksemplar Sedang di Tangan Peminjam</p>
        </div>
      </AccentCard>

      <!-- Total Jatuh Tempo -->
      <AccentCard accent-color="border-t-rose-500">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Jatuh Tempo
          </p>
          <ExclamationCircleIcon class="w-5 h-5 text-rose-600" />
        </div>
        <div v-if="isSummaryLoading" class="animate-pulse py-2">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div v-else>
          <h3 class="text-3xl font-bold text-rose-600">
            {{ summaryData?.jatuhTempo ?? 0 }}
          </h3>
          <p class="text-xs text-gray-500 mt-4">Peminjaman Melebihi Batas Waktu</p>
        </div>
      </AccentCard>
    </div>

    <!-- QUICK ACTION BAR -->
    <Card class="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
      <div class="flex-1 flex gap-2">
        <Input
          v-model="barcodeInput"
          :icon="QrCodeIcon"
          placeholder="Cari Kode Transaksi (TRX-...), NIS, atau Judul Buku..."
          class="w-full"
          @keyup.enter="handleBarcodeInput"
        />
        <Button variant="dark" class="shrink-0" @click="handleBarcodeInput"> Cari </Button>
      </div>
      <div class="flex flex-wrap items-center gap-2.5 shrink-0">
        <Button variant="primary" :icon="PlusCircleIcon" @click="handleQuickBorrow">
          Proses Pinjam
        </Button>
        <Button variant="secondary" :icon="ArrowRightCircleIcon" @click="handleQuickReturn">
          Kembalikan Cepat
        </Button>
        <Button variant="secondary" :icon="BookOpenIcon" @click="handleAddBook">
          Kelola Buku
        </Button>
      </div>
    </Card>

    <!-- DATA TABLE & CHART -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- TABLE: TRANSAKSI HARI INI (COL SPAN 2) -->
      <div class="lg:col-span-2 flex flex-col">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <h3 class="text-lg font-bold text-charcoalDark leading-tight">
              Transaksi Sirkulasi Hari Ini
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">
              Daftar aktivitas peminjaman dan pengembalian yang tercatat hari ini
            </p>
          </div>

          <!-- Status Filter Tabs -->
          <div
            class="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg shadow-sm overflow-x-auto"
          >
            <button
              type="button"
              @click="setStatusFilter('Semua')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer whitespace-nowrap',
                currentStatus === 'Semua'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Semua<br />
              <span class="font-normal text-[11px]">({{ summary.semua }})</span>
            </button>

            <button
              type="button"
              @click="setStatusFilter('Dipinjam')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer whitespace-nowrap',
                currentStatus === 'Dipinjam'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Dipinjam<br />
              <span class="font-normal text-[11px]">({{ summary.dipinjam }})</span>
            </button>

            <button
              type="button"
              @click="setStatusFilter('Terlambat')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer whitespace-nowrap',
                currentStatus === 'Terlambat'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Lewat Tempo<br />
              <span class="font-normal text-[11px]">({{ summary.terlambat }})</span>
            </button>

            <button
              type="button"
              @click="setStatusFilter('Dikembalikan')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer whitespace-nowrap',
                currentStatus === 'Dikembalikan'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Selesai<br />
              <span class="font-normal text-[11px]">({{ summary.dikembalikan }})</span>
            </button>

            <span
              class="px-2.5 py-1 text-xs font-medium text-gray-400 border-l border-gray-200 ml-1 text-center whitespace-nowrap"
            >
              {{ meta?.totalRows ?? 0 }}<br />entri
            </span>
          </div>
        </div>

        <!-- Tabel Komponen -->
        <Table
          :columns="columns"
          :items="transactions"
          :meta="meta"
          :loading="isTrxLoading"
          empty-message="Belum ada transaksi sirkulasi untuk kategori ini hari ini"
          @change-page="handlePageChange"
        >
          <template #cell-kdTransaksi="{ item }">
            <span class="font-mono font-bold text-xs text-charcoalDark">
              {{ item.kdTransaksi }}
            </span>
          </template>

          <template #cell-namaAnggota="{ item }">
            <span class="font-medium text-xs text-gray-900">
              {{ item.namaAnggota || item.anggotaId || '-' }}
            </span>
          </template>

          <template #cell-judulBuku="{ item }">
            <span
              class="text-xs text-gray-800 line-clamp-1 max-w-[200px]"
              :title="item.judulBuku || item.bukuId"
            >
              {{ item.judulBuku || item.bukuId || '-' }}
            </span>
          </template>

          <template #cell-tglPinjam="{ item }">
            <span class="text-xs text-gray-600">
              {{ item.tglPinjam ? dayjs(item.tglPinjam).format('DD/MM/YYYY') : '-' }}
            </span>
          </template>

          <template #cell-tglKembali="{ item }">
            <span
              :class="[
                'text-xs font-medium',
                dayjs().isAfter(dayjs(item.tglKembali)) && item.status === 'Dipinjam'
                  ? 'text-rose-600 font-semibold'
                  : 'text-gray-700',
              ]"
            >
              {{ item.tglKembali ? dayjs(item.tglKembali).format('DD/MM/YYYY') : '-' }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <Badge :variant="getStatusBadgeVariant(item.status)">
              {{ item.status || '-' }}
            </Badge>
          </template>
        </Table>
      </div>

      <!-- CHART: STATISTIK MINGGUAN (COL SPAN 1) -->
      <Card class="lg:col-span-1 p-6 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="text-lg font-bold text-charcoalDark">Statistik Peminjaman</h3>
              <p class="text-xs text-gray-500 mt-1">Aktivitas 7 Hari Terakhir</p>
            </div>
            <span
              class="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full"
            >
              7 Hari
            </span>
          </div>

          <!-- SKELETON LOADING -->
          <div v-if="isStatsLoading" class="h-44 flex items-end justify-between gap-2 px-2 pb-4">
            <div
              v-for="n in 7"
              :key="n"
              class="w-full bg-gray-200 rounded-t animate-pulse"
              :style="{ height: `${20 + n * 10}%` }"
            ></div>
          </div>

          <!-- DYNAMIC BAR CHART -->
          <div v-else class="h-48 flex flex-col justify-end border-b border-gray-100 pb-3 mb-4">
            <div class="h-36 flex items-end justify-between gap-2 px-1">
              <div
                v-for="item in weeklyStats"
                :key="item.tanggal"
                class="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                <!-- Tooltip hover -->
                <div
                  class="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-charcoalDark text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-10"
                >
                  {{ item.total }} Buku
                </div>

                <!-- Nilai baris atas -->
                <span class="text-[10px] font-bold text-gray-400 mb-1">
                  {{ item.total }}
                </span>

                <!-- Bar Column -->
                <div
                  class="w-full rounded-t-md transition-all duration-300"
                  :class="[
                    item.tanggal === todayDate
                      ? 'bg-mustard hover:bg-mustardHover shadow-sm'
                      : 'bg-charcoal/70 hover:bg-charcoal',
                  ]"
                  :style="{
                    height: `${Math.max(8, Math.round((item.total / maxWeeklyTotal) * 100))}%`,
                  }"
                ></div>

                <!-- Hari Label -->
                <div class="mt-2 text-center">
                  <span
                    :class="[
                      'text-[10px] block uppercase font-bold tracking-tight',
                      item.tanggal === todayDate ? 'text-mustard font-extrabold' : 'text-gray-500',
                    ]"
                  >
                    {{ item.hari.slice(0, 3) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INFO RATA-RATA HARIAN -->
        <div class="bg-gray-50 border border-gray-200 p-4 rounded-xl">
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-500">Rata-rata Harian</p>
            <span class="text-sm font-bold text-charcoalDark">
              {{ weeklyAverage }} <span class="text-xs font-normal text-gray-500">buku/hari</span>
            </span>
          </div>
        </div>
      </Card>
    </div>

    <!-- ALERT INFO REGULASI -->
    <Alert
      :icon="ShieldCheckIcon"
      title="Regulasi Sirkulasi Perpustakaan"
      description="Peminjaman anggota siswa maksimal 3 eksemplar buku fisik dalam periode 7 hari kerja. Keterlambatan pengembalian akan dikenakan tarif denda sesuai aturan yang aktif."
    />
  </div>
</template>
