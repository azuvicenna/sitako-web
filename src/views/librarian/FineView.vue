<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  BanknotesIcon,
  Cog6ToothIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  BookOpenIcon,
  UserIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Table from '@/components/tables/Table.vue';
import FinePaymentModal from './components/FinePaymentModal.vue';
import FineRuleModal from './components/FineRuleModal.vue';

import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';

import type { TableColumn } from '@/types/table';
import type { Book, BookListResponse } from '@/types/book';
import type { MemberUser } from '@/types/auth';
import type { MemberListResponse } from '@/types/user';
import type { Transaction, TransactionListResponse } from '@/types/transaction';
import type {
  FineRule,
  FinePayment,
  FineRuleListResponse,
  FinePaymentListResponse,
} from '@/types/fine';

const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: TAB AKTIF & SEARCH / PAGINASI ---
const activeTab = ref<'payments' | 'rules'>('payments');
const {
  page,
  search,
  debouncedSearch,
  handleSearchChange,
  handlePageChange,
  reset: resetSearch,
} = usePaginationSearch();

const handleTabChange = (tab: 'payments' | 'rules') => {
  activeTab.value = tab;
  resetSearch();
};

// --- DATA PEMBAYARAN DENDA ---
const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery({
  queryKey: ['fine-payments', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<FinePaymentListResponse>(`/fine-payments/?${params}`);
    return res.data;
  },
  enabled: computed(() => activeTab.value === 'payments'),
});

const payments = computed<FinePayment[]>(() => paymentsResponse.value?.data || []);
const paymentsMeta = computed(() => paymentsResponse.value?.meta || null);

// --- DATA ATURAN DENDA ---
const { data: rulesResponse, isLoading: isLoadingRules } = useQuery({
  queryKey: ['fine-rules', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<FineRuleListResponse>(`/fines/?${params}`);
    return res.data;
  },
  enabled: computed(() => activeTab.value === 'rules'),
});

const rules = computed<FineRule[]>(() => rulesResponse.value?.data || []);
const rulesMeta = computed(() => rulesResponse.value?.meta || null);

// Data master dropdown
const { data: booksResponse } = useQuery({
  queryKey: ['books-all-dropdown'],
  queryFn: async () => {
    const res = await api.get<BookListResponse>('/books?limit=100');
    return res.data;
  },
});
const availableBooks = computed<Book[]>(() => booksResponse.value?.data || []);

const { data: membersResponse } = useQuery({
  queryKey: ['members-dropdown'],
  queryFn: async () => {
    const res = await api.get<MemberListResponse>('/user/members/?statusActive=true&limit=100');
    return res.data;
  },
});
const availableMembers = computed<MemberUser[]>(() => membersResponse.value?.data || []);

const { data: transactionsResponse } = useQuery({
  queryKey: ['transactions-dropdown'],
  queryFn: async () => {
    const res = await api.get<TransactionListResponse>('/transactions/?status=Semua&limit=100');
    return res.data;
  },
});
const availableTransactions = computed<Transaction[]>(() => transactionsResponse.value?.data || []);

