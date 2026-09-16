<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  ArrowDownCircleIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  UserIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import ReturningModal from './components/ReturningModal.vue';
import { api } from '@/utils/axios';
import { getStatusBadgeVariant } from '@/utils/transaction';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import type { TableColumn } from '@/types/table';
import type { Transaction, TransactionStatus, TransactionListResponse } from '@/types/transaction';

// --- STATE: FILTER & TABLE ---
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const statusFilter = ref<TransactionStatus | 'Semua'>('Dipinjam');

const handleStatusFilter = (status: TransactionStatus | 'Semua') => {
  statusFilter.value = status;
  page.value = 1;
};

const { data: transactionsResponse, isLoading } = useQuery({
  queryKey: ['librarian-returning', page, statusFilter, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      status: statusFilter.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<TransactionListResponse>(`/transactions/?${params}`);
    return res.data;
  },
});

const transactions = computed<Transaction[]>(() => transactionsResponse.value?.data || []);
const meta = computed(() => transactionsResponse.value?.meta || null);

// Data transaksi aktif untuk dropdown form pengembalian cepat
const { data: activeBorrowingsResponse } = useQuery({
  queryKey: ['active-borrowings-dropdown'],
  queryFn: async () => {
    const res = await api.get<TransactionListResponse>('/transactions/?status=Dipinjam&limit=100');
    return res.data;
  },
});
const activeBorrowings = computed<Transaction[]>(() => activeBorrowingsResponse.value?.data || []);

const columns: TableColumn<Transaction>[] = [
  { key: 'transaksi', label: 'Transaksi & Buku' },
  { key: 'anggota', label: 'Peminjam' },
  { key: 'batasKembali', label: 'Jatuh Tempo Pengembalian' },
  { key: 'status', label: 'Status Saat Ini', align: 'center', width: 'w-36' },
  { key: 'keterangan', label: 'Status Fisik & Waktu' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-36' },
];

// --- MODAL STATE ---
const isReturnModalOpen = ref(false);
const selectedTransaction = ref<Transaction | null>(null);

const openReturnModal = (trx?: Transaction) => {
  selectedTransaction.value = trx || null;
  isReturnModalOpen.value = true;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Daftar Pengembalian</h2>
        <p class="text-sm text-gray-500 mt-1">
          Pemeriksaan fisik pengembalian buku, konfirmasi status tepat waktu, dan verifikasi denda
        </p>
      </div>
      <Button
        variant="primary"
        :icon="ArrowDownCircleIcon"
        @click="() => openReturnModal()"
        class="shrink-0"
      >
        Proses Pengembalian
      </Button>
    </div>

    <!-- Toolbar: Filter Status Pills & Search -->
    <div
      class="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Filter Pills -->
      <div class="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          type="button"
          @click="handleStatusFilter('Semua')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Semua'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Semua
        </button>
        <button
          type="button"
          @click="handleStatusFilter('Dipinjam')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Dipinjam'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Menunggu Kembali
        </button>
        <button
          type="button"
          @click="handleStatusFilter('Terlambat')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Terlambat'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Lewat Tempo
        </button>
        <button
          type="button"
          @click="handleStatusFilter('Dikembalikan')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Dikembalikan'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Selesai Kembali
        </button>
        <button
          type="button"
          @click="handleStatusFilter('Tidak Mengembalikan')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Tidak Mengembalikan'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Buku Hilang
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari kode transaksi, buku, atau peminjam..."
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total:
        <span class="text-charcoalDark font-bold">{{
          meta?.totalRows ?? transactions.length
        }}</span>
        Transaksi
      </div>
    </div>

    <!-- Tabel Data Pengembalian -->
    <Table
      :columns="columns"
      :items="transactions"
      :meta="meta"
      :loading="isLoading"
      empty-message="Tidak ada data pengembalian dengan status ini."
      @change-page="handlePageChange"
    >
      <!-- Cell Transaksi & Buku -->
      <template #cell-transaksi="{ item }">
        <div class="space-y-0.5">
          <span class="font-bold text-xs text-charcoalDark block leading-snug">
            {{ item.kdTransaksi }}
          </span>
          <div class="flex items-center gap-1.5 text-xs text-gray-600">
            <BookOpenIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="font-semibold text-charcoalDark truncate max-w-50">{{
              item.judulBuku || item.bukuId
            }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Anggota -->
      <template #cell-anggota="{ item }">
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 text-xs font-bold"
          >
            <UserIcon class="w-4 h-4" />
          </div>
          <div>
            <p class="font-semibold text-charcoalDark text-xs leading-tight">
              {{ item.namaAnggota || item.anggotaId }}
            </p>
          </div>
        </div>
      </template>

      <!-- Cell Batas Jatuh Tempo -->
      <template #cell-batasKembali="{ item }">
        <div class="text-xs space-y-0.5">
          <div class="flex items-center gap-1.5">
            <ClockIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="font-semibold text-charcoalDark">
              {{ dayjs(item.tglKembali).format('DD MMM YYYY') }}
            </span>
          </div>
          <span class="text-[10px] text-gray-400">
            Pinjam: {{ dayjs(item.tglPinjam).format('DD/MM/YYYY') }}
          </span>
        </div>
      </template>

      <!-- Cell Status -->
      <template #cell-status="{ item }">
        <Badge :variant="getStatusBadgeVariant(item.status)">
          {{ item.status }}
        </Badge>
      </template>

      <!-- Cell Keterangan Keterlambatan / Fisik -->
      <template #cell-keterangan="{ item }">
        <div
          v-if="item.status === 'Dikembalikan'"
          class="flex items-center gap-1 text-xs text-green-700 font-semibold"
        >
          <CheckBadgeIcon class="w-4 h-4" />
          <span>Selesai Dikembalikan</span>
        </div>
        <div
          v-else-if="item.status === 'Tidak Mengembalikan'"
          class="flex items-center gap-1 text-xs text-red-600 font-semibold"
        >
          <ExclamationTriangleIcon class="w-4 h-4" />
          <span>Buku Hilang / Rusak</span>
        </div>
        <div v-else>
          <span
            v-if="dayjs().isAfter(dayjs(item.tglKembali), 'day')"
            class="text-xs text-red-600 font-bold block"
          >
            Lewat {{ dayjs().diff(dayjs(item.tglKembali), 'day') }} Hari
          </span>
          <span v-else class="text-xs text-gray-500">
            Sisa {{ dayjs(item.tglKembali).diff(dayjs(), 'day') }} hari
          </span>
        </div>
      </template>

      <!-- Cell Aksi -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-2">
          <!-- Tombol Terima Pengembalian jika belum selesai -->
          <button
            v-if="item.status === 'Dipinjam' || item.status === 'Terlambat'"
            type="button"
            @click="openReturnModal(item)"
            class="px-2.5 py-1 text-xs font-bold bg-mustard hover:bg-mustardHover text-charcoalDark rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowDownCircleIcon class="w-4 h-4" />
            <span>Terima Kembali</span>
          </button>

          <span v-else class="text-[11px] text-gray-400 italic"> Tuntas </span>
        </div>
      </template>
    </Table>

    <!-- MODAL PROSES PENGEMBALIAN BUKU -->
    <ReturningModal
      v-model="isReturnModalOpen"
      :initial-transaction="selectedTransaction"
      :active-borrowings="activeBorrowings"
    />
  </div>
</template>
