<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  QrCodeIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Card from '@/components/common/Card.vue';
import AccentCard from '@/components/common/AccentCard.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import type { TableColumn, PaginationMeta } from '@/types/table';
import type {
  MemberFinePaymentItem,
  MemberFinePaymentListResponse,
  MemberFinePaymentDetailResponse,
  InitiatePaymentResponse,
} from '@/types/member-fine';
import type { MemberDashboardResponse } from '@/types/member-dashboard';
import type { MemberTransactionListResponse, MemberTransactionItem } from '@/types/member-transaction';

const queryClient = useQueryClient();

// --- STATE: TOAST NOTIFIKASI ---
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

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

// --- QUERY RINGKASAN DENDA DARI DASHBOARD ---
const { data: dashboardData, refetch: refetchDashboard } = useQuery({
  queryKey: ['member-dashboard'],
  queryFn: async () => {
    const res = await api.get<MemberDashboardResponse>('/member/dashboard');
    return res.data;
  },
});

const totalUnpaidFine = computed(() => dashboardData.value?.statistik.totalDenda ?? 0);
const pendingBills = computed(() => dashboardData.value?.tagihanDenda || []);

// --- QUERY DAFTAR RIWAYAT PEMBAYARAN DENDA ---
const {
  data: finePaymentsResponse,
  isLoading,
  isFetching,
  refetch: refetchPayments,
} = useQuery({
  queryKey: ['member-fine-payments', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });

    const res = await api.get<MemberFinePaymentListResponse>(`/member/fine-payments/?${params}`);
    return res.data;
  },
});

const payments = computed<MemberFinePaymentItem[]>(
  () => finePaymentsResponse.value?.data || [],
);
const meta = computed<PaginationMeta | null>(
  () => finePaymentsResponse.value?.meta || null,
);

// --- QUERY TRANSAKSI YANG TERKENA DENDA (TERLAMBAT / TIDAK MENGEMBALIKAN) ---
const { data: penaltyTransactionsResponse } = useQuery({
  queryKey: ['member-penalty-transactions'],
  queryFn: async () => {
    const [resLate, resLost] = await Promise.all([
      api.get<MemberTransactionListResponse>('/member/transactions/?status=Terlambat&limit=50'),
      api.get<MemberTransactionListResponse>('/member/transactions/?status=Tidak Mengembalikan&limit=50'),
    ]);
    const lateData = resLate.data?.data || [];
    const lostData = resLost.data?.data || [];
    return [...lateData, ...lostData];
  },
});

const penaltyTransactions = computed<MemberTransactionItem[]>(
  () => penaltyTransactionsResponse.value || [],
);

// --- STATE: MODAL BAYAR DENDA ONLINE TRIPAY ---
const isPayModalOpen = ref(false);
const payForm = reactive({
  transaksiId: '',
  paymentMethodCode: 'QRIS',
});
const payErrors = ref<Record<string, string>>({});
const isSubmittingPayment = ref(false);
const paymentResult = ref<InitiatePaymentResponse | null>(null);

const paymentMethods = [
  { code: 'QRIS', name: 'QRIS (Gopay, OVO, Dana, LinkAja, ShopeePay)', type: 'E-Wallet / QR' },
  { code: 'BRIVA', name: 'BRI Virtual Account (BRIVA)', type: 'Virtual Account' },
  { code: 'BNIVA', name: 'BNI Virtual Account', type: 'Virtual Account' },
  { code: 'BCAVA', name: 'BCA Virtual Account', type: 'Virtual Account' },
  { code: 'MANDIRIVA', name: 'Mandiri Virtual Account', type: 'Virtual Account' },
];

const openPayModal = () => {
  payForm.transaksiId = penaltyTransactions.value[0]?.id || '';
  payForm.paymentMethodCode = 'QRIS';
  payErrors.value = {};
  paymentResult.value = null;
  isPayModalOpen.value = true;
};

const closePayModal = () => {
  isPayModalOpen.value = false;
  paymentResult.value = null;
};

