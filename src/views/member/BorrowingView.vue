<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  ArrowUpCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  UserIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowUturnLeftIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Card from '@/components/common/Card.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import type { TableColumn, PaginationMeta } from '@/types/table';
import type {
  MemberTransactionItem,
  MemberTransactionListResponse,
  ReturnTransactionResponse,
} from '@/types/member-transaction';
import type { CatalogListResponse, CatalogBookItem } from '@/types/member-catalog';
import type { LibrarianListResponse } from '@/types/user';
import type { LibrarianUser } from '@/types/auth';

const route = useRoute();
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
const statusFilter = ref<string>('Semua');

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

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
const meta = computed<PaginationMeta | null>(
  () => transactionsResponse.value?.meta || null,
);

// --- QUERY DROPDOWN BUKU FISIK ---
const { data: physicalBooksResponse } = useQuery({
  queryKey: ['member-dropdown-physical-books'],
  queryFn: async () => {
    const res = await api.get<CatalogListResponse>('/book?bookType=Fisik&limit=100');
    return res.data.data || [];
  },
});

const availableBooks = computed<CatalogBookItem[]>(
  () => physicalBooksResponse.value || [],
);

// --- QUERY DROPDOWN PUSTAKAWAN ---
const { data: librariansResponse } = useQuery({
  queryKey: ['member-dropdown-librarians'],
  queryFn: async () => {
    const res = await api.get<LibrarianListResponse>('/user/librarians/?limit=50&statusActive=true');
    return res.data.data || [];
  },
});

const librarians = computed<LibrarianUser[]>(() => librariansResponse.value || []);

// --- STATE: MODAL AJUKAN PEMINJAMAN ---
const isBorrowModalOpen = ref(false);
const borrowForm = reactive({
  bukuId: '',
  pustakawanId: '',
  tglPinjam: dayjs().format('YYYY-MM-DD'),
  tglKembali: dayjs().add(7, 'day').format('YYYY-MM-DD'),
});
const borrowErrors = ref<Record<string, string>>({});
const isSubmittingBorrow = ref(false);

const openBorrowModal = () => {
  borrowForm.bukuId = '';
  borrowForm.pustakawanId = librarians.value[0]?.id || '';
  borrowForm.tglPinjam = dayjs().format('YYYY-MM-DD');
  borrowForm.tglKembali = dayjs().add(7, 'day').format('YYYY-MM-DD');
  borrowErrors.value = {};
  isBorrowModalOpen.value = true;
};

const closeBorrowModal = () => {
  isBorrowModalOpen.value = false;
  borrowErrors.value = {};
};

