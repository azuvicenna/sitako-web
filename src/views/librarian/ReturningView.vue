<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  ArrowDownCircleIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  UserIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import type { TableColumn } from '@/types/table';
import type {
  Transaction,
  TransactionStatus,
  TransactionListResponse,
} from '@/types/transaction';

const queryClient = useQueryClient();

// --- STATE: NOTIFIKASI TOAST ---
const toast = ref<{ type: 'success' | 'danger'; message: string } | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const showToast = (type: 'success' | 'danger', message: string) => {
  toast.value = { type, message };
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 4000);
};

// --- STATE: FILTER & TABLE ---
const page = ref(1);
const search = ref('');
const debouncedSearch = ref('');
const statusFilter = ref<TransactionStatus | 'Semua'>('Dipinjam');

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

const handleStatusFilter = (status: TransactionStatus | 'Semua') => {
  statusFilter.value = status;
  page.value = 1;
};

const {
  data: transactionsResponse,
  isLoading,
} = useQuery({
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
    const res = await api.get('/transactions/?status=Dipinjam&limit=100');
    return res.data;
  },
});
const activeBorrowings = computed<any[]>(() => activeBorrowingsResponse.value?.data || []);

const columns: TableColumn<Transaction>[] = [
  { key: 'transaksi', label: 'Transaksi & Buku' },
  { key: 'anggota', label: 'Peminjam' },
  { key: 'batasKembali', label: 'Jatuh Tempo Pengembalian' },
  { key: 'status', label: 'Status Saat Ini', align: 'center', width: 'w-36' },
  { key: 'keterangan', label: 'Status Fisik & Waktu' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-36' },
];

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dikembalikan':
      return 'success';
    case 'Dipinjam':
      return 'warning';
    case 'Terlambat':
    case 'Tidak Mengembalikan':
      return 'danger';
    default:
      return 'neutral';
  }
};

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- STATE & MUTATION: MODAL PROSES PENGEMBALIAN ---
const isReturnModalOpen = ref(false);
const selectedTransaction = ref<Transaction | null>(null);

const returnForm = reactive({
  transactionId: '',
  kondisiBuku: 'Baik' as 'Baik' | 'Hilang',
  tglKembaliAktual: dayjs().format('YYYY-MM-DD'),
});

const openReturnModal = (trx?: Transaction) => {
  if (trx) {
    selectedTransaction.value = trx;
    returnForm.transactionId = trx.id;
  } else {
    selectedTransaction.value = activeBorrowings.value[0] || null;
    returnForm.transactionId = activeBorrowings.value[0]?.id || '';
  }
  returnForm.kondisiBuku = 'Baik';
  returnForm.tglKembaliAktual = dayjs().format('YYYY-MM-DD');
  isReturnModalOpen.value = true;
};

const handleSelectTransactionChange = () => {
  const found =
    transactions.value.find((t) => t.id === returnForm.transactionId) ||
    activeBorrowings.value.find((t) => t.id === returnForm.transactionId);
  selectedTransaction.value = found || null;
};

// Perhitungan Keterlambatan
const delayCalculation = computed(() => {
  if (!selectedTransaction.value) return { isOverdue: false, daysOverdue: 0, estimatedFine: 0 };

  const dueDate = dayjs(selectedTransaction.value.tglKembali).startOf('day');
  const returnDate = dayjs(returnForm.tglKembaliAktual).startOf('day');
  const diff = returnDate.diff(dueDate, 'day');

  if (diff > 0) {
    return {
      isOverdue: true,
      daysOverdue: diff,
      estimatedFine: diff * 1000, // Estimasi standar denda keterlambatan per hari
    };
  }

  return { isOverdue: false, daysOverdue: 0, estimatedFine: 0 };
});

const returnMutation = useMutation({
  mutationFn: async () => {
    if (!selectedTransaction.value) return;

    let targetStatus: TransactionStatus = 'Dikembalikan';
    if (returnForm.kondisiBuku === 'Hilang') {
      targetStatus = 'Tidak Mengembalikan';
    } else if (delayCalculation.value.isOverdue) {
      targetStatus = 'Dikembalikan';
    }

    const res = await api.put(`/transactions/${selectedTransaction.value.id}`, {
      status: targetStatus,
      tglKembali: new Date(returnForm.tglKembaliAktual).toISOString(),
    });
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarian-returning'] });
    queryClient.invalidateQueries({ queryKey: ['active-borrowings-dropdown'] });
    isReturnModalOpen.value = false;
    showToast(
      'success',
      returnForm.kondisiBuku === 'Hilang'
        ? 'Pengembalian dicatat sebagai buku hilang. Silakan catat tagihan denda terkait.'
        : 'Buku berhasil diterima kembali ke perpustakaan!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal memproses pengembalian buku.');
  },
});

