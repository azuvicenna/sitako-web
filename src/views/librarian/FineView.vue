<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  BanknotesIcon,
  Cog6ToothIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  UserIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { useAuthStore } from '@/stores/auth';
import {
  createFineSchema,
  updateFineSchema,
} from '@/validations/librarian/fine.schema';
import {
  createFinePaymentSchema,
  updateFinePaymentSchema,
} from '@/validations/librarian/fine-payment.schema';
import type { TableColumn } from '@/types/table';
import type {
  FineRule,
  FinePayment,
  FineRuleListResponse,
  FinePaymentListResponse,
} from '@/types/fine';

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

// --- STATE: TAB AKTIF & SEARCH ---
const activeTab = ref<'payments' | 'rules'>('payments');
const page = ref(1);
const search = ref('');
const debouncedSearch = ref('');

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

const handleTabChange = (tab: 'payments' | 'rules') => {
  activeTab.value = tab;
  page.value = 1;
  search.value = '';
  debouncedSearch.value = '';
};

// --- DATA PEMBAYARAN DENDA ---
const {
  data: paymentsResponse,
  isLoading: isLoadingPayments,
} = useQuery({
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
const {
  data: rulesResponse,
  isLoading: isLoadingRules,
} = useQuery({
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

// Data master buku untuk pilihan dropdown
const { data: booksResponse } = useQuery({
  queryKey: ['books-all-dropdown'],
  queryFn: async () => {
    const res = await api.get('/books?limit=100');
    return res.data;
  },
});
const availableBooks = computed<any[]>(() => booksResponse.value?.data || []);

// Data master anggota untuk pilihan dropdown pembayaran
const { data: membersResponse } = useQuery({
  queryKey: ['members-dropdown'],
  queryFn: async () => {
    const res = await api.get('/user/members/?statusActive=true&limit=100');
    return res.data;
  },
});
const availableMembers = computed<any[]>(() => membersResponse.value?.data || []);

// Data transaksi peminjaman untuk pilihan dropdown pembayaran
const { data: transactionsResponse } = useQuery({
  queryKey: ['transactions-dropdown'],
  queryFn: async () => {
    const res = await api.get('/transactions/?status=Semua&limit=100');
    return res.data;
  },
});
const availableTransactions = computed<any[]>(() => transactionsResponse.value?.data || []);

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

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- MODAL: PEMBAYARAN DENDA ---
const isPaymentModalOpen = ref(false);
const paymentModalMode = ref<'create' | 'edit'>('create');

const paymentForm = reactive({
  id: '',
  transaksiId: '',
  anggotaId: '',
  pustakawanId: '',
  hargaDenda: 1000,
  totalDenda: 1000,
  metodePembayaran: 'Tunai' as 'Tunai' | 'Non-Tunai',
  paymentStatus: 'PAID' as 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED',
  tglBayar: dayjs().format('YYYY-MM-DD'),
});

const paymentErrors = ref<Record<string, string | undefined>>({});

const openCreatePaymentModal = () => {
  paymentModalMode.value = 'create';
  paymentForm.id = '';
  paymentForm.transaksiId = '';
  paymentForm.anggotaId = '';
  paymentForm.pustakawanId = authStore.user?.id || '';
  paymentForm.hargaDenda = 1000;
  paymentForm.totalDenda = 1000;
  paymentForm.metodePembayaran = 'Tunai';
  paymentForm.paymentStatus = 'PAID';
  paymentForm.tglBayar = dayjs().format('YYYY-MM-DD');
  paymentErrors.value = {};
  isPaymentModalOpen.value = true;
};

const openEditPaymentModal = (item: FinePayment) => {
  paymentModalMode.value = 'edit';
  paymentForm.id = item.id;
  paymentForm.transaksiId = item.transaksiId || '';
  paymentForm.anggotaId = item.anggotaId || '';
  paymentForm.pustakawanId = item.pustakawanId || authStore.user?.id || '';
  paymentForm.hargaDenda = item.hargaDenda;
  paymentForm.totalDenda = item.totalDenda;
  paymentForm.metodePembayaran = item.metodePembayaran;
  paymentForm.paymentStatus = item.paymentStatus || 'PAID';
  paymentForm.tglBayar = item.tglBayar ? dayjs(item.tglBayar).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  paymentErrors.value = {};
  isPaymentModalOpen.value = true;
};

const paymentMutation = useMutation({
  mutationFn: async (payload: typeof paymentForm) => {
    if (paymentModalMode.value === 'create') {
      const res = await api.post('/fine-payments/', {
        transaksiId: payload.transaksiId,
        anggotaId: payload.anggotaId,
        pustakawanId: payload.pustakawanId || authStore.user?.id,
        hargaDenda: Number(payload.hargaDenda),
        totalDenda: Number(payload.totalDenda),
        metodePembayaran: payload.metodePembayaran,
        tglBayar: new Date(payload.tglBayar).toISOString(),
      });
      return res.data;
    } else {
      const res = await api.put(`/fine-payments/${payload.id}`, {
        totalDenda: Number(payload.totalDenda),
        metodePembayaran: payload.metodePembayaran,
        paymentStatus: payload.paymentStatus,
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fine-payments'] });
    isPaymentModalOpen.value = false;
    showToast(
      'success',
      paymentModalMode.value === 'create'
        ? 'Pembayaran denda berhasil dicatat!'
        : 'Data pembayaran denda berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menyimpan pembayaran denda.');
  },
});

const submitPaymentForm = () => {
  paymentErrors.value = {};

  if (paymentModalMode.value === 'create') {
    const validation = createFinePaymentSchema.safeParse({
      pustakawanId: paymentForm.pustakawanId || authStore.user?.id,
      anggotaId: paymentForm.anggotaId,
      transaksiId: paymentForm.transaksiId,
      hargaDenda: Number(paymentForm.hargaDenda),
      totalDenda: Number(paymentForm.totalDenda),
      metodePembayaran: paymentForm.metodePembayaran,
      tglBayar: new Date(paymentForm.tglBayar),
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      paymentErrors.value = {
        transaksiId: errors.transaksiId?.[0],
        anggotaId: errors.anggotaId?.[0],
        totalDenda: errors.totalDenda?.[0],
        hargaDenda: errors.hargaDenda?.[0],
      };
      return;
    }
  } else {
    const validation = updateFinePaymentSchema.safeParse({
      totalDenda: Number(paymentForm.totalDenda),
      metodePembayaran: paymentForm.metodePembayaran,
      paymentStatus: paymentForm.paymentStatus,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      paymentErrors.value = {
        totalDenda: errors.totalDenda?.[0],
      };
      return;
    }
  }

  paymentMutation.mutate(paymentForm);
};

// --- MODAL: ATURAN DENDA ---
const isRuleModalOpen = ref(false);
const ruleModalMode = ref<'create' | 'edit'>('create');

const ruleForm = reactive({
  id: '',
  bukuId: '',
  jenisDenda: 'Terlambat' as 'Terlambat' | 'Hilang',
  hargaDenda: 1000,
  metodePerhitungan: 'Akumulasi' as 'Akumulasi' | 'Flat',
});

const ruleErrors = ref<Record<string, string | undefined>>({});

const openCreateRuleModal = () => {
  ruleModalMode.value = 'create';
  ruleForm.id = '';
  ruleForm.bukuId = '';
  ruleForm.jenisDenda = 'Terlambat';
  ruleForm.hargaDenda = 1000;
  ruleForm.metodePerhitungan = 'Akumulasi';
  ruleErrors.value = {};
  isRuleModalOpen.value = true;
};

const openEditRuleModal = (rule: FineRule) => {
  ruleModalMode.value = 'edit';
  ruleForm.id = rule.id;
  ruleForm.bukuId = rule.bukuId;
  ruleForm.jenisDenda = rule.jenisDenda;
  ruleForm.hargaDenda = rule.hargaDenda;
  ruleForm.metodePerhitungan = rule.metodePerhitungan;
  ruleErrors.value = {};
  isRuleModalOpen.value = true;
};

const ruleMutation = useMutation({
  mutationFn: async (payload: typeof ruleForm) => {
    if (ruleModalMode.value === 'create') {
      const res = await api.post('/fines/', {
        bukuId: payload.bukuId,
        jenisDenda: payload.jenisDenda,
        hargaDenda: Number(payload.hargaDenda),
        metodePerhitungan: payload.metodePerhitungan,
      });
      return res.data;
    } else {
      const res = await api.put(`/fines/${payload.id}`, {
        hargaDenda: Number(payload.hargaDenda),
        metodePerhitungan: payload.metodePerhitungan,
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fine-rules'] });
    isRuleModalOpen.value = false;
    showToast(
      'success',
      ruleModalMode.value === 'create'
        ? 'Aturan denda baru berhasil disimpan!'
        : 'Aturan denda berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menyimpan aturan denda.');
  },
});

const submitRuleForm = () => {
  ruleErrors.value = {};

  if (ruleModalMode.value === 'create') {
    const validation = createFineSchema.safeParse({
      bukuId: ruleForm.bukuId,
      jenisDenda: ruleForm.jenisDenda,
      hargaDenda: Number(ruleForm.hargaDenda),
      metodePerhitungan: ruleForm.metodePerhitungan,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      ruleErrors.value = {
        bukuId: errors.bukuId?.[0],
        hargaDenda: errors.hargaDenda?.[0],
      };
      return;
    }
  } else {
    const validation = updateFineSchema.safeParse({
      hargaDenda: Number(ruleForm.hargaDenda),
      metodePerhitungan: ruleForm.metodePerhitungan,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      ruleErrors.value = {
        hargaDenda: errors.hargaDenda?.[0],
      };
      return;
    }
  }

  ruleMutation.mutate(ruleForm);
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
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus data.');
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
              <span class="truncate max-w-[200px]">{{ item.judulBuku || '-' }}</span>
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
              <p class="font-semibold text-charcoalDark text-xs">{{ item.namaAnggota || item.anggotaId }}</p>
              <p v-if="item.namaPustakawan" class="text-[10px] text-gray-400">Pencatat: {{ item.namaPustakawan }}</p>
            </div>
          </div>
        </template>

        <!-- Cell Total Denda -->
        <template #cell-totalDenda="{ item }">
          <div>
            <span class="font-bold text-sm text-charcoalDark block leading-none">
              {{ formatRupiah(item.totalDenda) }}
            </span>
            <span class="text-[10px] text-gray-400">Tarif: {{ formatRupiah(item.hargaDenda) }}</span>
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
                item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              ]"
            >
              {{ item.paymentStatus }}
            </span>
          </div>
        </template>

        <!-- Cell Tanggal Bayar -->
        <template #cell-tglBayar="{ item }">
          <span class="text-xs text-gray-500">
            {{ item.tglBayar ? dayjs(item.tglBayar).format('DD MMM YYYY, HH:mm') : dayjs(item.createdAt).format('DD MMM YYYY') }}
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
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-mustardHover flex items-center justify-center shrink-0">
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
                : 'bg-purple-50 text-purple-700 border border-purple-200'
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
    <Modal
      v-model="isPaymentModalOpen"
      :title="paymentModalMode === 'create' ? 'Catat Pembayaran Denda Tunai' : 'Ubah Data Pembayaran Denda'"
      :description="
        paymentModalMode === 'create'
          ? 'Catat pembayaran denda secara langsung (tunai) di meja sirkulasi perpustakaan.'
          : 'Perbarui rincian atau status verifikasi pembayaran denda.'
      "
      :icon="BanknotesIcon"
      size="lg"
    >
      <form @submit.prevent="submitPaymentForm" class="space-y-4 pt-1">
        <!-- Transaksi Terkait (Jika Create) -->
        <div v-if="paymentModalMode === 'create'">
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Pilih Transaksi Sirkulasi <span class="text-red-500">*</span>
          </label>
          <select
            v-model="paymentForm.transaksiId"
            :disabled="paymentMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="" disabled>-- Pilih Transaksi --</option>
            <option
              v-for="trx in availableTransactions"
              :key="trx.id"
              :value="trx.id"
            >
              {{ trx.kdTransaksi }} - {{ trx.namaAnggota }} ({{ trx.judulBuku }})
            </option>
          </select>
          <p v-if="paymentErrors.transaksiId" class="text-xs text-red-500 mt-0.5 font-medium">
            {{ paymentErrors.transaksiId }}
          </p>
        </div>

        <!-- Anggota Terkait (Jika Create) -->
        <div v-if="paymentModalMode === 'create'">
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Anggota / Siswa <span class="text-red-500">*</span>
          </label>
          <select
            v-model="paymentForm.anggotaId"
            :disabled="paymentMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="" disabled>-- Pilih Anggota --</option>
            <option
              v-for="mem in availableMembers"
              :key="mem.id"
              :value="mem.id"
            >
              {{ mem.nama }} (NIS: {{ mem.nis }})
            </option>
          </select>
          <p v-if="paymentErrors.anggotaId" class="text-xs text-red-500 mt-0.5 font-medium">
            {{ paymentErrors.anggotaId }}
          </p>
        </div>

        <!-- Grid Nominal -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Tarif Dasar Denda (Rp) <span class="text-red-500">*</span>
            </label>
            <Input
              type="number"
              v-model="paymentForm.hargaDenda"
              placeholder="1000"
              :disabled="paymentMutation.isPending.value"
            />
            <p v-if="paymentErrors.hargaDenda" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ paymentErrors.hargaDenda }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Total Denda Diterima (Rp) <span class="text-red-500">*</span>
            </label>
            <Input
              type="number"
              v-model="paymentForm.totalDenda"
              placeholder="1000"
              :disabled="paymentMutation.isPending.value"
            />
            <p v-if="paymentErrors.totalDenda" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ paymentErrors.totalDenda }}
            </p>
          </div>
        </div>

        <!-- Grid Metode & Status (Jika Edit) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Metode Pembayaran
            </label>
            <select
              v-model="paymentForm.metodePembayaran"
              :disabled="paymentMutation.isPending.value"
              class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
            >
              <option value="Tunai">Tunai (Di Perpustakaan)</option>
              <option value="Non-Tunai">Non-Tunai (Tripay Gateway)</option>
            </select>
          </div>

          <div v-if="paymentModalMode === 'edit'">
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Status Pembayaran
            </label>
            <select
              v-model="paymentForm.paymentStatus"
              :disabled="paymentMutation.isPending.value"
              class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
            >
              <option value="PAID">Lunas (PAID)</option>
              <option value="UNPAID">Belum Dibayar (UNPAID)</option>
              <option value="EXPIRED">Kedaluwarsa (EXPIRED)</option>
              <option value="FAILED">Gagal (FAILED)</option>
            </select>
          </div>

          <div v-else>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Tanggal Pembayaran
            </label>
            <Input
              type="date"
              v-model="paymentForm.tglBayar"
              :disabled="paymentMutation.isPending.value"
            />
          </div>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="paymentMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitPaymentForm"
          :disabled="paymentMutation.isPending.value"
        >
          {{ paymentMutation.isPending.value ? 'Menyimpan...' : 'Simpan Pembayaran' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL TAMBAH / EDIT ATURAN DENDA -->
    <Modal
      v-model="isRuleModalOpen"
      :title="ruleModalMode === 'create' ? 'Tambah Aturan Tarif Denda' : 'Ubah Aturan Tarif Denda'"
      :description="
        ruleModalMode === 'create'
          ? 'Tentukan besaran nominal tarif denda dan metode perhitungan per buku.'
          : 'Perbarui besaran tarif denda atau metode perhitungannya.'
      "
      :icon="Cog6ToothIcon"
      size="md"
    >
      <form @submit.prevent="submitRuleForm" class="space-y-4 pt-1">
        <div v-if="ruleModalMode === 'create'">
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Pilih Buku <span class="text-red-500">*</span>
          </label>
          <select
            v-model="ruleForm.bukuId"
            :disabled="ruleMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="" disabled>-- Pilih Buku --</option>
            <option
              v-for="buku in availableBooks"
              :key="buku.id"
              :value="buku.id"
            >
              {{ buku.judul }} ({{ buku.isbn || 'No ISBN' }})
            </option>
          </select>
          <p v-if="ruleErrors.bukuId" class="text-xs text-red-500 mt-0.5 font-medium">
            {{ ruleErrors.bukuId }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Jenis Pelanggaran Denda <span class="text-red-500">*</span>
          </label>
          <select
            v-model="ruleForm.jenisDenda"
            :disabled="ruleMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="Terlambat">Keterlambatan Pengembalian</option>
            <option value="Hilang">Buku Hilang / Rusak Berat</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Nomor Tarif Denda (Rp) <span class="text-red-500">*</span>
          </label>
          <Input
            type="number"
            v-model="ruleForm.hargaDenda"
            placeholder="Contoh: 1000"
            :disabled="ruleMutation.isPending.value"
          />
          <p v-if="ruleErrors.hargaDenda" class="text-xs text-red-500 mt-0.5 font-medium">
            {{ ruleErrors.hargaDenda }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1">
            Metode Perhitungan <span class="text-red-500">*</span>
          </label>
          <select
            v-model="ruleForm.metodePerhitungan"
            :disabled="ruleMutation.isPending.value"
            class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
          >
            <option value="Akumulasi">Akumulasi (Dikalikan per hari keterlambatan)</option>
            <option value="Flat">Flat (Tarif tetap satu kali bayar)</option>
          </select>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="ruleMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitRuleForm"
          :disabled="ruleMutation.isPending.value"
        >
          {{ ruleMutation.isPending.value ? 'Menyimpan...' : 'Simpan Aturan' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KONFIRMASI HAPUS -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus"
      :description="`Apakah Anda yakin ingin menghapus data '${itemToDelete?.label}'? Tindakan ini tidak dapat dibatalkan.`"
      :icon="TrashIcon"
      icon-variant="danger"
      size="md"
    >
      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="deleteMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="dark"
          @click="confirmDelete"
          :disabled="deleteMutation.isPending.value"
        >
          {{ deleteMutation.isPending.value ? 'Menghapus...' : 'Ya, Hapus' }}
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
