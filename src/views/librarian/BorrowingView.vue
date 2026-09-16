<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  ArrowUpCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  UserIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '@/validations/librarian/transaction.schema';
import type { TableColumn } from '@/types/table';
import type {
  Transaction,
  TransactionStatus,
  TransactionListResponse,
} from '@/types/transaction';

const authStore = useAuthStore();
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
const statusFilter = ref<TransactionStatus | 'Semua'>('Semua');

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

// Data master buku fisik untuk dropdown
const { data: booksResponse } = useQuery({
  queryKey: ['books-physical-dropdown'],
  queryFn: async () => {
    const res = await api.get('/books/?bookType=Fisik&limit=100');
    return res.data;
  },
});
const availableBooks = computed<any[]>(() => booksResponse.value?.data || []);

// Data master anggota aktif untuk dropdown
const { data: membersResponse } = useQuery({
  queryKey: ['members-active-dropdown'],
  queryFn: async () => {
    const res = await api.get('/user/members/?statusActive=true&limit=100');
    return res.data;
  },
});
const availableMembers = computed<any[]>(() => membersResponse.value?.data || []);

const columns: TableColumn<Transaction>[] = [
  { key: 'transaksi', label: 'Transaksi & Koleksi Buku' },
  { key: 'anggota', label: 'Peminjam' },
  { key: 'periode', label: 'Masa Peminjaman' },
  { key: 'status', label: 'Status Sirkulasi', align: 'center', width: 'w-44' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-40' },
];

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dipinjam':
      return 'warning';
    case 'Dikembalikan':
      return 'success';
    case 'Terlambat':
    case 'Tidak Mengembalikan':
      return 'danger';
    case 'Menunggu Persetujuan':
    case 'Menunggu Diambil':
      return 'info';
    case 'Dibatalkan':
    default:
      return 'neutral';
  }
};

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- STATE & MUTATION: FORM TRANSAKSI BARU / EDIT ---
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');

const form = reactive({
  id: '',
  bukuId: '',
  anggotaId: '',
  tglPinjam: dayjs().format('YYYY-MM-DD'),
  tglKembali: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  status: 'Dipinjam' as TransactionStatus,
});

const formErrors = ref<Record<string, string | undefined>>({});