const submitReturn = () => {
  if (!returnForm.transactionId) {
    showToast('danger', 'Silakan pilih transaksi yang akan dikembalikan.');
    return;
  }
  returnMutation.mutate();
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

    <!-- Alert / Toast Banner -->
    <Transition name="fade">
      <Alert
        v-if="toast"
        :variant="toast.type === 'success' ? 'success' : 'danger'"
        :icon="toast.type === 'success' ? CheckCircleIcon : ExclamationCircleIcon"
        :title="toast.type === 'success' ? 'Berhasil' : 'Perhatian'"
        :description="toast.message"
      />
    </Transition>

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
        Total: <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? transactions.length }}</span> Transaksi
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
            <span class="font-semibold text-charcoalDark truncate max-w-[200px]">{{ item.judulBuku || item.bukuId }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Anggota -->
      <template #cell-anggota="{ item }">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 text-xs font-bold">
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
        <div v-if="item.status === 'Dikembalikan'" class="flex items-center gap-1 text-xs text-green-700 font-semibold">
          <CheckBadgeIcon class="w-4 h-4" />
          <span>Selesai Dikembalikan</span>
        </div>
        <div v-else-if="item.status === 'Tidak Mengembalikan'" class="flex items-center gap-1 text-xs text-red-600 font-semibold">
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

          <span v-else class="text-[11px] text-gray-400 italic">
            Tuntas
          </span>
        </div>
      </template>
    </Table>

    <!-- MODAL PROSES PENGEMBALIAN BUKU -->
    <Modal
      v-model="isReturnModalOpen"
      title="Konfirmasi Pengembalian Buku"
      description="Verifikasi fisik buku yang diserahkan dan catat status pengembalian sirkulasi."
      :icon="ArrowDownCircleIcon"
      size="lg"
    >
      <div class="space-y-4 pt-1">
        <!-- Pilihan Transaksi jika dibuka tanpa parameter -->
        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Transaksi yang Dikembalikan <span class="text-red-500">*</span>
          </label>
          <select
            v-model="returnForm.transactionId"
            @change="handleSelectTransactionChange"
            :disabled="returnMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="" disabled>-- Pilih Transaksi Peminjaman --</option>
            <option
              v-for="trx in activeBorrowings"
              :key="trx.id"
              :value="trx.id"
            >
              {{ trx.kdTransaksi }} - {{ trx.namaAnggota }} ({{ trx.judulBuku }})
            </option>
          </select>
        </div>

        <!-- Ringkasan Transaksi Terpilih -->
        <div
          v-if="selectedTransaction"
          class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs"
        >
          <div class="flex justify-between items-center pb-2 border-b border-gray-200">
            <span class="text-gray-500">Judul Buku:</span>
            <span class="font-bold text-charcoalDark text-sm">
              {{ selectedTransaction.judulBuku }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Peminjam:</span>
            <span class="font-semibold text-charcoalDark">
              {{ selectedTransaction.namaAnggota }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Batas Tanggal Jatuh Tempo:</span>
            <span class="font-semibold text-charcoalDark">
              {{ dayjs(selectedTransaction.tglKembali).format('DD MMMM YYYY') }}
            </span>
          </div>
        </div>

        <!-- Deteksi Status Keterlambatan -->
        <div v-if="delayCalculation.isOverdue" class="p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <div class="flex items-start gap-2.5">
            <ExclamationTriangleIcon class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 class="font-bold text-red-900 text-xs">Peringatan Keterlambatan</h4>
              <p class="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                Pengembalian melewati jatuh tempo sebanyak
                <span class="font-bold">{{ delayCalculation.daysOverdue }} hari</span>.
                Estimasi kewajiban denda:
                <span class="font-bold">{{ formatRupiah(delayCalculation.estimatedFine) }}</span>.
              </p>
            </div>
          </div>
        </div>

        <div v-else-if="selectedTransaction" class="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-xs">
          <CheckCircleIcon class="w-4 h-4 text-green-600 shrink-0" />
          <span class="font-medium">Pengembalian tepat waktu (tidak dikenakan denda).</span>
        </div>

        <!-- Pilihan Kondisi Fisik Buku -->
        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-2">
            Hasil Pemeriksaan Fisik Buku <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label
              :class="[
                'p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors',
                returnForm.kondisiBuku === 'Baik'
                  ? 'border-mustard bg-amber-50/50 text-charcoalDark font-bold shadow-xs'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
            >
              <input
                type="radio"
                name="kondisi"
                value="Baik"
                v-model="returnForm.kondisiBuku"
                class="hidden"
              />
              <div class="flex items-center gap-1.5 text-xs">
                <CheckBadgeIcon class="w-4 h-4 text-green-600" />
                <span>Buku Baik & Lengkap</span>
              </div>
              <span class="text-[10px] text-gray-500 font-normal">Buku kembali utuh siap dipinjamkan</span>
            </label>

            <label
              :class="[
                'p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors',
                returnForm.kondisiBuku === 'Hilang'
                  ? 'border-red-500 bg-red-50 text-red-900 font-bold shadow-xs'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
            >
              <input
                type="radio"
                name="kondisi"
                value="Hilang"
                v-model="returnForm.kondisiBuku"
                class="hidden"
              />
              <div class="flex items-center gap-1.5 text-xs">
                <ExclamationTriangleIcon class="w-4 h-4 text-red-600" />
                <span>Buku Hilang / Rusak</span>
              </div>
              <span class="text-[10px] text-gray-500 font-normal">Dikenakan denda ganti rugi buku</span>
            </label>
          </div>
        </div>

        <!-- Tanggal Dikembalikan -->
        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Tanggal Diterima Kembali
          </label>
          <Input
            type="date"
            v-model="returnForm.tglKembaliAktual"
            :disabled="returnMutation.isPending.value"
          />
        </div>
      </div>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="returnMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitReturn"
          :disabled="returnMutation.isPending.value || !selectedTransaction"
        >
          {{ returnMutation.isPending.value ? 'Memproses...' : 'Konfirmasi Pengembalian' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
