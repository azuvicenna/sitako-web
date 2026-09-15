<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  BookmarkIcon,
  UserGroupIcon,
  ArrowUpCircleIcon,
  ExclamationCircleIcon,
  QrCodeIcon,
  PlusCircleIcon,
  ArrowRightCircleIcon,
  BookOpenIcon,
} from '@heroicons/vue/24/outline';
import { ShieldCheckIcon } from '@heroicons/vue/24/solid';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Card from '@/components/common/Card.vue';
import AccentCard from '@/components/common/AccentCard.vue';
import Alert from '@/components/common/Alert.vue';
import Badge, { type BadgeVariant } from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import type { TableColumn, PaginationMeta } from '@/types/table';

const barcodeInput = ref('');

const columns: TableColumn[] = [
  { key: 'kdTransaksi', label: 'ID Pinjam' },
  { key: 'namaAnggota', label: 'Anggota' },
  { key: 'judulBuku', label: 'Judul Buku' },
  { key: 'tglPinjam', label: 'Tgl Pinjam' },
  { key: 'tglKembali', label: 'Batas Kembali' },
  { key: 'status', label: 'Status', align: 'center' },
];

const currentStatus = ref('Semua');
const currentPage = ref(1);
const transactions = ref<any[]>([]);
const meta = ref<PaginationMeta | null>(null);
const summary = ref({
  semua: 0,
  dipinjam: 0,
  terlambat: 0,
  dikembalikan: 0,
});
const isLoading = ref(false);

const fetchTransactions = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '10',
      ...(currentStatus.value !== 'Semua' && { status: currentStatus.value }),
    });

    const { data: res } = await axios.get(`/api/dashboard/transaction/today?${params}`, {
      withCredentials: true,
    });

    if (res.success) {
      transactions.value = res.data || [];
      meta.value = res.meta || null;
      if (res.summary) {
        summary.value = {
          semua: res.summary.semua ?? 0,
          dipinjam: res.summary.dipinjam ?? 0,
          terlambat: res.summary.terlambat ?? 0,
          dikembalikan: res.summary.dikembalikan ?? 0,
        };
      }
    }
  } catch {
    transactions.value = [];
  } finally {
    isLoading.value = false;
  }
};

const setStatusFilter = (status: string) => {
  currentStatus.value = status;
  currentPage.value = 1;
  fetchTransactions();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchTransactions();
};

const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dipinjam':
      return 'warning';
    case 'Dikembalikan':
      return 'success';
    case 'Terlambat':
      return 'danger';
    case 'Menunggu Persetujuan':
    case 'Menunggu Diambil':
      return 'info';
    default:
      return 'neutral';
  }
};