const openCreateModal = () => {
  modalMode.value = 'create';
  form.id = '';
  form.bukuId = '';
  form.anggotaId = '';
  form.tglPinjam = dayjs().format('YYYY-MM-DD');
  form.tglKembali = dayjs().add(7, 'day').format('YYYY-MM-DD');
  form.status = 'Dipinjam';
  formErrors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (item: Transaction) => {
  modalMode.value = 'edit';
  form.id = item.id;
  form.bukuId = item.bukuId || '';
  form.anggotaId = item.anggotaId || '';
  form.tglPinjam = dayjs(item.tglPinjam).format('YYYY-MM-DD');
  form.tglKembali = dayjs(item.tglKembali).format('YYYY-MM-DD');
  form.status = item.status;
  formErrors.value = {};
  isModalOpen.value = true;
};

const transactionMutation = useMutation({
  mutationFn: async (payload: typeof form) => {
    if (modalMode.value === 'create') {
      const res = await api.post('/transactions/', {
        bukuId: payload.bukuId,
        anggotaId: payload.anggotaId,
        pustakawanId: authStore.user?.id,
        tglPinjam: new Date(payload.tglPinjam).toISOString(),
        tglKembali: new Date(payload.tglKembali).toISOString(),
        status: payload.status,
      });
      return res.data;
    } else {
      const res = await api.put(`/transactions/${payload.id}`, {
        status: payload.status,
        tglKembali: new Date(payload.tglKembali).toISOString(),
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarian-borrowing'] });
    isModalOpen.value = false;
    showToast(
      'success',
      modalMode.value === 'create'
        ? 'Transaksi peminjaman baru berhasil dibuat!'
        : 'Data transaksi berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal memproses transaksi peminjaman.');
  },
});

const submitTransactionForm = () => {
  formErrors.value = {};

  if (modalMode.value === 'create') {
    const validation = createTransactionSchema.safeParse({
      bukuId: form.bukuId,
      anggotaId: form.anggotaId,
      pustakawanId: authStore.user?.id,
      tglPinjam: new Date(form.tglPinjam),
      tglKembali: new Date(form.tglKembali),
      status: form.status,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        bukuId: errors.bukuId?.[0],
        anggotaId: errors.anggotaId?.[0],
        tglPinjam: errors.tglPinjam?.[0],
        tglKembali: errors.tglKembali?.[0],
      };
      return;
    }
  } else {
    const validation = updateTransactionSchema.safeParse({
      status: form.status,
      tglKembali: new Date(form.tglKembali),
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        status: errors.status?.[0],
      };
      return;
    }
  }

  transactionMutation.mutate(form);
};

// --- MUTATION CEPAT STATUS: APPROVE, TOLAK, SERAHKAN ---
const updateStatusMutation = useMutation({
  mutationFn: async ({ id, newStatus }: { id: string; newStatus: TransactionStatus }) => {
    const res = await api.put(`/transactions/${id}`, { status: newStatus });
    return res.data;
  },
  onSuccess: (_data, vars) => {
    queryClient.invalidateQueries({ queryKey: ['librarian-borrowing'] });
    showToast('success', `Status transaksi berhasil diubah menjadi "${vars.newStatus}"`);
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal mengubah status transaksi.');
  },
});

const handleApprove = (trx: Transaction) => {
  updateStatusMutation.mutate({ id: trx.id, newStatus: 'Menunggu Diambil' });
};

const handleReject = (trx: Transaction) => {
  if (confirm(`Tolak permohonan peminjaman ${trx.kdTransaksi}?`)) {
    updateStatusMutation.mutate({ id: trx.id, newStatus: 'Dibatalkan' });
  }
};

const handleHandover = (trx: Transaction) => {
  updateStatusMutation.mutate({ id: trx.id, newStatus: 'Dipinjam' });
};

// --- MUTATION: HAPUS TRANSAKSI ---
const isDeleteModalOpen = ref(false);
const transactionToDelete = ref<Transaction | null>(null);

const openDeleteModal = (trx: Transaction) => {
  transactionToDelete.value = trx;
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
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus transaksi.');
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
      <Button
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateModal"
        class="shrink-0"
      >
        Transaksi Pinjam Baru
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

    <!-- Toolbar: Filter Pills & Search -->
    <div
      class="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Filter Status Pills -->
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
          @click="handleStatusFilter('Menunggu Persetujuan')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Menunggu Persetujuan'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Menunggu Persetujuan
        </button>
        <button
          type="button"
          @click="handleStatusFilter('Menunggu Diambil')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusFilter === 'Menunggu Diambil'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Siap Diambil
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
          Aktif Dipinjam
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
          Terlambat
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

    <!-- Tabel Data Peminjaman -->
    <Table
      :columns="columns"
      :items="transactions"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada data transaksi peminjaman."
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

      <!-- Cell Anggota Peminjam -->
      <template #cell-anggota="{ item }">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 text-xs font-bold">
            <UserIcon class="w-4 h-4" />
          </div>
          <div>
            <p class="font-semibold text-charcoalDark text-xs leading-tight">
              {{ item.namaAnggota || item.anggotaId }}
            </p>
            <p v-if="item.namaPustakawan" class="text-[10px] text-gray-400 mt-0.5">
              Staf: {{ item.namaPustakawan }}
            </p>
          </div>
        </div>
      </template>

      <!-- Cell Periode Peminjaman -->
      <template #cell-periode="{ item }">
        <div class="text-xs space-y-0.5">
          <div class="flex items-center gap-1 text-gray-500">
            <span class="text-[10px] text-gray-400">Pinjam:</span>
            <span>{{ dayjs(item.tglPinjam).format('DD/MM/YYYY') }}</span>
          </div>
          <div
            :class="[
              'flex items-center gap-1 font-semibold',
              dayjs().isAfter(dayjs(item.tglKembali)) && item.status === 'Dipinjam'
                ? 'text-red-600'
                : 'text-charcoalDark'
            ]"
          >
            <ClockIcon class="w-3 h-3 text-gray-400 shrink-0" />
            <span class="text-[10px]">Batas:</span>
            <span>{{ dayjs(item.tglKembali).format('DD/MM/YYYY') }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Status -->
      <template #cell-status="{ item }">
        <Badge :variant="getStatusBadgeVariant(item.status)">
          {{ item.status }}
        </Badge>
      </template>

      <!-- Cell Aksi & Quick Flow Approval -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-1.5">
          <!-- Flow 1: Menunggu Persetujuan -> Setujui / Tolak -->
          <template v-if="item.status === 'Menunggu Persetujuan'">
            <button
              type="button"
              @click="handleApprove(item)"
              class="px-2 py-1 text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 rounded-md border border-green-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Setujui Peminjaman"
            >
              <HandThumbUpIcon class="w-3.5 h-3.5" />
              <span>Setujui</span>
            </button>
            <button
              type="button"
              @click="handleReject(item)"
              class="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Tolak Peminjaman"
            >
              <HandThumbDownIcon class="w-4 h-4" />
            </button>
          </template>

          <!-- Flow 2: Menunggu Diambil -> Serahkan Buku Fisik -->
          <template v-else-if="item.status === 'Menunggu Diambil'">
            <button
              type="button"
              @click="handleHandover(item)"
              class="px-2 py-1 text-xs font-bold bg-mustard/20 text-charcoalDark hover:bg-mustard rounded-md border border-mustard/40 transition-colors cursor-pointer flex items-center gap-1"
              title="Serahkan Buku kepada Siswa"
            >
              <ArrowUpCircleIcon class="w-3.5 h-3.5" />
              <span>Serahkan</span>
            </button>
          </template>

          <!-- Standar Edit & Hapus -->
          <button
            type="button"
            @click="openEditModal(item)"
            class="p-1.5 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Ubah Transaksi"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Transaksi"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TRANSAKSI BARU / EDIT -->
    <Modal
      v-model="isModalOpen"
      :title="modalMode === 'create' ? 'Transaksi Peminjaman Baru' : 'Ubah Transaksi Peminjaman'"
      :description="
        modalMode === 'create'
          ? 'Catat transaksi peminjaman buku fisik secara langsung di meja sirkulasi perpustakaan.'
          : 'Perbarui rincian batas pengembalian atau status peminjaman.'
      "
      :icon="ArrowUpCircleIcon"
      size="lg"
    >
      <form @submit.prevent="submitTransactionForm" class="space-y-4 pt-1">
        <!-- Pilihan Buku (Create Mode) -->
        <div v-if="modalMode === 'create'">
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Pilih Buku Fisik <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.bukuId"
            :disabled="transactionMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="" disabled>-- Pilih Koleksi Buku --</option>
            <option
              v-for="buku in availableBooks"
              :key="buku.id"
              :value="buku.id"
            >
              {{ buku.judul }} (Stok: {{ buku.jumlahStok }} Eks - ISBN: {{ buku.isbn }})
            </option>
          </select>
          <p v-if="formErrors.bukuId" class="text-xs text-red-500 mt-0.5 font-medium">
            {{ formErrors.bukuId }}
          </p>
        </div>

        <!-- Pilihan Anggota (Create Mode) -->
        <div v-if="modalMode === 'create'">
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Pilih Anggota Peminjam <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.anggotaId"
            :disabled="transactionMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="" disabled>-- Pilih Anggota / Siswa --</option>
            <option
              v-for="mem in availableMembers"
              :key="mem.id"
              :value="mem.id"
            >
              {{ mem.nama }} (NIS: {{ mem.nis }} - Telp: {{ mem.telepon }})
            </option>
          </select>
          <p v-if="formErrors.anggotaId" class="text-xs text-red-500 mt-0.5 font-medium">
            {{ formErrors.anggotaId }}
          </p>
        </div>

        <!-- Tanggal Pinjam & Batas Kembali -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Tanggal Pinjam <span class="text-red-500">*</span>
            </label>
            <Input
              type="date"
              v-model="form.tglPinjam"
              :disabled="modalMode === 'edit' || transactionMutation.isPending.value"
            />
            <p v-if="formErrors.tglPinjam" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.tglPinjam }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Batas Tanggal Kembali <span class="text-red-500">*</span>
            </label>
            <Input
              type="date"
              v-model="form.tglKembali"
              :disabled="transactionMutation.isPending.value"
            />
            <p v-if="formErrors.tglKembali" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.tglKembali }}
            </p>
          </div>
        </div>

        <!-- Status Transaksi -->
        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Status Transaksi
          </label>
          <select
            v-model="form.status"
            :disabled="transactionMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Menunggu Diambil">Menunggu Diambil</option>
            <option value="Dipinjam">Dipinjam (Aktif)</option>
            <option value="Dikembalikan">Dikembalikan (Selesai)</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Tidak Mengembalikan">Tidak Mengembalikan (Hilang)</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="transactionMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitTransactionForm"
          :disabled="transactionMutation.isPending.value"
        >
          {{ transactionMutation.isPending.value ? 'Menyimpan...' : 'Simpan Transaksi' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KONFIRMASI HAPUS TRANSAKSI -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Transaksi"
      :description="`Apakah Anda yakin ingin menghapus data transaksi '${transactionToDelete?.kdTransaksi}'? Tindakan ini tidak dapat dibatalkan.`"
      :icon="TrashIcon"
      icon-variant="danger"
      size="md"
    >
      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="deleteTransactionMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="dark"
          @click="confirmDeleteTransaction"
          :disabled="deleteTransactionMutation.isPending.value"
        >
          {{ deleteTransactionMutation.isPending.value ? 'Menghapus...' : 'Ya, Hapus Transaksi' }}
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
