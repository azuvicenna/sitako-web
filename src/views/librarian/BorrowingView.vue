<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  ArrowUpCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  BookOpenIcon,
  UserIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Table from '@/components/tables/Table.vue';
import BorrowingModal from './components/BorrowingModal.vue';

import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { getStatusBadgeVariant } from '@/utils/transaction';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';

import type { TableColumn } from '@/types/table';
import type { Book, BookListResponse } from '@/types/book';
import type { MemberUser } from '@/types/auth';
import type { MemberListResponse } from '@/types/user';
import type { Transaction, TransactionStatus, TransactionListResponse } from '@/types/transaction';

const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: FILTER & TABLE ---
const statusFilter = ref<TransactionStatus | 'Semua'>('Semua');
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const handleStatusFilter = (status: TransactionStatus | 'Semua') => {
  statusFilter.value = status;
  page.value = 1;
};

const { data: transactionsResponse, isLoading } = useQuery({
  queryKey: ['librarian-borrowing', page, statusFilter, debouncedSearch],
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

// Master data dropdowns
const { data: booksResponse } = useQuery({
  queryKey: ['books-physical-dropdown'],
  queryFn: async () => {
    const res = await api.get<BookListResponse>('/books/?bookType=Fisik&limit=100');
    return res.data;
  },
});
const availableBooks = computed<Book[]>(() => booksResponse.value?.data || []);

const { data: membersResponse } = useQuery({
  queryKey: ['members-active-dropdown'],
  queryFn: async () => {
    const res = await api.get<MemberListResponse>('/user/members/?statusActive=true&limit=100');
    return res.data;
  },
});
const availableMembers = computed<MemberUser[]>(() => membersResponse.value?.data || []);

const columns: TableColumn<Transaction>[] = [
  { key: 'transaksi', label: 'Transaksi & Koleksi Buku' },
  { key: 'anggota', label: 'Peminjam' },
  { key: 'periode', label: 'Masa Peminjaman' },
  { key: 'status', label: 'Status Sirkulasi', align: 'center', width: 'w-44' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-40' },
];

// --- MODAL FORM PINJAM ---
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedTransaction = ref<Transaction | null>(null);

const openCreateModal = () => {
  modalMode.value = 'create';
  selectedTransaction.value = null;
  isModalOpen.value = true;
};

const openEditModal = (item: Transaction) => {
  modalMode.value = 'edit';
  selectedTransaction.value = item;
  isModalOpen.value = true;
};

// --- CEPAT UBAH STATUS (APPROVE / REJECT) ---
const patchStatusMutation = useMutation({
  mutationFn: async ({ id, newStatus }: { id: string; newStatus: TransactionStatus }) => {
    const res = await api.put(`/transactions/${id}`, { status: newStatus });
    return res.data;
  },
  onSuccess: (_data, vars) => {
    queryClient.invalidateQueries({ queryKey: ['librarian-borrowing'] });
    showToast('success', `Status transaksi berhasil diubah menjadi "${vars.newStatus}"`);
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal mengubah status transaksi.'));
  },
});

const handleQuickStatus = (item: Transaction, newStatus: TransactionStatus) => {
  patchStatusMutation.mutate({ id: item.id, newStatus });
};

// --- MODAL HAPUS TRANSAKSI ---
const isDeleteModalOpen = ref(false);
const transactionToDelete = ref<Transaction | null>(null);

const openDeleteModal = (item: Transaction) => {
  transactionToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const deleteTransactionMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarian-borrowing'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Data transaksi berhasil dihapus!');
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus transaksi.'));
  },
});

