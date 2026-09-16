<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  ArrowUpCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import Card from '@/components/common/Card.vue';
import Table from '@/components/tables/Table.vue';
import BorrowingRequestModal from './components/BorrowingRequestModal.vue';
import BorrowingReturnModal from './components/BorrowingReturnModal.vue';
import BorrowingDetailModal from './components/BorrowingDetailModal.vue';
import { api } from '@/utils/axios';
import { getStatusBadgeVariant } from '@/utils/transaction';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import type { TableColumn, PaginationMeta } from '@/types/table';
import type {
  MemberTransactionItem,
  MemberTransactionListResponse,
} from '@/types/member-transaction';
import type { CatalogListResponse, CatalogBookItem } from '@/types/member-catalog';
import type { LibrarianListResponse } from '@/types/user';
import type { LibrarianUser } from '@/types/auth';

const route = useRoute();

// --- STATE: FILTER & TABLE ---
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const statusFilter = ref<string>('Semua');

const handleStatusFilter = (status: string) => {
  statusFilter.value = status;
  page.value = 1;
};

// --- QUERY DAFTAR TRANSAKSI ---
const {
  data: transactionsResponse,
  isLoading,
  isFetching,
  refetch,
} = useQuery({
  queryKey: ['member-transactions', page, statusFilter, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      status: statusFilter.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<MemberTransactionListResponse>(`/member/transactions/?${params}`);
    return res.data;
  },
});

const transactions = computed<MemberTransactionItem[]>(
  () => transactionsResponse.value?.data || [],
);
const meta = computed<PaginationMeta | null>(() => transactionsResponse.value?.meta || null);

// --- QUERY DROPDOWN BUKU FISIK ---
const { data: physicalBooksResponse } = useQuery({
  queryKey: ['member-dropdown-physical-books'],
  queryFn: async () => {
    const res = await api.get<CatalogListResponse>('/book?bookType=Fisik&limit=100');
    return res.data.data || [];
  },
});
const availableBooks = computed<CatalogBookItem[]>(() => physicalBooksResponse.value || []);

// --- QUERY DROPDOWN PUSTAKAWAN ---
const { data: librariansResponse } = useQuery({
  queryKey: ['member-dropdown-librarians'],
  queryFn: async () => {
    const res = await api.get<LibrarianListResponse>(
      '/user/librarians/?limit=50&statusActive=true',
    );
    return res.data.data || [];
  },
});
const librarians = computed<LibrarianUser[]>(() => librariansResponse.value || []);

// --- MODAL STATES ---
const isBorrowModalOpen = ref(false);
const initialBukuId = ref('');

const openBorrowModal = () => {
  initialBukuId.value = '';
  isBorrowModalOpen.value = true;
};

const isReturnModalOpen = ref(false);
const selectedReturnTrx = ref<MemberTransactionItem | null>(null);

const openReturnModal = (item: MemberTransactionItem) => {
  selectedReturnTrx.value = item;
  isReturnModalOpen.value = true;
};

const isDetailModalOpen = ref(false);
const selectedDetailTrx = ref<MemberTransactionItem | null>(null);

const openDetailModal = (item: MemberTransactionItem) => {
  selectedDetailTrx.value = item;
  isDetailModalOpen.value = true;
};

// Auto-open borrow modal if redirected with query params
onMounted(() => {
  if (route.query.bukuId) {
    initialBukuId.value = String(route.query.bukuId);
    isBorrowModalOpen.value = true;
  }
});