const submitBorrowForm = async () => {
  borrowErrors.value = {};

  if (!borrowForm.bukuId) {
    borrowErrors.value.bukuId = 'Buku fisik wajib dipilih';
  }
  if (!borrowForm.pustakawanId) {
    borrowErrors.value.pustakawanId = 'Petugas pustakawan wajib dipilih';
  }
  if (!borrowForm.tglPinjam) {
    borrowErrors.value.tglPinjam = 'Tanggal pinjam wajib diisi';
  }
  if (!borrowForm.tglKembali) {
    borrowErrors.value.tglKembali = 'Tanggal kembali wajib diisi';
  }

  if (Object.keys(borrowErrors.value).length > 0) return;

  isSubmittingBorrow.value = true;
  try {
    await api.post('/member/transactions/', {
      bukuId: borrowForm.bukuId,
      pustakawanId: borrowForm.pustakawanId,
      tglPinjam: new Date(borrowForm.tglPinjam),
      tglKembali: new Date(borrowForm.tglKembali),
      status: 'Menunggu Persetujuan',
    });

    showToast('success', 'Pengajuan peminjaman berhasil dibuat! Menunggu persetujuan pustakawan.');
    queryClient.invalidateQueries({ queryKey: ['member-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    closeBorrowModal();
  } catch (error: any) {
    console.error('Create transaction error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal mengajukan peminjaman buku',
    );
  } finally {
    isSubmittingBorrow.value = false;
  }
};

// --- STATE: MODAL PENGEMBALIAN BUKU ---
const isReturnModalOpen = ref(false);
const selectedReturnTrx = ref<MemberTransactionItem | null>(null);
const isBukuHilang = ref(false);
const isSubmittingReturn = ref(false);
const returnResult = ref<ReturnTransactionResponse | null>(null);

const openReturnModal = (item: MemberTransactionItem) => {
  selectedReturnTrx.value = item;
  isBukuHilang.value = false;
  returnResult.value = null;
  isReturnModalOpen.value = true;
};

const closeReturnModal = () => {
  isReturnModalOpen.value = false;
  selectedReturnTrx.value = null;
  isBukuHilang.value = false;
  returnResult.value = null;
};

const submitReturn = async () => {
  if (!selectedReturnTrx.value) return;

  isSubmittingReturn.value = true;
  try {
    const res = await api.post<ReturnTransactionResponse>(
      `/member/transactions/${selectedReturnTrx.value.id}/return`,
      { isBukuHilang: isBukuHilang.value },
    );

    returnResult.value = res.data;
    showToast('success', res.data.pesan || 'Pengembalian berhasil diajukan!');
    queryClient.invalidateQueries({ queryKey: ['member-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
  } catch (error: any) {
    console.error('Return error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal mengajukan pengembalian buku',
    );
  } finally {
    isSubmittingReturn.value = false;
  }
};

// --- STATE: MODAL DETAIL TRANSAKSI ---
const isDetailModalOpen = ref(false);
const selectedDetailTrx = ref<MemberTransactionItem | null>(null);

const openDetailModal = (item: MemberTransactionItem) => {
  selectedDetailTrx.value = item;
  isDetailModalOpen.value = true;
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  selectedDetailTrx.value = null;
};

// Auto-open borrow modal if redirected with query params
onMounted(() => {
  if (route.query.bukuId) {
    borrowForm.bukuId = String(route.query.bukuId);
    borrowForm.pustakawanId = librarians.value[0]?.id || '';
    isBorrowModalOpen.value = true;
  }
});

// --- HELPER FORMAT STATUS & TEMPO ---
const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dipinjam':
      return 'warning';
    case 'Menunggu Diambil':
      return 'mustard';
    case 'Menunggu Persetujuan':
      return 'info';
    case 'Terlambat':
      return 'danger';
    case 'Dikembalikan':
      return 'success';
    case 'Dibatalkan':
    case 'Tidak Mengembalikan':
      return 'danger';
    default:
      return 'neutral';
  }
};

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
        <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
          <ArrowUpCircleIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Peminjaman Saya</h1>
          <p class="text-sm text-gray-500 mt-1">
            Pantau status peminjaman buku fisik, tenggat waktu pengembalian, dan ajukan peminjaman mandiri.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="isFetching"
          @click="refetch"
          class="text-xs font-semibold"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isFetching }" />
          Segarkan
        </Button>

        <Button
          variant="primary"
          size="sm"
          @click="openBorrowModal"
          class="text-xs font-semibold"
        >
          <PlusIcon class="w-4 h-4 mr-1.5" />
          Ajukan Pinjam Baru
        </Button>
      </div>
    </div>

    <!-- FILTER STATUS PILLS & PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Status Tabs -->
        <div class="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl overflow-x-auto">
          <button
            v-for="st in [
              'Semua',
              'Menunggu Persetujuan',
              'Menunggu Diambil',
              'Dipinjam',
              'Dikembalikan',
              'Terlambat',
            ]"
            :key="st"
            type="button"
            @click="handleStatusFilter(st)"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
              statusFilter === st
                ? 'bg-white text-charcoalDark shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ st }}
          </button>
        </div>

        <!-- Input Pencarian -->
        <div class="w-full md:w-72">
          <Input
            :model-value="search"
            placeholder="Cari kode transaksi / judul buku..."
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

    <!-- TABEL TRANSAKSI SAYA -->
    <Table
      :columns="columns"
      :items="transactions"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada riwayat peminjaman untuk kategori ini."
      @change-page="(p) => (page = p)"
    >
      <!-- ID Pinjam -->
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

      <!-- Petugas -->
      <template #cell-namaPustakawan="{ item }">
        <span class="text-xs text-gray-600 flex items-center gap-1">
          <UserIcon class="w-3.5 h-3.5 text-gray-400" />
          {{ item.namaPustakawan || '-' }}
        </span>
      </template>

      <!-- Tgl Pinjam -->
      <template #cell-tglPinjam="{ item }">
        <span class="text-xs text-gray-600">
          {{ dayjs(item.tglPinjam).format('DD/MM/YYYY') }}
        </span>
      </template>

      <!-- Batas Kembali -->
      <template #cell-tglKembali="{ item }">
        <div class="text-xs">
          <span
            :class="[
              'font-medium block',
              dayjs().isAfter(dayjs(item.tglKembali)) && item.status === 'Dipinjam'
                ? 'text-rose-600 font-bold'
                : 'text-gray-700',
            ]"
          >
            {{ dayjs(item.tglKembali).format('DD/MM/YYYY') }}
          </span>
          <span
            v-if="dayjs().isAfter(dayjs(item.tglKembali)) && item.status === 'Dipinjam'"
            class="text-[10px] text-rose-500 font-semibold"
          >
            (Lewat Tempo)
          </span>
        </div>
      </template>

      <!-- Status -->
      <template #cell-status="{ item }">
        <Badge :variant="getStatusBadgeVariant(item.status)" size="sm">
          {{ item.status }}
        </Badge>
      </template>

      <!-- Aksi -->
      <template #cell-aksi="{ item }">
        <div class="flex items-center justify-center gap-1.5">
          <!-- Tombol Detail -->
          <Button
            variant="secondary"
            size="sm"
            @click="openDetailModal(item)"
            class="!p-1.5 text-gray-600 hover:text-charcoalDark"
            title="Lihat Detail Transaksi"
          >
            <EyeIcon class="w-4 h-4" />
          </Button>

          <!-- Tombol Pengembalian (Hanya jika status Dipinjam atau Terlambat) -->
          <Button
            v-if="item.status === 'Dipinjam' || item.status === 'Terlambat'"
            variant="secondary"
            size="sm"
            @click="openReturnModal(item)"
            class="text-xs font-semibold !text-emerald-700 hover:!bg-emerald-50 !border-emerald-300"
            title="Ajukan Pengembalian Buku"
          >
            <ArrowUturnLeftIcon class="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Kembalikan
          </Button>
        </div>
      </template>
    </Table>

    <!-- MODAL AJUKAN PEMINJAMAN BARU -->
    <Modal
      v-model="isBorrowModalOpen"
      title="Ajukan Peminjaman Buku Fisik"
      size="lg"
      @close="closeBorrowModal"
    >
      <form @submit.prevent="submitBorrowForm" class="space-y-4">
        <!-- Pilihan Buku Fisik -->
        <div>
          <label class="block text-xs font-semibold text-charcoalDark mb-1">
            Pilih Buku Fisik <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="borrowForm.bukuId"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
            :class="{ 'border-rose-500': borrowErrors.bukuId }"
          >
            <option value="" disabled>-- Pilih buku yang tersedia --</option>
            <option
              v-for="b in availableBooks"
              :key="b.id"
              :value="b.id"
              :disabled="b.jumlahStok <= 0"
            >
              {{ b.judul }} (Penulis: {{ b.penulis }}) - Stok: {{ b.jumlahStok }}
            </option>
          </select>
          <p v-if="borrowErrors.bukuId" class="text-xs text-rose-500 mt-1">
            {{ borrowErrors.bukuId }}
          </p>
        </div>

        <!-- Pilihan Petugas Pustakawan -->
        <div>
          <label class="block text-xs font-semibold text-charcoalDark mb-1">
            Petugas Meja Sirkulasi <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="borrowForm.pustakawanId"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
            :class="{ 'border-rose-500': borrowErrors.pustakawanId }"
          >
            <option value="" disabled>-- Pilih petugas sirkulasi --</option>
            <option v-for="p in librarians" :key="p.id" :value="p.id">
              {{ p.nama }} (NIP: {{ p.nip }})
            </option>
          </select>
          <p v-if="borrowErrors.pustakawanId" class="text-xs text-rose-500 mt-1">
            {{ borrowErrors.pustakawanId }}
          </p>
        </div>

        <!-- Tanggal Pinjam & Batas Kembali -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-charcoalDark mb-1">
              Tanggal Mulai Pinjam <span class="text-rose-500">*</span>
            </label>
            <input
              type="date"
              v-model="borrowForm.tglPinjam"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-charcoalDark mb-1">
              Batas Waktu Pengembalian <span class="text-rose-500">*</span>
            </label>
            <input
              type="date"
              v-model="borrowForm.tglKembali"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
            />
          </div>
        </div>

        <!-- Regulasi Info -->
        <Alert
          type="info"
          title="Ketentuan Sirkulasi Mandiri"
          description="Setelah pengajuan dibuat, Anda dapat mengambil buku fisik di meja sirkulasi perpustakaan dengan menunjukkan kode transaksi kepada petugas."
        />

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="secondary" size="sm" @click="closeBorrowModal"> Batal </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            :loading="isSubmittingBorrow"
            class="text-xs font-semibold"
          >
            Kirim Pengajuan Pinjam
          </Button>
        </div>
      </form>
    </Modal>

    <!-- MODAL PENGEMBALIAN BUKU -->
    <Modal
      v-model="isReturnModalOpen"
      title="Pengembalian Buku"
      size="md"
      @close="closeReturnModal"
    >
      <div v-if="selectedReturnTrx" class="space-y-4">
        <!-- Jika ada hasil kalkulasi pengembalian -->
        <div v-if="returnResult" class="space-y-4">
          <Alert
            :type="returnResult.isTerlambat ? 'warning' : 'success'"
            :title="returnResult.isTerlambat ? 'Pengembalian Terlambat Dikenakan Denda' : 'Pengembalian Berhasil Diajukan'"
            :description="returnResult.pesan"
          />

          <div v-if="returnResult.denda" class="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wide">
              Rincian Denda Keterlambatan
            </h4>
            <div class="flex justify-between text-xs text-rose-700">
              <span>Jenis Denda:</span>
              <span class="font-semibold">{{ returnResult.denda.jenisDenda }}</span>
            </div>
            <div class="flex justify-between text-xs text-rose-700">
              <span>Keterlambatan:</span>
              <span class="font-semibold">{{ returnResult.denda.hariTerlambat }} hari</span>
            </div>
            <div class="flex justify-between text-sm text-rose-800 font-bold pt-2 border-t border-rose-200">
              <span>Total Denda:</span>
              <span>{{ formatRupiah(returnResult.denda.totalDenda) }}</span>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <Button variant="primary" size="sm" @click="closeReturnModal">
              Selesai
            </Button>
          </div>
        </div>

        <!-- Form Konfirmasi Awal Pengembalian -->
        <div v-else class="space-y-4">
          <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-500">Kode Transaksi:</span>
              <span class="font-mono font-bold text-charcoalDark">
                {{ selectedReturnTrx.kdTransaksi }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Judul Buku:</span>
              <span class="font-semibold text-charcoalDark">
                {{ selectedReturnTrx.judulBuku }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Batas Kembali:</span>
              <span class="font-medium text-charcoalDark">
                {{ dayjs(selectedReturnTrx.tglKembali).format('DD MMMM YYYY') }}
              </span>
            </div>
          </div>

          <!-- Opsi Pelaporan Buku Hilang -->
          <div class="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                v-model="isBukuHilang"
                class="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <div class="text-xs">
                <span class="font-bold text-charcoalDark block">
                  Laporkan Buku Hilang
                </span>
                <span class="text-gray-500">
                  Centang opsi ini hanya apabila fisik buku hilang. Tarif denda penggantian buku hilang akan dihitung secara flat oleh sistem.
                </span>
              </div>
            </label>
          </div>

          <p class="text-xs text-gray-500">
            Pastikan buku fisik telah dibawa dan diserahkan kepada pustakawan di meja sirkulasi untuk verifikasi akhir.
          </p>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="sm" @click="closeReturnModal"> Batal </Button>
            <Button
              variant="primary"
              size="sm"
              :loading="isSubmittingReturn"
              @click="submitReturn"
              class="text-xs font-semibold !bg-emerald-600 hover:!bg-emerald-700 !text-white"
            >
              Konfirmasi Pengembalian
            </Button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- MODAL DETAIL TRANSAKSI -->
    <Modal
      v-model="isDetailModalOpen"
      title="Detail Transaksi Peminjaman"
      size="md"
      @close="closeDetailModal"
    >
      <div v-if="selectedDetailTrx" class="space-y-4 text-xs">
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <div class="flex justify-between items-center pb-2 border-b border-gray-200">
            <span class="text-gray-500">Status Peminjaman</span>
            <Badge :variant="getStatusBadgeVariant(selectedDetailTrx.status)">
              {{ selectedDetailTrx.status }}
            </Badge>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Kode Transaksi</span>
            <span class="font-mono font-bold text-charcoalDark">
              {{ selectedDetailTrx.kdTransaksi }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Judul Buku</span>
            <span class="font-semibold text-charcoalDark text-right max-w-xs">
              {{ selectedDetailTrx.judulBuku }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Petugas Sirkulasi</span>
            <span class="font-medium text-charcoalDark">
              {{ selectedDetailTrx.namaPustakawan || '-' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Tanggal Pinjam</span>
            <span class="font-medium text-charcoalDark">
              {{ dayjs(selectedDetailTrx.tglPinjam).format('DD MMMM YYYY') }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Batas Waktu Kembali</span>
            <span
              :class="[
                'font-bold',
                dayjs().isAfter(dayjs(selectedDetailTrx.tglKembali)) &&
                selectedDetailTrx.status === 'Dipinjam'
                  ? 'text-rose-600'
                  : 'text-charcoalDark',
              ]"
            >
              {{ dayjs(selectedDetailTrx.tglKembali).format('DD MMMM YYYY') }}
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
