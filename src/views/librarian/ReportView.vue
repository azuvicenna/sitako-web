<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  DocumentChartBarIcon,
  BanknotesIcon,
  BookOpenIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  TableCellsIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Card from '@/components/common/Card.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import type { TableColumn, PaginationMeta } from '@/types/table';
import type {
  CirculationReportItem,
  FineReportItem,
  CirculationReportResponse,
  FineReportResponse,
} from '@/types/report';

const { showToast } = useToast();

// --- STATE: TABS & FILTER TANGGAL ---
const activeTab = ref<'circulation' | 'fines'>('circulation');

// Default: 30 hari terakhir
const startDate = ref(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
const endDate = ref(dayjs().format('YYYY-MM-DD'));
const searchQuery = ref('');
const page = ref(1);
const limit = 10;

// Presets tanggal
const setDatePreset = (preset: '30days' | 'thisMonth' | 'thisYear' | 'all') => {
  page.value = 1;
  if (preset === '30days') {
    startDate.value = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    endDate.value = dayjs().format('YYYY-MM-DD');
  } else if (preset === 'thisMonth') {
    startDate.value = dayjs().startOf('month').format('YYYY-MM-DD');
    endDate.value = dayjs().endOf('month').format('YYYY-MM-DD');
  } else if (preset === 'thisYear') {
    startDate.value = dayjs().startOf('year').format('YYYY-MM-DD');
    endDate.value = dayjs().endOf('year').format('YYYY-MM-DD');
  } else if (preset === 'all') {
    startDate.value = '';
    endDate.value = '';
  }
};

// Reset page ketika tab atau filter berubah
const handleTabSwitch = (tab: 'circulation' | 'fines') => {
  activeTab.value = tab;
  page.value = 1;
  searchQuery.value = '';
};

// --- QUERIES ---
// 1. Query Laporan Sirkulasi
const {
  data: circulationData,
  isLoading: isCirculationLoading,
  refetch: refetchCirculation,
} = useQuery({
  queryKey: ['report-circulation', startDate, endDate],
  queryFn: async () => {
    const params = new URLSearchParams({ format: 'json' });
    if (startDate.value) params.append('startDate', startDate.value);
    if (endDate.value) params.append('endDate', endDate.value);

    const res = await api.get<CirculationReportResponse>(`/reports/circulation?${params}`);
    return res.data.data || [];
  },
  enabled: computed(() => activeTab.value === 'circulation'),
});

// 2. Query Laporan Denda
const {
  data: finesData,
  isLoading: isFinesLoading,
  refetch: refetchFines,
} = useQuery({
  queryKey: ['report-fines', startDate, endDate],
  queryFn: async () => {
    const params = new URLSearchParams({ format: 'json' });
    if (startDate.value) params.append('startDate', startDate.value);
    if (endDate.value) params.append('endDate', endDate.value);

    const res = await api.get<FineReportResponse>(`/reports/fines?${params}`);
    return res.data.data || [];
  },
  enabled: computed(() => activeTab.value === 'fines'),
});

// --- FILTER & PAGINASI LOKAL (PREVIEW) ---
const filteredCirculation = computed(() => {
  const items = circulationData.value || [];
  if (!searchQuery.value.trim()) return items;
  const q = searchQuery.value.toLowerCase();
  return items.filter(
    (item) =>
      item.kdTransaksi?.toLowerCase().includes(q) ||
      item.namaPeminjam?.toLowerCase().includes(q) ||
      item.judulBuku?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q),
  );
});

const paginatedCirculation = computed(() => {
  const start = (page.value - 1) * limit;
  return filteredCirculation.value.slice(start, start + limit);
});

const circulationMeta = computed<PaginationMeta>(() => {
  const totalRows = filteredCirculation.value.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  return {
    page: page.value,
    limit,
    totalRows,
    totalPages,
    hasNextPage: page.value < totalPages,
    hasPrevPage: page.value > 1,
  };
});