const submitPayment = async () => {
  payErrors.value = {};

  if (!payForm.transaksiId) {
    payErrors.value.transaksiId = 'Transaksi yang terkena denda wajib dipilih';
  }
  if (!payForm.paymentMethodCode) {
    payErrors.value.paymentMethodCode = 'Metode pembayaran wajib dipilih';
  }

  if (Object.keys(payErrors.value).length > 0) return;

  isSubmittingPayment.value = true;
  try {
    const res = await api.post<InitiatePaymentResponse>('/member/fine-payments/pay', {
      transaksiId: payForm.transaksiId,
      paymentMethodCode: payForm.paymentMethodCode,
    });

    paymentResult.value = res.data;
    showToast('success', 'Tagihan pembayaran berhasil dibuat!');
    queryClient.invalidateQueries({ queryKey: ['member-fine-payments'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal menginisiasi pembayaran denda',
    );
  } finally {
    isSubmittingPayment.value = false;
  }
};

// --- STATE: MODAL DETAIL PEMBAYARAN ---
const isDetailModalOpen = ref(false);
const detailPayment = ref<MemberFinePaymentDetailResponse | null>(null);
const isLoadingDetail = ref(false);

const openDetailModal = async (paymentId: string) => {
  isDetailModalOpen.value = true;
  isLoadingDetail.value = true;
  detailPayment.value = null;

  try {
    const res = await api.get<MemberFinePaymentDetailResponse>(
      `/member/fine-payments/detail/${paymentId}`,
    );
    detailPayment.value = res.data;
  } catch (error: any) {
    console.error('Fetch payment detail error:', error);
    showToast('danger', error.response?.data?.message || 'Gagal memuat detail pembayaran');
    isDetailModalOpen.value = false;
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  detailPayment.value = null;
};

// Kolom tabel
const columns: TableColumn<MemberFinePaymentItem>[] = [
  { key: 'kdTransaksi', label: 'ID Transaksi' },
  { key: 'judulBuku', label: 'Judul Buku' },
  { key: 'totalDenda', label: 'Nominal Denda' },
  { key: 'metodePembayaran', label: 'Metode Bayar' },
  { key: 'namaPustakawan', label: 'Petugas' },
  { key: 'tglBayar', label: 'Tanggal Bayar' },
  { key: 'aksi', label: 'Aksi', align: 'center' },
];
</script>

<template>
  <div class="space-y-6">
    <!-- TOAST NOTIFIKASI -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="toast" class="fixed top-5 right-5 z-50 max-w-sm w-full">
        <Alert :type="toast.type" dismissible @close="toast = null">
          {{ toast.message }}
        </Alert>
      </div>
    </Transition>

    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-emerald-50 rounded-xl text-emerald-600">
          <BanknotesIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Riwayat & Tagihan Denda</h1>
          <p class="text-sm text-gray-500 mt-1">
            Pantau kewajiban denda keterlambatan dan bayar secara online dengan mudah via Tripay.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="isFetching"
          @click="
            refetchPayments();
            refetchDashboard();
          "
          class="text-xs font-semibold"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isFetching }" />
          Segarkan
        </Button>

        <Button
          v-if="totalUnpaidFine > 0 || penaltyTransactions.length > 0"
          variant="primary"
          size="sm"
          @click="openPayModal"
          class="text-xs font-semibold !bg-rose-600 hover:!bg-rose-700 !text-white"
        >
          <CreditCardIcon class="w-4 h-4 mr-1.5" />
          Bayar Denda Online
        </Button>
      </div>
    </div>

    <!-- STATS SUMMARY CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- 1. Total Denda Belum Lunas -->
      <AccentCard
        :accent-color="totalUnpaidFine > 0 ? 'border-t-rose-500' : 'border-t-emerald-500'"
      >
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Tagihan Denda Aktif
          </p>
          <BanknotesIcon
            class="w-5 h-5"
            :class="totalUnpaidFine > 0 ? 'text-rose-600' : 'text-emerald-600'"
          />
        </div>
        <h3
          class="text-3xl font-bold"
          :class="totalUnpaidFine > 0 ? 'text-rose-600' : 'text-emerald-600'"
        >
          {{ formatRupiah(totalUnpaidFine) }}
        </h3>
        <p class="text-xs text-gray-500 mt-3">
          {{ totalUnpaidFine > 0 ? 'Kewajiban denda yang perlu dilunasi' : 'Tidak ada tanggungan denda' }}
        </p>
      </AccentCard>

      <!-- 2. Jumlah Pembayaran Sukses -->
      <AccentCard accent-color="border-t-sky-500">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Denda Terselesaikan
          </p>
          <CheckCircleIcon class="w-5 h-5 text-sky-600" />
        </div>
        <h3 class="text-3xl font-bold text-charcoalDark">
          {{ meta?.totalRows ?? 0 }}
        </h3>
        <p class="text-xs text-gray-500 mt-3">Transaksi denda yang telah lunas</p>
      </AccentCard>

      <!-- 3. Status Akses Peminjaman -->
      <AccentCard accent-color="border-t-mustard">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Status Layanan Akun
          </p>
          <ShieldCheckIcon class="w-5 h-5 text-mustard" />
        </div>
        <h3
          class="text-xl font-bold mt-1"
          :class="totalUnpaidFine > 0 ? 'text-amber-700' : 'text-emerald-700'"
        >
          {{ totalUnpaidFine > 0 ? 'Dibatasi (Ada Denda)' : 'Aktif Penuh' }}
        </h3>
        <p class="text-xs text-gray-500 mt-4">
          {{ totalUnpaidFine > 0 ? 'Lunasi denda untuk meminjam buku baru' : 'Dapat meminjam buku fisik di perpustakaan' }}
        </p>
      </AccentCard>
    </div>

    <!-- BANNER PERINGATAN TAGIHAN DENDA -->
    <Alert
      v-if="totalUnpaidFine > 0"
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
        <h4 class="text-sm font-bold text-charcoalDark">Anda Memiliki Kewajiban Denda Belum Lunas</h4>
      </template>
      <template #description>
        <p class="text-xs text-gray-600 mt-0.5">
          Total kewajiban: <span class="font-bold text-rose-700">{{ formatRupiah(totalUnpaidFine) }}</span>.
          Gunakan tombol bayar online untuk menyelesaikan pembayaran via QRIS atau Virtual Account.
        </p>
      </template>
      <template #action>
        <Button
          variant="primary"
          size="sm"
          @click="openPayModal"
          class="text-xs font-semibold !bg-rose-600 hover:!bg-rose-700 !text-white shrink-0"
        >
          <CreditCardIcon class="w-4 h-4 mr-1.5" />
          Bayar Online
        </Button>
      </template>
    </Alert>

    <!-- FILTER PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-bold text-charcoalDark">Riwayat Pembayaran Denda Selesai</h3>
          <p class="text-xs text-gray-500 mt-0.5">Daftar transaksi pembayaran denda yang telah terverifikasi</p>
        </div>

        <div class="w-full sm:w-80">
          <Input
            :model-value="search"
            placeholder="Cari kode transaksi, judul buku..."
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

    <!-- TABEL RIWAYAT PEMBAYARAN DENDA -->
    <Table
      :columns="columns"
      :items="payments"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada riwayat pembayaran denda yang tercatat."
      @change-page="(p) => (page = p)"
    >
      <!-- ID Transaksi -->
      <template #cell-kdTransaksi="{ item }">
        <span class="font-mono font-bold text-xs text-charcoalDark">
          {{ item.kdTransaksi }}
        </span>
      </template>

      <!-- Judul Buku -->
      <template #cell-judulBuku="{ item }">
        <span class="font-semibold text-xs text-charcoalDark line-clamp-1 max-w-xs" :title="item.judulBuku">
          {{ item.judulBuku }}
        </span>
      </template>

      <!-- Nominal Denda -->
      <template #cell-totalDenda="{ item }">
        <span class="font-bold text-xs text-emerald-700">
          {{ formatRupiah(item.totalDenda) }}
        </span>
      </template>

      <!-- Metode Bayar -->
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

      <!-- Petugas -->
      <template #cell-namaPustakawan="{ item }">
        <span class="text-xs text-gray-600">
          {{ item.namaPustakawan || 'Sistem / Otomatis' }}
        </span>
      </template>

      <!-- Tanggal Bayar -->
      <template #cell-tglBayar="{ item }">
        <span v-if="item.tglBayar" class="text-xs text-gray-600">
          {{ dayjs(item.tglBayar).format('DD/MM/YYYY HH:mm') }}
        </span>
        <span v-else class="text-xs text-gray-400 italic">-</span>
      </template>

      <!-- Aksi -->
      <template #cell-aksi="{ item }">
        <Button
          variant="secondary"
          size="sm"
          @click="openDetailModal(item.id)"
          class="!p-1.5 text-gray-600 hover:text-charcoalDark"
          title="Lihat Detail Pembayaran"
        >
          <EyeIcon class="w-4 h-4" />
        </Button>
      </template>
    </Table>

    <!-- MODAL BAYAR DENDA ONLINE TRIPAY -->
    <Modal
      v-model="isPayModalOpen"
      title="Bayar Denda Online (Tripay)"
      size="md"
      @close="closePayModal"
    >
      <!-- TAMPILAN SUKSES INISIASI PEMBAYARAN -->
      <div v-if="paymentResult" class="space-y-4">
        <Alert
          type="success"
          title="Tagihan Pembayaran Berhasil Dibuat"
          description="Silakan lanjutkan ke portal pembayaran resmi Tripay untuk menyelesaikan transaksi denda Anda."
        />

        <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-500">Nomor Referensi:</span>
            <span class="font-mono font-bold text-charcoalDark">
              {{ paymentResult.tripayReference || paymentResult.id }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Metode Bayar:</span>
            <span class="font-semibold text-charcoalDark">
              {{ paymentResult.paymentMethodCode }}
            </span>
          </div>
          <div class="flex justify-between text-sm pt-2 border-t border-gray-200 font-bold">
            <span>Total Tagihan:</span>
            <span class="text-emerald-700">
              {{ formatRupiah(paymentResult.totalDenda) }}
            </span>
          </div>
        </div>

        <div class="pt-2 flex flex-col gap-2">
          <a
            v-if="paymentResult.checkoutUrl"
            :href="paymentResult.checkoutUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            Buka Halaman Pembayaran Tripay
            <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          </a>

          <Button variant="secondary" size="sm" @click="closePayModal">
            Tutup Dialog
          </Button>
        </div>
      </div>

      <!-- FORM INISIASI PEMBAYARAN -->
      <form v-else @submit.prevent="submitPayment" class="space-y-4">
        <!-- Pilihan Transaksi Terkena Denda -->
        <div>
          <label class="block text-xs font-semibold text-charcoalDark mb-1">
            Pilih Transaksi Denda <span class="text-rose-500">*</span>
          </label>
          <select
            v-if="penaltyTransactions.length > 0"
            v-model="payForm.transaksiId"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
            :class="{ 'border-rose-500': payErrors.transaksiId }"
          >
            <option value="" disabled>-- Pilih transaksi yang terkena denda --</option>
            <option v-for="t in penaltyTransactions" :key="t.id" :value="t.id">
              {{ t.kdTransaksi }} - {{ t.judulBuku }} (Status: {{ t.status }})
            </option>
          </select>
          <div v-else class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
            Tidak ada transaksi peminjaman aktif yang berstatus terlambat saat ini.
          </div>
          <p v-if="payErrors.transaksiId" class="text-xs text-rose-500 mt-1">
            {{ payErrors.transaksiId }}
          </p>
        </div>

        <!-- Pilihan Metode Pembayaran Tripay -->
        <div>
          <label class="block text-xs font-semibold text-charcoalDark mb-1">
            Metode Pembayaran Online <span class="text-rose-500">*</span>
          </label>
          <div class="space-y-2">
            <label
              v-for="m in paymentMethods"
              :key="m.code"
              class="flex items-center justify-between p-3 border rounded-xl cursor-pointer transition"
              :class="
                payForm.paymentMethodCode === m.code
                  ? 'border-mustard bg-amber-50/50 shadow-xs'
                  : 'border-gray-200 hover:bg-gray-50'
              "
            >
              <div class="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  :value="m.code"
                  v-model="payForm.paymentMethodCode"
                  class="text-mustard focus:ring-mustard"
                />
                <div>
                  <p class="text-xs font-bold text-charcoalDark">{{ m.name }}</p>
                  <p class="text-[10px] text-gray-500">{{ m.type }}</p>
                </div>
              </div>
              <span class="text-xs font-mono font-semibold text-gray-400">
                {{ m.code }}
              </span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="secondary" size="sm" @click="closePayModal"> Batal </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            :loading="isSubmittingPayment"
            :disabled="penaltyTransactions.length === 0"
            class="text-xs font-semibold !bg-emerald-600 hover:!bg-emerald-700 !text-white"
          >
            Lanjutkan ke Pembayaran
          </Button>
        </div>
      </form>
    </Modal>

    <!-- MODAL DETAIL PEMBAYARAN DENDA -->
    <Modal
      v-model="isDetailModalOpen"
      title="Detail Pembayaran Denda"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="isLoadingDetail" class="py-8 text-center animate-pulse space-y-3">
        <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        <div class="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
      </div>

      <div v-else-if="detailPayment" class="space-y-4 text-xs">
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <div class="flex justify-between items-center pb-2 border-b border-gray-200">
            <span class="text-gray-500">Status Pembayaran</span>
            <Badge variant="success" size="sm">
              Lunas Terbayar
            </Badge>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Kode Transaksi</span>
            <span class="font-mono font-bold text-charcoalDark">
              {{ detailPayment.kdTransaksi }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Judul Buku</span>
            <span class="font-semibold text-charcoalDark text-right max-w-xs">
              {{ detailPayment.judulBuku }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Periode Pinjam</span>
            <span class="font-medium text-charcoalDark">
              {{ dayjs(detailPayment.tglPinjam).format('DD/MM/YYYY') }} s/d
              {{ dayjs(detailPayment.tglKembali).format('DD/MM/YYYY') }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Metode Pembayaran</span>
            <span class="font-semibold text-charcoalDark">
              {{ detailPayment.metodePembayaran }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Waktu Bayar</span>
            <span class="font-medium text-charcoalDark">
              {{ detailPayment.tglBayar ? dayjs(detailPayment.tglBayar).format('DD MMMM YYYY, HH:mm') : '-' }}
            </span>
          </div>
          <div class="flex justify-between text-sm pt-2 border-t border-gray-200 font-bold">
            <span>Total Denda:</span>
            <span class="text-emerald-700">
              {{ formatRupiah(detailPayment.totalDenda) }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <Button variant="secondary" size="sm" @click="closeDetailModal"> Tutup </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