// --- KOLOM TABEL ---
const paymentColumns: TableColumn<FinePayment>[] = [
  { key: 'transaksi', label: 'Transaksi / Buku' },
  { key: 'anggota', label: 'Anggota Terkena Denda' },
  { key: 'totalDenda', label: 'Total Tagihan Denda' },
  { key: 'metodePembayaran', label: 'Metode & Status', align: 'center', width: 'w-36' },
  { key: 'tglBayar', label: 'Tanggal Bayar', width: 'w-36' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-24' },
];

const ruleColumns: TableColumn<FineRule>[] = [
  { key: 'judulBuku', label: 'Koleksi Buku' },
  { key: 'jenisDenda', label: 'Jenis Denda', align: 'center', width: 'w-36' },
  { key: 'hargaDenda', label: 'Tarif Denda' },
  { key: 'metodePerhitungan', label: 'Metode Perhitungan', align: 'center', width: 'w-44' },
  { key: 'createdAt', label: 'Ditetapkan', width: 'w-36' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-24' },
];

// --- MODAL STATES ---
const isPaymentModalOpen = ref(false);
const paymentModalMode = ref<'create' | 'edit'>('create');
const selectedPayment = ref<FinePayment | null>(null);

const openCreatePaymentModal = () => {
  paymentModalMode.value = 'create';
  selectedPayment.value = null;
  isPaymentModalOpen.value = true;
};

const openEditPaymentModal = (item: FinePayment) => {
  paymentModalMode.value = 'edit';
  selectedPayment.value = item;
  isPaymentModalOpen.value = true;
};

const isRuleModalOpen = ref(false);
const ruleModalMode = ref<'create' | 'edit'>('create');
const selectedRule = ref<FineRule | null>(null);

const openCreateRuleModal = () => {
  ruleModalMode.value = 'create';
  selectedRule.value = null;
  isRuleModalOpen.value = true;
};

const openEditRuleModal = (rule: FineRule) => {
  ruleModalMode.value = 'edit';
  selectedRule.value = rule;
  isRuleModalOpen.value = true;
};

// --- MODAL: HAPUS ---
const isDeleteModalOpen = ref(false);
const itemToDelete = ref<{ type: 'payment' | 'rule'; id: string; label: string } | null>(null);

const openDeletePaymentModal = (item: FinePayment) => {
  itemToDelete.value = {
    type: 'payment',
    id: item.id,
    label: `Pembayaran ${item.kdTransaksi || item.id} (${formatRupiah(item.totalDenda)})`,
  };
  isDeleteModalOpen.value = true;
};

const openDeleteRuleModal = (item: FineRule) => {
  itemToDelete.value = {
    type: 'rule',
    id: item.id,
    label: `Aturan denda ${item.jenisDenda} - ${item.judulBuku || item.bukuId}`,
  };
  isDeleteModalOpen.value = true;
};

const deleteMutation = useMutation({
  mutationFn: async ({ type, id }: { type: 'payment' | 'rule'; id: string }) => {
    if (type === 'payment') {
      const res = await api.delete(`/fine-payments/${id}`);
      return res.data;
    } else {
      const res = await api.delete(`/fines/${id}`);
      return res.data;
    }
  },
  onSuccess: () => {
    if (itemToDelete.value?.type === 'payment') {
      queryClient.invalidateQueries({ queryKey: ['fine-payments'] });
      showToast('success', 'Data pembayaran denda berhasil dihapus.');
    } else {
      queryClient.invalidateQueries({ queryKey: ['fine-rules'] });
      showToast('success', 'Aturan tarif denda berhasil dihapus.');
    }
    isDeleteModalOpen.value = false;
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus data.'));
  },
});

const confirmDelete = () => {
  if (itemToDelete.value) {
    deleteMutation.mutate({
      type: itemToDelete.value.type,
      id: itemToDelete.value.id,
    });
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Kelola Denda Buku</h2>
        <p class="text-sm text-gray-500 mt-1">
          Pencatatan sirkulasi denda anggota dan konfigurasi tarif regulasi perpustakaan
        </p>
      </div>

      <!-- Tombol Aksi Sesuai Tab Aktif -->
      <Button
        v-if="activeTab === 'payments'"
        variant="primary"
        :icon="PlusIcon"
        @click="openCreatePaymentModal"
        class="shrink-0"
      >
        Catat Pembayaran Tunai
      </Button>
      <Button
        v-else
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateRuleModal"
        class="shrink-0"
      >
        Tambah Aturan Tarif
      </Button>
    </div>

    <!-- Toolbar: Tabs Switcher & Search -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Tabs Switcher -->
      <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          type="button"
          @click="handleTabChange('payments')"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'payments'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          <BanknotesIcon class="w-4 h-4" />
          <span>Riwayat Pembayaran</span>
        </button>
        <button
          type="button"
          @click="handleTabChange('rules')"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'rules'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          <Cog6ToothIcon class="w-4 h-4" />
          <span>Aturan Tarif Denda</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          :placeholder="
            activeTab === 'payments'
              ? 'Cari anggota, transaksi, buku, atau metode...'
              : 'Cari jenis denda atau judul buku...'
          "
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total:
        <span class="text-charcoalDark font-bold">
          {{
            activeTab === 'payments'
              ? (paymentsMeta?.totalRows ?? payments.length)
              : (rulesMeta?.totalRows ?? rules.length)
          }}
        </span>
        Data
      </div>
    </div>

    <!-- TAB 1: TABEL RIWAYAT PEMBAYARAN DENDA -->
    <div v-if="activeTab === 'payments'">
      <Table
        :columns="paymentColumns"
        :items="payments"
        :meta="paymentsMeta"
        :loading="isLoadingPayments"
        empty-message="Belum ada riwayat transaksi pembayaran denda."
        @change-page="handlePageChange"
      >
        <!-- Cell Transaksi & Buku -->
        <template #cell-transaksi="{ item }">
          <div class="space-y-0.5">
            <span class="font-bold text-charcoalDark text-xs block">
              {{ item.kdTransaksi || item.transaksiId || 'TRX-MANUAL' }}
            </span>
            <div class="flex items-center gap-1.5 text-[11px] text-gray-500">
              <BookOpenIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span class="truncate max-w-50">{{ item.judulBuku || '-' }}</span>
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
                Pencatat: {{ item.namaPustakawan }}
              </p>
            </div>
          </div>
        </template>

        <!-- Cell Total Denda -->
        <template #cell-totalDenda="{ item }">
          <div>
            <span class="font-bold text-sm text-charcoalDark block leading-none">
              {{ formatRupiah(item.totalDenda) }}
            </span>
            <span class="text-[10px] text-gray-400"
              >Tarif: {{ formatRupiah(item.hargaDenda) }}</span
            >
          </div>
        </template>

        <!-- Cell Metode Pembayaran & Status -->
        <template #cell-metodePembayaran="{ item }">
          <div class="flex flex-col items-center gap-1">
            <Badge :variant="item.metodePembayaran === 'Tunai' ? 'warning' : 'info'">
              {{ item.metodePembayaran }}
            </Badge>
            <span
              v-if="item.paymentStatus"
              :class="[
                'text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded',
                item.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800',
              ]"
            >
              {{ item.paymentStatus }}
            </span>
          </div>
        </template>

        <!-- Cell Tanggal Bayar -->
        <template #cell-tglBayar="{ item }">
          <span class="text-xs text-gray-500">
            {{
              item.tglBayar
                ? dayjs(item.tglBayar).format('DD MMM YYYY, HH:mm')
                : dayjs(item.createdAt).format('DD MMM YYYY')
            }}
          </span>
        </template>

        <!-- Cell Aksi -->
        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              @click="openEditPaymentModal(item)"
              class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Ubah Pembayaran"
            >
              <PencilSquareIcon class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="openDeletePaymentModal(item)"
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Hapus Catatan"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </template>
      </Table>
    </div>

    <!-- TAB 2: TABEL ATURAN TARIF DENDA -->
    <div v-else>
      <Table
        :columns="ruleColumns"
        :items="rules"
        :meta="rulesMeta"
        :loading="isLoadingRules"
        empty-message="Belum ada konfigurasi aturan tarif denda."
        @change-page="handlePageChange"
      >
        <!-- Cell Buku -->
        <template #cell-judulBuku="{ item }">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-amber-50 text-mustardHover flex items-center justify-center shrink-0"
            >
              <BookOpenIcon class="w-4 h-4" />
            </div>
            <div>
              <span class="font-bold text-charcoalDark text-xs block">
                {{ item.judulBuku || item.bukuId }}
              </span>
              <span class="text-[10px] text-gray-400">ID Buku: {{ item.bukuId }}</span>
            </div>
          </div>
        </template>

        <!-- Cell Jenis Denda -->
        <template #cell-jenisDenda="{ item }">
          <Badge :variant="item.jenisDenda === 'Terlambat' ? 'warning' : 'danger'">
            {{ item.jenisDenda }}
          </Badge>
        </template>

        <!-- Cell Tarif Denda -->
        <template #cell-hargaDenda="{ item }">
          <span class="font-bold text-charcoalDark text-sm">
            {{ formatRupiah(item.hargaDenda) }}
          </span>
        </template>

        <!-- Cell Metode Perhitungan -->
        <template #cell-metodePerhitungan="{ item }">
          <span
            :class="[
              'inline-block px-2 py-0.5 rounded text-xs font-semibold',
              item.metodePerhitungan === 'Akumulasi'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200',
            ]"
          >
            {{ item.metodePerhitungan === 'Akumulasi' ? 'Akumulasi (Per Hari)' : 'Tarif Flat' }}
          </span>
        </template>

        <!-- Cell Tanggal Ditetapkan -->
        <template #cell-createdAt="{ item }">
          <span class="text-xs text-gray-500">
            {{ dayjs(item.createdAt).format('DD MMM YYYY') }}
          </span>
        </template>

        <!-- Cell Aksi -->
        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              @click="openEditRuleModal(item)"
              class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Ubah Tarif"
            >
              <PencilSquareIcon class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="openDeleteRuleModal(item)"
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Hapus Aturan"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </template>
      </Table>
    </div>

    <!-- MODAL CATAT / EDIT PEMBAYARAN DENDA -->
    <FinePaymentModal
      v-model="isPaymentModalOpen"
      :mode="paymentModalMode"
      :payment="selectedPayment"
      :available-transactions="availableTransactions"
      :available-members="availableMembers"
    />

    <!-- MODAL TAMBAH / EDIT ATURAN DENDA -->
    <FineRuleModal
      v-model="isRuleModalOpen"
      :mode="ruleModalMode"
      :rule="selectedRule"
      :available-books="availableBooks"
    />

    <!-- MODAL KONFIRMASI HAPUS -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus"
      :description="`Apakah Anda yakin ingin menghapus data '${itemToDelete?.label}'? Tindakan ini tidak dapat dibatalkan.`"
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