onMounted(() => {
  fetchTransactions();
});
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-charcoalDark">Dashboard Pustakawan</h2>
      <p class="text-sm text-gray-500 mt-1">Meja sirkulasi utama dan monitoring</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AccentCard>
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Koleksi Buku
          </p>
          <BookmarkIcon class="w-5 h-5 text-charcoal" />
        </div>
        <h3 class="text-3xl font-bold text-charcoalDark">
          300 <span class="text-xl text-gray-400 font-medium">/ 200</span>
        </h3>
        <p class="text-xs text-gray-500 mt-4">Total Buku Fisik / Digital</p>
      </AccentCard>

      <AccentCard>
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Anggota Aktif
          </p>
          <UserGroupIcon class="w-5 h-5 text-charcoal" />
        </div>
        <h3 class="text-3xl font-bold text-charcoalDark">1000</h3>
        <p class="text-xs text-gray-500 mt-4">Total Siswa Anggota Aktif</p>
      </AccentCard>

      <AccentCard>
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Buku Dipinjam
          </p>
          <ArrowUpCircleIcon class="w-5 h-5 text-charcoal" />
        </div>
        <h3 class="text-3xl font-bold text-charcoalDark">300</h3>
        <p class="text-xs text-gray-500 mt-4">Total Buku yang Masih Dipinjam</p>
      </AccentCard>

      <AccentCard>
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Jatuh Tempo
          </p>
          <ExclamationCircleIcon class="w-5 h-5 text-charcoal" />
        </div>
        <h3 class="text-3xl font-bold text-charcoalDark">200</h3>
        <p class="text-xs text-gray-500 mt-4">Total Peminjaman Terkena Denda</p>
      </AccentCard>
    </div>

    <!-- Quick Action Bar -->
    <Card class="p-4 flex items-center justify-between gap-4 mb-8">
      <div class="flex-1 flex gap-2">
        <Input
          v-model="barcodeInput"
          :icon="QrCodeIcon"
          placeholder="NIS Anggota atau ISBN Buku..."
        />
        <Button variant="dark" class="shrink-0"> Enter </Button>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <Button variant="primary" :icon="PlusCircleIcon"> Proses Pinjam </Button>
        <Button variant="secondary" :icon="ArrowRightCircleIcon"> Kembalikan Cepat </Button>
        <Button variant="secondary" :icon="BookOpenIcon"> Tambah Koleksi </Button>
      </div>
    </Card>

    <!-- Data Table & Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="lg:col-span-2 flex flex-col">
        <div class="flex justify-between items-end mb-4">
          <h3 class="text-lg font-bold text-charcoalDark leading-tight">
            Transaksi Sirkulasi<br />Hari Ini
          </h3>
          <div
            class="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg shadow-sm"
          >
            <button
              type="button"
              @click="setStatusFilter('Semua')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer',
                currentStatus === 'Semua'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Semua<br /><span
                :class="currentStatus === 'Semua' ? 'font-normal text-charcoal' : 'font-normal'"
                >({{ summary.semua }})</span
              >
            </button>
            <button
              type="button"
              @click="setStatusFilter('Dipinjam')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer',
                currentStatus === 'Dipinjam'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Dipinjam<br /><span class="font-normal">({{ summary.dipinjam }})</span>
            </button>
            <button
              type="button"
              @click="setStatusFilter('Terlambat')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer',
                currentStatus === 'Terlambat'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Lewat Tempo<br /><span class="font-normal">({{ summary.terlambat }})</span>
            </button>
            <button
              type="button"
              @click="setStatusFilter('Dikembalikan')"
              :class="[
                'px-3 py-1.5 rounded-md text-xs font-bold transition-colors text-center cursor-pointer',
                currentStatus === 'Dikembalikan'
                  ? 'bg-mustard text-charcoalDark shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50',
              ]"
            >
              Selesai<br /><span class="font-normal">({{ summary.dikembalikan }})</span>
            </button>
            <span
              class="px-3 py-1.5 text-xs font-medium text-gray-400 border-l border-gray-200 ml-1 text-center"
            >
              {{ meta?.totalRows ?? summary.semua }}<br />entri
            </span>
          </div>
        </div>

        <Table
          :columns="columns"
          :items="transactions"
          :meta="meta"
          :loading="isLoading"
          empty-message="Belum ada transaksi sirkulasi hari ini"
          @change-page="handlePageChange"
        >
          <template #cell-namaAnggota="{ item }">
            {{ item.namaAnggota || item.anggota?.nama || item.anggotaId || '-' }}
          </template>

          <template #cell-judulBuku="{ item }">
            {{ item.judulBuku || item.buku?.judul || item.bukuId || '-' }}
          </template>

          <template #cell-tglPinjam="{ value }">
            {{ value ? dayjs(value).format('DD/MM/YYYY') : '-' }}
          </template>

          <template #cell-tglKembali="{ value }">
            {{ value ? dayjs(value).format('DD/MM/YYYY') : '-' }}
          </template>

          <template #cell-status="{ value }">
            <Badge :variant="getStatusBadgeVariant(value)">
              {{ value || '-' }}
            </Badge>
          </template>
        </Table>
      </div>

      <Card class="lg:col-span-1 p-6 flex flex-col">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-lg font-bold text-charcoalDark">Statistik Peminjaman</h3>
            <p class="text-xs text-gray-500 mt-1">Aktivitas 7 Hari Terakhir</p>
          </div>
          <span class="text-xs font-bold text-mustard bg-mustard/10 px-2 py-1 rounded"
            >Minggu Ke-3</span
          >
        </div>

        <div class="flex-1 flex flex-col justify-end border-b border-gray-200 pb-4 mb-4 relative">
          <div class="absolute inset-0 flex items-end justify-between px-2 opacity-30">
            <div class="w-1/6 bg-charcoal h-1/3 rounded-t-sm"></div>
            <div class="w-1/6 bg-charcoal h-2/3 rounded-t-sm"></div>
            <div class="w-1/6 bg-charcoal h-1/2 rounded-t-sm"></div>
            <div class="w-1/6 bg-mustard h-full rounded-t-sm opacity-100"></div>
            <div class="w-1/6 bg-charcoal h-3/4 rounded-t-sm"></div>
          </div>
        </div>

        <div class="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-auto">
          <p class="text-sm font-semibold text-charcoalDark">
            Rata-rata Harian: <span class="text-mustardHover">70 Buku</span>
          </p>
        </div>
      </Card>
    </div>

    <!-- Alert Box -->
    <Alert
      :icon="ShieldCheckIcon"
      title="Regulasi Sirkulasi Aktif"
      description="Batas pinjam mahasiswa maks 3 buku (7 hari kerja). Perpanjangan mandiri diperbolehkan 1x apabila buku tidak sedang direservasi anggota lain. Denda Rp 1.000 / hari / buku."
    />
  </div>
</template>