const filteredFines = computed(() => {
  const items = finesData.value || [];
  if (!searchQuery.value.trim()) return items;
  const q = searchQuery.value.toLowerCase();
  return items.filter(
    (item) =>
      item.namaPeminjam?.toLowerCase().includes(q) ||
      item.judulBuku?.toLowerCase().includes(q) ||
      item.metodePembayaran?.toLowerCase().includes(q) ||
      item.paymentStatus?.toLowerCase().includes(q),
  );
});

const paginatedFines = computed(() => {
  const start = (page.value - 1) * limit;
  return filteredFines.value.slice(start, start + limit);
});

const finesMeta = computed<PaginationMeta>(() => {
  const totalRows = filteredFines.value.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  return {
    page: page.value,
    limit,
    totalRows,
    totalPages,
    hasNextPage: page.value < totalPages,
    hasPrevPage: page.value > 1,
  };
});

// --- STATISTIK RINGKASAN ---
const circulationStats = computed(() => {
  const items = circulationData.value || [];
  const returned = items.filter((i) => i.status === 'Dikembalikan').length;
  const borrowed = items.filter((i) => i.status === 'Dipinjam' || i.status === 'Terlambat').length;
  return {
    total: items.length,
    returned,
    borrowed,
  };
});

const finesStats = computed(() => {
  const items = finesData.value || [];
  const totalNominal = items.reduce((acc, curr) => acc + (Number(curr.totalDenda) || 0), 0);
  const paidCount = items.filter(
    (i) => i.paymentStatus === 'PAID' || i.paymentStatus === 'SETTLED',
  ).length;
  return {
    totalTransactions: items.length,
    totalNominal,
    paidCount,
  };
});

// --- EKSPOR DOKUMEN ---
const isExporting = ref(false);
const exportingFormat = ref<'csv' | 'xlsx' | 'pdf' | null>(null);

const downloadReport = async (format: 'csv' | 'xlsx' | 'pdf') => {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    showToast('danger', 'Tanggal awal tidak boleh lebih besar dari tanggal akhir');
    return;
  }

  isExporting.value = true;
  exportingFormat.value = format;

  try {
    const endpoint = activeTab.value === 'circulation' ? '/reports/circulation' : '/reports/fines';
    const params = new URLSearchParams({ format });
    if (startDate.value) params.append('startDate', startDate.value);
    if (endDate.value) params.append('endDate', endDate.value);

    const res = await api.get(`${endpoint}?${params}`, {
      responseType: 'blob',
    });

    // Ambil nama file dari Content-Disposition jika tersedia
    const defaultPrefix = activeTab.value === 'circulation' ? 'laporan-sirkulasi' : 'laporan-denda';
    let filename = `${defaultPrefix}-${dayjs().format('YYYY-MM-DD')}.${format}`;
    const disposition = res.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        filename = match[1];
      }
    }

    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast('success', `Laporan format ${format.toUpperCase()} berhasil diunduh!`);
  } catch (error: unknown) {
    showToast(
      'danger',
      getErrorMessage(error, 'Gagal mengunduh berkas laporan. Silakan coba lagi.'),
    );
  } finally {
    isExporting.value = false;
    exportingFormat.value = null;
  }
};

// --- TABEL COLUMNS ---
const circulationColumns: TableColumn<CirculationReportItem>[] = [
  { key: 'kdTransaksi', label: 'Kode Transaksi' },
  { key: 'namaPeminjam', label: 'Nama Peminjam' },
  { key: 'judulBuku', label: 'Judul Buku' },
  { key: 'tglPinjam', label: 'Tgl Pinjam' },
  { key: 'tglKembali', label: 'Tgl Kembali' },
  { key: 'status', label: 'Status' },
];

