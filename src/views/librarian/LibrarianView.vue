<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Table from '@/components/tables/Table.vue';
import LibrarianModal from './components/LibrarianModal.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { getInitialsAvatar } from '@/utils/image';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import type { TableColumn } from '@/types/table';
import type { LibrarianUser } from '@/types/auth';
import type { LibrarianListResponse } from '@/types/user';

const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: FILTER & TABLE ---
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const statusActive = ref<'Semua' | 'true' | 'false'>('Semua');

const handleStatusFilter = (status: 'Semua' | 'true' | 'false') => {
  statusActive.value = status;
  page.value = 1;
};

const { data: librariansResponse, isLoading } = useQuery({
  queryKey: ['librarians', page, statusActive, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      statusActive: statusActive.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<LibrarianListResponse>(`/user/librarians/?${params}`);
    return res.data;
  },
});

const librarians = computed<LibrarianUser[]>(() => librariansResponse.value?.data || []);
const meta = computed(() => librariansResponse.value?.meta || null);

const columns: TableColumn<LibrarianUser>[] = [
  { key: 'nama', label: 'Petugas Pustakawan' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'status_aktif', label: 'Status Akun', align: 'center', width: 'w-32' },
  { key: 'createdAt', label: 'Terdaftar', width: 'w-36' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-28' },
];

// --- MODAL FORM TAMBAH / EDIT ---
const isFormModalOpen = ref(false);
const selectedLibrarian = ref<LibrarianUser | null>(null);

const openCreateModal = () => {
  selectedLibrarian.value = null;
  isFormModalOpen.value = true;
};

const openEditModal = (librarian: LibrarianUser) => {
  selectedLibrarian.value = librarian;
  isFormModalOpen.value = true;
};

// --- MODAL HAPUS PUSTAKAWAN ---
const isDeleteModalOpen = ref(false);
const librarianToDelete = ref<LibrarianUser | null>(null);

const openDeleteModal = (librarian: LibrarianUser) => {
  librarianToDelete.value = librarian;
  isDeleteModalOpen.value = true;
};

const deleteLibrarianMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/user/librarians/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarians'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Data pustakawan berhasil dihapus!');
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus data pustakawan.'));
  },
});

const confirmDeleteLibrarian = () => {
  if (librarianToDelete.value) {
    deleteLibrarianMutation.mutate(librarianToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Daftar Pustakawan</h2>
        <p class="text-sm text-gray-500 mt-1">
          Kelola data staf dan administrator pengelola perpustakaan SITAKO
        </p>
      </div>
      <Button variant="primary" :icon="PlusIcon" @click="openCreateModal" class="shrink-0">
        Tambah Pustakawan
      </Button>
    </div>

    <!-- Filter & Search Toolbar -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Filter Status Pills -->
      <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          type="button"
          @click="handleStatusFilter('Semua')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'Semua'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Semua
        </button>
        <button
          type="button"
          @click="handleStatusFilter('true')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'true'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Aktif
        </button>
        <button
          type="button"
          @click="handleStatusFilter('false')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'false'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Nonaktif
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari nama, NIP, email, atau telepon..."
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total:
        <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? librarians.length }}</span>
        Pustakawan
      </div>
    </div>

    <!-- Tabel Data Pustakawan -->
    <Table
      :columns="columns"
      :items="librarians"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada data pustakawan yang terdaftar."
      @change-page="handlePageChange"
    >
      <!-- Cell Nama & NIP -->
      <template #cell-nama="{ item }">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center"
          >
            <img
              v-if="item.foto"
              :src="item.foto"
              :alt="item.nama"
              class="w-full h-full object-cover"
              @error="
                (e) =>
                  ((e.target as HTMLImageElement).src = getInitialsAvatar(item.nama))
              "
            />
            <span v-else class="text-xs font-bold text-gray-400">
              {{ item.nama.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-charcoalDark text-sm block leading-tight">
                {{ item.nama }}
              </span>
              <ShieldCheckIcon class="w-4 h-4 text-mustardHover shrink-0" title="Staf Pustakawan" />
            </div>
            <span class="text-[11px] text-gray-500 mt-0.5 block">NIP: {{ item.nip }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Kontak -->
      <template #cell-kontak="{ item }">
        <div class="space-y-0.5 text-xs text-gray-600">
          <div class="flex items-center gap-1.5">
            <EnvelopeIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="truncate max-w-45">{{ item.email }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <PhoneIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{{ item.telepon }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Status -->
      <template #cell-status_aktif="{ item }">
        <Badge :variant="item.status_aktif ? 'success' : 'neutral'">
          {{ item.status_aktif ? 'Aktif' : 'Nonaktif' }}
        </Badge>
      </template>

      <!-- Cell Tanggal Terdaftar -->
      <template #cell-createdAt="{ item }">
        <span class="text-xs text-gray-500">
          {{ item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY') : '-' }}
        </span>
      </template>

      <!-- Cell Aksi -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-1">
          <button
            type="button"
            @click="openEditModal(item)"
            class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Ubah Data Pustakawan"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Pustakawan"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TAMBAH / EDIT PUSTAKAWAN -->
    <LibrarianModal v-model="isFormModalOpen" :librarian="selectedLibrarian" />

    <!-- MODAL KONFIRMASI HAPUS PUSTAKAWAN -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Pustakawan"
      :description="`Apakah Anda yakin ingin menghapus akun pustakawan '${librarianToDelete?.nama}' (${librarianToDelete?.nip})? Akun ini tidak akan dapat login kembali.`"
      confirm-text="Ya, Hapus Pustakawan"
      variant="danger"
      :loading="deleteLibrarianMutation.isPending.value"
      @confirm="confirmDeleteLibrarian"
    />
  </div>
</template>
