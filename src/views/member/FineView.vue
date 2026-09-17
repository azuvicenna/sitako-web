<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  EyeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Card from '@/components/common/Card.vue';
import AccentCard from '@/components/common/AccentCard.vue';
import Table from '@/components/tables/Table.vue';
import FinePaymentOnlineModal from './components/FinePaymentOnlineModal.vue';
import FinePaymentDetailModal from './components/FinePaymentDetailModal.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import type { TableColumn, PaginationMeta } from '@/types/table';
import type { MemberFinePaymentItem, MemberFinePaymentListResponse } from '@/types/member-fine';
import type { MemberDashboardResponse } from '@/types/member-dashboard';
import type {
  MemberTransactionListResponse,
  MemberTransactionItem,
} from '@/types/member-transaction';

// --- STATE: FILTER & TABLE ---
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

// --- QUERY RINGKASAN DENDA DARI DASHBOARD ---
const { data: dashboardData, refetch: refetchDashboard } = useQuery({
  queryKey: ['member-dashboard'],
  queryFn: async () => {
    const res = await api.get<MemberDashboardResponse>('/member/dashboard');
    return res.data;
  },
});

const totalUnpaidFine = computed(() => dashboardData.value?.statistik.totalDenda ?? 0);

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

const payments = computed<MemberFinePaymentItem[]>(() => finePaymentsResponse.value?.data || []);
const meta = computed<PaginationMeta | null>(() => finePaymentsResponse.value?.meta || null);

// --- MODAL STATES ---
const isPayModalOpen = ref(false);
const openPayModal = () => {
  isPayModalOpen.value = true;
};

const isDetailModalOpen = ref(false);
const selectedPaymentId = ref<string | null>(null);

const openDetailModal = (paymentId: string) => {
  selectedPaymentId.value = paymentId;
  isDetailModalOpen.value = true;
};

// --- QUERY TRANSAKSI YANG TERKENA DENDA (TERLAMBAT / TIDAK MENGEMBALIKAN) ---
// Lazy-load: hanya dieksekusi saat modal bayar dibuka untuk menghemat request
const { data: penaltyTransactionsResponse, isLoading: isLoadingPenalty } = useQuery({
  queryKey: ['member-penalty-transactions'],
  queryFn: async () => {
    const [resLate, resLost] = await Promise.all([
      api.get<MemberTransactionListResponse>('/member/transactions/?status=Terlambat&limit=50'),
      api.get<MemberTransactionListResponse>(
        '/member/transactions/?status=Tidak Mengembalikan&limit=50',
      ),
    ]);
    const lateData = resLate.data?.data || [];
    const lostData = resLost.data?.data || [];
    return [...lateData, ...lostData];
  },
  enabled: computed(() => isPayModalOpen.value),
});

const penaltyTransactions = computed<MemberTransactionItem[]>(
  () => penaltyTransactionsResponse.value || [],
);

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
    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-emerald-50 rounded-xl text-emerald-600">
          <BanknotesIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">
            Riwayat & Tagihan Denda
          </h1>
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
            () => {
              refetchPayments();
              refetchDashboard();
            }
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
          class="text-xs font-semibold bg-rose-600! hover:bg-rose-700! text-white!"
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
          {{
            totalUnpaidFine > 0
              ? 'Kewajiban denda yang perlu dilunasi'
              : 'Tidak ada tanggungan denda'
          }}
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
          {{
            totalUnpaidFine > 0
              ? 'Lunasi denda untuk meminjam buku baru'
              : 'Dapat meminjam buku fisik di perpustakaan'
          }}
        </p>
      </AccentCard>
    </div>

    <!-- FILTER & PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="w-full sm:w-80">
          <Input
            :model-value="search"
            placeholder="Cari ID transaksi atau metode bayar..."
            class="w-full"
            @update:model-value="handleSearchChange"
          >
            <template #prefix>
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
            </template>
          </Input>
        </div>

        <div class="text-xs font-semibold text-gray-500">
          Total Riwayat:
          <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? payments.length }}</span>
          Transaksi
        </div>
      </div>
    </Card>

    <!-- TABEL RIWAYAT PEMBAYARAN -->
    <Card>
      <Table
        :columns="columns"
        :items="payments"
        :meta="meta"
        :loading="isLoading"
        empty-message="Belum ada riwayat pembayaran denda yang tercatat."
        @change-page="handlePageChange"
      >
        <!-- ID Transaksi -->
        <template #cell-kdTransaksi="{ item }">
          <span class="font-mono text-xs font-bold text-charcoalDark">
            {{ item.kdTransaksi }}
          </span>
        </template>

        <!-- Judul Buku -->
        <template #cell-judulBuku="{ item }">
          <span
            class="font-semibold text-charcoalDark line-clamp-1 text-xs"
            :title="item.judulBuku"
          >
            {{ item.judulBuku }}
          </span>
        </template>

        <!-- Nominal Denda -->
        <template #cell-totalDenda="{ item }">
          <span class="font-bold text-xs text-emerald-700">
            {{ formatRupiah(item.totalDenda) }}
          </span>
        </template>

        <!-- Metode Pembayaran -->
        <template #cell-metodePembayaran="{ item }">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-charcoalDark">
            {{ item.metodePembayaran }}
          </span>
        </template>

        <!-- Petugas -->
        <template #cell-namaPustakawan="{ item }">
          <span class="text-xs text-gray-600">
            {{ item.namaPustakawan || 'Sistem (Online Tripay)' }}
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
            class="p-1.5! text-gray-600 hover:text-charcoalDark"
            title="Lihat Detail Pembayaran"
          >
            <EyeIcon class="w-4 h-4" />
          </Button>
        </template>
      </Table>
    </Card>

    <!-- MODAL BAYAR DENDA ONLINE TRIPAY -->
    <FinePaymentOnlineModal
      v-model="isPayModalOpen"
      :penalty-transactions="penaltyTransactions"
      :loading="isLoadingPenalty"
    />

    <!-- MODAL DETAIL PEMBAYARAN DENDA -->
    <FinePaymentDetailModal v-model="isDetailModalOpen" :payment-id="selectedPaymentId" />
  </div>
</template>