const columns: TableColumn<MemberTransactionItem>[] = [
  { key: 'kdTransaksi', label: 'ID Transaksi' },
  { key: 'judulBuku', label: 'Judul Buku' },
  { key: 'namaPustakawan', label: 'Petugas' },
  { key: 'tglPinjam', label: 'Tgl Pinjam' },
  { key: 'tglKembali', label: 'Batas Kembali' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', align: 'center' },
];
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
          <ArrowUpCircleIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Peminjaman Saya</h1>
          <p class="text-sm text-gray-500 mt-1">
            Pantau status peminjaman buku fisik, tenggat waktu pengembalian, dan ajukan peminjaman
            mandiri.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="isFetching"
          @click="() => refetch()"
          class="text-xs font-semibold"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1.5" />
          Segarkan
        </Button>

        <Button variant="primary" size="sm" @click="openBorrowModal" class="text-xs font-semibold">
          <PlusIcon class="w-4 h-4 mr-1.5" />
          Ajukan Peminjaman
        </Button>
      </div>
    </div>

    <!-- FILTER & PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Status Filter Tabs -->
        <div class="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl w-fit">
          <button
            v-for="st in [
              'Semua',
              'Dipinjam',
              'Menunggu Persetujuan',
              'Menunggu Diambil',
              'Dikembalikan',
              'Terlambat',
            ]"
            :key="st"
            type="button"
            @click="handleStatusFilter(st)"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              statusFilter === st
                ? 'bg-white text-charcoalDark shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ st }}
          </button>
        </div>

        <!-- Input Pencarian -->
        <div class="w-full sm:w-80">
          <Input
            :model-value="search"
            placeholder="Cari ID transaksi atau judul buku..."
            class="w-full"
            @update:model-value="handleSearchChange"
          >
            <template #prefix>
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
            </template>
          </Input>
        </div>
      </div>
    </Card>

    <!-- TABEL PEMINJAMAN -->
    <Card>
      <Table
        :columns="columns"
        :items="transactions"
        :meta="meta"
        :loading="isLoading"
        empty-message="Belum ada riwayat peminjaman buku yang tercatat."
        @change-page="handlePageChange"
      >
        <!-- Cell ID Transaksi -->
        <template #cell-kdTransaksi="{ item }">
          <span class="font-mono text-xs font-bold text-charcoalDark">
            {{ item.kdTransaksi }}
          </span>
        </template>

        <!-- Cell Judul Buku -->
        <template #cell-judulBuku="{ item }">
          <div class="max-w-xs">
            <span
              class="font-semibold text-charcoalDark line-clamp-1 text-xs"
              :title="item.judulBuku"
            >
              {{ item.judulBuku }}
            </span>
          </div>
        </template>

        <!-- Cell Petugas -->
        <template #cell-namaPustakawan="{ item }">
          <div class="flex items-center gap-1.5 text-xs text-gray-600">
            <UserIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="truncate max-w-35">{{ item.namaPustakawan || '-' }}</span>
          </div>
        </template>

        <!-- Cell Tgl Pinjam -->
        <template #cell-tglPinjam="{ item }">
          <span class="text-xs text-gray-600">
            {{ dayjs(item.tglPinjam).format('DD/MM/YYYY') }}
          </span>
        </template>

        <!-- Cell Batas Kembali -->
        <template #cell-tglKembali="{ item }">
          <div class="space-y-0.5">
            <span
              :class="[
                'text-xs font-semibold block',
                dayjs().isAfter(dayjs(item.tglKembali)) && item.status === 'Dipinjam'
                  ? 'text-rose-600 font-bold'
                  : 'text-gray-700',
              ]"
            >
              {{ dayjs(item.tglKembali).format('DD/MM/YYYY') }}
            </span>
            <span
              v-if="item.status === 'Dipinjam'"
              :class="[
                'text-[10px] font-medium block',
                dayjs().isAfter(dayjs(item.tglKembali)) ? 'text-rose-500' : 'text-gray-400',
              ]"
            >
              {{
                dayjs().isAfter(dayjs(item.tglKembali))
                  ? `Lewat ${dayjs().diff(dayjs(item.tglKembali), 'day')} hari`
                  : `Sisa ${dayjs(item.tglKembali).diff(dayjs(), 'day')} hari`
              }}
            </span>
          </div>
        </template>

        <!-- Cell Status -->
        <template #cell-status="{ item }">
          <Badge :variant="getStatusBadgeVariant(item.status)">
            {{ item.status }}
          </Badge>
        </template>

        <!-- Cell Aksi -->
        <template #cell-aksi="{ item }">
          <div class="flex items-center justify-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              class="p-1.5! text-xs font-semibold"
              title="Lihat Detail Peminjaman"
              @click="openDetailModal(item)"
            >
              <EyeIcon class="w-4 h-4" />
            </Button>

            <!-- Tombol Kembalikan Mandiri (jika status Dipinjam atau Terlambat) -->
            <Button
              v-if="item.status === 'Dipinjam' || item.status === 'Terlambat'"
              variant="primary"
              size="sm"
              class="px-2.5! py-1! text-[11px] font-semibold bg-emerald-600! hover:bg-emerald-700! text-white!"
              title="Ajukan Pengembalian Buku"
              @click="openReturnModal(item)"
            >
              <ArrowUturnLeftIcon class="w-3.5 h-3.5 mr-1" />
              Kembalikan
            </Button>
          </div>
        </template>
      </Table>
    </Card>

    <!-- MODAL AJUKAN PEMINJAMAN -->
    <BorrowingRequestModal
      v-model="isBorrowModalOpen"
      :initial-buku-id="initialBukuId"
      :available-books="availableBooks"
      :librarians="librarians"
    />

    <!-- MODAL PENGEMBALIAN BUKU -->
    <BorrowingReturnModal v-model="isReturnModalOpen" :transaction="selectedReturnTrx" />

    <!-- MODAL DETAIL TRANSAKSI -->
    <BorrowingDetailModal v-model="isDetailModalOpen" :transaction="selectedDetailTrx" />
  </div>
</template>