const fineColumns: TableColumn<FineReportItem>[] = [
  { key: 'namaPeminjam', label: 'Nama Peminjam' },
  { key: 'judulBuku', label: 'Judul Buku' },
  { key: 'totalDenda', label: 'Total Denda' },
  { key: 'metodePembayaran', label: 'Metode Bayar' },
  { key: 'paymentStatus', label: 'Status Bayar' },
  { key: 'tglBayar', label: 'Tgl Bayar' },
];

// Helper Status Badge
const getStatusBadge = (status: string): { label: string; variant: BadgeVariant } => {
  switch (status) {
    case 'Dikembalikan':
      return { label: 'Dikembalikan', variant: 'success' };
    case 'Dipinjam':
      return { label: 'Dipinjam', variant: 'info' };
    case 'Terlambat':
      return { label: 'Terlambat', variant: 'danger' };
    case 'Menunggu Persetujuan':
      return { label: 'Menunggu', variant: 'warning' };
    case 'Ditolak':
      return { label: 'Ditolak', variant: 'neutral' };
    default:
      return { label: status, variant: 'neutral' };
  }
};

const getPaymentBadge = (status: string): { label: string; variant: BadgeVariant } => {
  switch (status) {
    case 'PAID':
    case 'SETTLED':
      return { label: 'Lunas', variant: 'success' };
    case 'PENDING':
      return { label: 'Pending', variant: 'warning' };
    case 'UNPAID':
      return { label: 'Belum Lunas', variant: 'danger' };
    case 'EXPIRED':
      return { label: 'Kedaluwarsa', variant: 'neutral' };
    default:
      return { label: status, variant: 'neutral' };
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
          <DocumentChartBarIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Cetak & Ekspor Laporan</h1>
          <p class="text-sm text-gray-500 mt-1">
            Rekapitulasi sirkulasi buku dan penerimaan denda perpustakaan untuk pelaporan berkala.
          </p>
        </div>
      </div>

      <!-- EXPORT ACTIONS GROUP -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Unduh Excel -->
        <Button
          variant="secondary"
          class="border-emerald-600! text-emerald-700! hover:bg-emerald-50! focus:ring-emerald-500! text-sm font-medium"
          :loading="isExporting && exportingFormat === 'xlsx'"
          :disabled="isExporting"
          @click="downloadReport('xlsx')"
        >
          <TableCellsIcon class="w-4 h-4 mr-1.5 text-emerald-600" />
          Ekspor Excel (.xlsx)
        </Button>

        <!-- Unduh CSV -->
        <Button
          variant="secondary"
          class="text-sm font-medium"
          :loading="isExporting && exportingFormat === 'csv'"
          :disabled="isExporting"
          @click="downloadReport('csv')"
        >
          <DocumentArrowDownIcon class="w-4 h-4 mr-1.5" />
          Ekspor CSV (.csv)
        </Button>

        <!-- Unduh PDF -->
        <Button
          variant="primary"
          class="bg-rose-600! hover:bg-rose-700! focus:ring-rose-500! text-white! text-sm font-medium shadow-sm"
          :loading="isExporting && exportingFormat === 'pdf'"
          :disabled="isExporting"
          @click="downloadReport('pdf')"
        >
          <PrinterIcon class="w-4 h-4 mr-1.5" />
          Cetak PDF (.pdf)
        </Button>
      </div>
    </div>

    <!-- TAB SWITCHER -->
    <div class="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none">
      <button
        type="button"
        @click="handleTabSwitch('circulation')"
        :class="[
          'flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm border-b-2 transition-colors duration-150 cursor-pointer shrink-0',
          activeTab === 'circulation'
            ? 'border-mustard text-charcoal'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        ]"
      >
        <BookOpenIcon class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Laporan Sirkulasi Peminjaman</span>
        <span
          class="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-semibold"
        >
          {{ circulationData?.length || 0 }}
        </span>
      </button>

      <button
        type="button"
        @click="handleTabSwitch('fines')"
        :class="[
          'flex items-center gap-2 py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm border-b-2 transition-colors duration-150 cursor-pointer shrink-0',
          activeTab === 'fines'
            ? 'border-mustard text-charcoal'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        ]"
      >
        <BanknotesIcon class="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Laporan Pembayaran Denda</span>
        <span
          class="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-semibold"
        >
          {{ finesData?.length || 0 }}
        </span>
      </button>
    </div>

    <!-- FILTER PERIODE & PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <!-- Tanggal Filter Controls -->
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1"> Tanggal Awal </label>
            <input
              type="date"
              v-model="startDate"
              class="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
              @change="page = 1"
            />
          </div>

          <span class="text-gray-400 pb-2.5 font-medium">s/d</span>

          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1"> Tanggal Akhir </label>
            <input
              type="date"
              v-model="endDate"
              class="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
              @change="page = 1"
            />
          </div>

          <!-- Quick Presets -->
          <div class="flex items-center gap-1.5 pb-0.5">
            <button
              type="button"
              @click="setDatePreset('30days')"
              class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              30 Hari Terakhir
            </button>
            <button
              type="button"
              @click="setDatePreset('thisMonth')"
              class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              @click="setDatePreset('thisYear')"
              class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Tahun Ini
            </button>
            <button
              type="button"
              @click="setDatePreset('all')"
              class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Semua
            </button>
          </div>

          <!-- Refresh Button -->
          <button
            type="button"
            @click="activeTab === 'circulation' ? refetchCirculation() : refetchFines()"
            title="Muat Ulang Data"
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            <ArrowPathIcon
              class="w-5 h-5"
              :class="{
                'animate-spin': activeTab === 'circulation' ? isCirculationLoading : isFinesLoading,
              }"
            />
          </button>
        </div>

        <!-- Filter Pencarian Cepat Pada Tabel Preview -->
        <div class="w-full lg:w-72">
          <Input
            v-model="searchQuery"
            placeholder="Cari pada preview..."
            class="w-full"
            @input="page = 1"
          >
            <template #prefix>
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
            </template>
          </Input>
        </div>
      </div>
    </Card>

    <!-- STATISTIK RINGKASAN PERIODE -->
    <!-- Tab Sirkulasi Stats -->
    <div v-if="activeTab === 'circulation'" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="p-4 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-blue-50 text-blue-600">
          <BookOpenIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Total Transaksi</p>
          <h3 class="text-2xl font-bold text-gray-900 mt-0.5">
            {{ circulationStats.total }}
          </h3>
        </div>
      </Card>

      <Card class="p-4 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-amber-50 text-amber-600">
          <ClockIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Sedang Dipinjam / Terlambat</p>
          <h3 class="text-2xl font-bold text-amber-700 mt-0.5">
            {{ circulationStats.borrowed }}
          </h3>
        </div>
      </Card>

      <Card class="p-4 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircleIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Buku Dikembalikan</p>
          <h3 class="text-2xl font-bold text-emerald-700 mt-0.5">
            {{ circulationStats.returned }}
          </h3>
        </div>
      </Card>
    </div>

    <!-- Tab Denda Stats -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="p-4 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-emerald-50 text-emerald-600">
          <BanknotesIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Total Nilai Denda</p>
          <h3 class="text-2xl font-bold text-emerald-700 mt-0.5">
            {{ formatRupiah(finesStats.totalNominal) }}
          </h3>
        </div>
      </Card>

      <Card class="p-4 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-blue-50 text-blue-600">
          <DocumentChartBarIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Jumlah Transaksi Denda</p>
          <h3 class="text-2xl font-bold text-gray-900 mt-0.5">
            {{ finesStats.totalTransactions }}
          </h3>
        </div>
      </Card>

      <Card class="p-4 flex items-center gap-4">
        <div class="p-3 rounded-xl bg-purple-50 text-purple-600">
          <CheckCircleIcon class="w-6 h-6" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Denda Terbayar (Lunas)</p>
          <h3 class="text-2xl font-bold text-purple-700 mt-0.5">
            {{ finesStats.paidCount }} Transaksi
          </h3>
        </div>
      </Card>
    </div>

    <!-- TABEL PREVIEW: SIRKULASI -->
    <div v-if="activeTab === 'circulation'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900">Preview Data Sirkulasi Peminjaman</h2>
        <span class="text-xs text-gray-500">
          Menampilkan {{ filteredCirculation.length }} baris data
        </span>
      </div>

      <Table
        :columns="circulationColumns"
        :items="paginatedCirculation"
        :meta="circulationMeta"
        :loading="isCirculationLoading"
        empty-message="Tidak ada data transaksi sirkulasi untuk rentang tanggal ini"
        @change-page="(p) => (page = p)"
      >
        <template #cell-kdTransaksi="{ item }">
          <span class="font-mono font-semibold text-xs text-gray-800">
            {{ item.kdTransaksi }}
          </span>
        </template>

        <template #cell-namaPeminjam="{ item }">
          <span class="font-medium text-gray-900">{{ item.namaPeminjam }}</span>
        </template>

        <template #cell-judulBuku="{ item }">
          <span class="text-gray-800 line-clamp-1 max-w-xs">{{ item.judulBuku }}</span>
        </template>

        <template #cell-tglPinjam="{ item }">
          <span class="text-xs text-gray-600">
            {{ dayjs(item.tglPinjam).format('DD MMM YYYY, HH:mm') }}
          </span>
        </template>

        <template #cell-tglKembali="{ item }">
          <span v-if="item.tglKembali" class="text-xs text-gray-600">
            {{ dayjs(item.tglKembali).format('DD MMM YYYY, HH:mm') }}
          </span>
          <span v-else class="text-xs text-gray-400 italic">Belum kembali</span>
        </template>

        <template #cell-status="{ item }">
          <Badge :variant="getStatusBadge(item.status).variant">
            {{ getStatusBadge(item.status).label }}
          </Badge>
        </template>
      </Table>
    </div>

    <!-- TABEL PREVIEW: DENDA -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900">Preview Data Pembayaran Denda</h2>
        <span class="text-xs text-gray-500">
          Menampilkan {{ filteredFines.length }} baris data
        </span>
      </div>

      <Table
        :columns="fineColumns"
        :items="paginatedFines"
        :meta="finesMeta"
        :loading="isFinesLoading"
        empty-message="Tidak ada data pembayaran denda untuk rentang tanggal ini"
        @change-page="(p) => (page = p)"
      >
        <template #cell-namaPeminjam="{ item }">
          <span class="font-medium text-gray-900">{{ item.namaPeminjam }}</span>
        </template>

        <template #cell-judulBuku="{ item }">
          <span class="text-gray-800 line-clamp-1 max-w-xs">{{ item.judulBuku }}</span>
        </template>

        <template #cell-totalDenda="{ item }">
          <span class="font-semibold text-emerald-700">
            {{ formatRupiah(item.totalDenda) }}
          </span>
        </template>

        <template #cell-metodePembayaran="{ item }">
          <span
            class="px-2 py-0.5 text-xs font-semibold rounded"
            :class="
              item.metodePembayaran === 'Tunai'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-800'
            "
          >
            {{ item.metodePembayaran }}
          </span>
        </template>

        <template #cell-paymentStatus="{ item }">
          <Badge :variant="getPaymentBadge(item.paymentStatus).variant">
            {{ getPaymentBadge(item.paymentStatus).label }}
          </Badge>
        </template>

        <template #cell-tglBayar="{ item }">
          <span v-if="item.tglBayar" class="text-xs text-gray-600">
            {{ dayjs(item.tglBayar).format('DD MMM YYYY, HH:mm') }}
          </span>
          <span v-else class="text-xs text-gray-400 italic">-</span>
        </template>
      </Table>
    </div>
  </div>
</template>