const confirmDeleteTransaction = () => {
  if (transactionToDelete.value) {
    deleteTransactionMutation.mutate(transactionToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Daftar Peminjaman</h2>
        <p class="text-sm text-gray-500 mt-1">
          Pantau permohonan peminjaman mandiri, approval buku, dan sirkulasi peminjaman aktif
        </p>
      </div>
      <Button variant="primary" :icon="PlusIcon" @click="openCreateModal" class="shrink-0">
        Transaksi Pinjam Baru
      </Button>
    </div>

    <!-- Toolbar: Filter Tabs & Search Input -->
    <div
      class="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Filter Status Pills -->
      <div class="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          v-for="st in [
            'Semua',
            'Menunggu Persetujuan',
            'Menunggu Diambil',
            'Dipinjam',
            'Dikembalikan',
            'Terlambat',
            'Dibatalkan',
          ]"
          :key="st"
          type="button"
          @click="handleStatusFilter(st as any)"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === st
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          {{ st }}
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari transaksi, buku, atau nama anggota..."
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

    <!-- Tabel Transaksi -->
    <Table
      :columns="columns"
      :items="transactions"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada riwayat transaksi peminjaman yang sesuai kriteria."
      @change-page="handlePageChange"
    >
      <!-- Cell Transaksi & Buku -->
      <template #cell-transaksi="{ item }">
        <div class="space-y-0.5">
          <span class="font-bold text-charcoalDark text-xs block">
            {{ item.kdTransaksi || 'TRX-MANUAL' }}
          </span>
          <div class="flex items-center gap-1.5 text-[11px] text-gray-500">
            <BookOpenIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="truncate max-w-60">{{ item.judulBuku || '-' }}</span>
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
            <p class="font-semibold text-charcoalDark text-xs">
              {{ item.namaAnggota || item.anggotaId }}
            </p>
            <p v-if="item.namaPustakawan" class="text-[10px] text-gray-400">
              Petugas: {{ item.namaPustakawan }}
            </p>
          </div>
        </div>
      </template>

      <!-- Cell Periode -->
      <template #cell-periode="{ item }">
        <div class="text-[11px] space-y-0.5">
          <div class="text-gray-600">
            <span>Pinjam: </span>
            <span class="font-semibold text-charcoalDark">{{
              dayjs(item.tglPinjam).format('DD MMM YYYY')
            }}</span>
          </div>
          <div class="flex items-center gap-1">
            <ClockIcon class="w-3 h-3 text-gray-400" />
            <span class="text-gray-500">Kembali: </span>
            <span
              :class="[
                'font-bold',
                dayjs().isAfter(dayjs(item.tglKembali)) && item.status === 'Dipinjam'
                  ? 'text-red-600'
                  : 'text-charcoalDark',
              ]"
            >
              {{ dayjs(item.tglKembali).format('DD MMM YYYY') }}
            </span>
          </div>
        </div>
      </template>

      <!-- Cell Status -->
      <template #cell-status="{ item }">
        <Badge :variant="getStatusBadgeVariant(item.status)">
          {{ item.status }}
        </Badge>
      </template>

      <!-- Cell Aksi -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-1">
          <!-- Aksi Cepat Approval Mandiri -->
          <template v-if="item.status === 'Menunggu Persetujuan'">
            <button
              type="button"
              @click="handleQuickStatus(item, 'Menunggu Diambil')"
              :disabled="patchStatusMutation.isPending.value"
              class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
              title="Setujui (Menunggu Diambil)"
            >
              <HandThumbUpIcon class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="handleQuickStatus(item, 'Dibatalkan')"
              :disabled="patchStatusMutation.isPending.value"
              class="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Batalkan / Tolak"
            >
              <HandThumbDownIcon class="w-4 h-4" />
            </button>
          </template>

          <template v-else-if="item.status === 'Menunggu Diambil'">
            <button
              type="button"
              @click="handleQuickStatus(item, 'Dipinjam')"
              :disabled="patchStatusMutation.isPending.value"
              class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
              title="Serahkan Buku (Mulai Dipinjam)"
            >
              <ArrowUpCircleIcon class="w-4 h-4" />
            </button>
          </template>

          <button
            type="button"
            @click="openEditModal(item)"
            class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Ubah Transaksi"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Transaksi"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TRANSAKSI PINJAM BARU / EDIT -->
    <BorrowingModal
      v-model="isModalOpen"
      :mode="modalMode"
      :transaction="selectedTransaction"
      :available-books="availableBooks"
      :available-members="availableMembers"
    />

    <!-- MODAL KONFIRMASI HAPUS -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Transaksi"
      :description="`Apakah Anda yakin ingin menghapus data sirkulasi transaksi '${transactionToDelete?.kdTransaksi || transactionToDelete?.id}'? Tindakan ini tidak dapat dibatalkan.`"
      :loading="deleteTransactionMutation.isPending.value"
      @confirm="confirmDeleteTransaction"
    />
  </div>
</template>
