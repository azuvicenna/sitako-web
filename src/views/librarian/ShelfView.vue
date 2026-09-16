<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  ArchiveBoxIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  Square3Stack3DIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Table from '@/components/tables/Table.vue';
import ShelfModal from './components/ShelfModal.vue';
import ShelfStackModal from './components/ShelfStackModal.vue';

import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';

import type { TableColumn } from '@/types/table';
import type { Shelf, ShelfListResponse } from '@/types/shelf';

const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: DAFTAR RAK (TABLE & SEARCH) ---
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const { data: shelvesResponse, isLoading } = useQuery({
  queryKey: ['shelves', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<ShelfListResponse>(`/shelves/?${params}`);
    return res.data;
  },
});

const shelves = computed<Shelf[]>(() => shelvesResponse.value?.data || []);
const meta = computed(() => shelvesResponse.value?.meta || null);

const columns: TableColumn<Shelf>[] = [
  { key: 'namaRak', label: 'Nama Rak' },
  { key: 'totalSusunan', label: 'Susunan Buku', align: 'center', width: 'w-40' },
  { key: 'createdAt', label: 'Tanggal Dibuat', width: 'w-48' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-36' },
];

// --- MODAL FORM RAK ---
const isShelfModalOpen = ref(false);
const shelfModalMode = ref<'create' | 'edit'>('create');
const selectedShelf = ref<Shelf | null>(null);

const openCreateShelfModal = () => {
  shelfModalMode.value = 'create';
  selectedShelf.value = null;
  isShelfModalOpen.value = true;
};

const openEditShelfModal = (shelf: Shelf) => {
  shelfModalMode.value = 'edit';
  selectedShelf.value = shelf;
  isShelfModalOpen.value = true;
};

// --- MODAL SUSUNAN BUKU (STACKS) ---
const isStacksModalOpen = ref(false);
const selectedShelfForStacks = ref<Shelf | null>(null);

const openManageStacksModal = (shelf: Shelf) => {
  selectedShelfForStacks.value = shelf;
  isStacksModalOpen.value = true;
};

// --- MODAL HAPUS RAK ---
const isDeleteModalOpen = ref(false);
const shelfToDelete = ref<Shelf | null>(null);

const openDeleteShelfModal = (shelf: Shelf) => {
  shelfToDelete.value = shelf;
  isDeleteModalOpen.value = true;
};

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/shelves/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Rak buku berhasil dihapus!');
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus rak buku.'));
  },
});

const confirmDeleteShelf = () => {
  if (shelfToDelete.value) {
    deleteMutation.mutate(shelfToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Kelola Rak Buku</h2>
        <p class="text-sm text-gray-500 mt-1">
          Pengelompokan lokasi fisik buku dan manajemen susunan koleksi perpustakaan
        </p>
      </div>
      <Button variant="primary" :icon="PlusIcon" @click="openCreateShelfModal" class="shrink-0">
        Tambah Rak Baru
      </Button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari nama rak buku..."
          @update:model-value="handleSearchChange"
        />
      </div>
      <div class="text-xs font-semibold text-gray-500 ml-auto">
        Total:
        <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? shelves.length }}</span> Rak
      </div>
    </div>

    <!-- Tabel Daftar Rak -->
    <Table
      :columns="columns"
      :items="shelves"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada rak buku yang terdaftar."
      @change-page="handlePageChange"
    >
      <template #cell-namaRak="{ item }">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-lg bg-amber-50 text-mustardHover flex items-center justify-center shrink-0"
          >
            <ArchiveBoxIcon class="w-5 h-5" />
          </div>
          <div>
            <span class="font-bold text-charcoalDark text-sm block">
              {{ item.namaRak }}
            </span>
            <span class="text-[11px] text-gray-400">ID: {{ item.id }}</span>
          </div>
        </div>
      </template>

      <template #cell-totalSusunan="{ item }">
        <Badge variant="warning"> {{ item.totalSusunan || 0 }} Susunan Buku </Badge>
      </template>

      <template #cell-createdAt="{ item }">
        <span class="text-xs text-gray-500">
          {{ item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY, HH:mm') : '-' }}
        </span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-1">
          <button
            type="button"
            @click="openManageStacksModal(item)"
            class="p-2 text-mustardHover hover:text-charcoalDark hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            title="Kelola Susunan Buku"
          >
            <Square3Stack3DIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openEditShelfModal(item)"
            class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Ubah Nama Rak"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteShelfModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Rak"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL TAMBAH / EDIT RAK -->
    <ShelfModal v-model="isShelfModalOpen" :mode="shelfModalMode" :shelf="selectedShelf" />

    <!-- MODAL KELOLA SUSUNAN RAK -->
    <ShelfStackModal v-model="isStacksModalOpen" :shelf="selectedShelfForStacks" />

    <!-- MODAL KONFIRMASI HAPUS RAK -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Rak"
      :description="`Apakah Anda yakin ingin menghapus rak '${shelfToDelete?.namaRak}'? Seluruh susunan buku di dalamnya juga akan terhapus.`"
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDeleteShelf"
    />
  </div>
</template>
