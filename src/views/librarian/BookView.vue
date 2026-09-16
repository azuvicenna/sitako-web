<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Table from '@/components/tables/Table.vue';
import BookFormModal from './components/BookFormModal.vue';

import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';

import type { TableColumn } from '@/types/table';
import type { Book, BookListResponse } from '@/types/book';

const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: TABS, SEARCH & TABEL ---
const activeBookType = ref<'Fisik' | 'Digital'>('Fisik');
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const handleBookTypeTab = (type: 'Fisik' | 'Digital') => {
  activeBookType.value = type;
  page.value = 1;
};

const { data: booksResponse, isLoading } = useQuery({
  queryKey: ['books', page, activeBookType, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      bookType: activeBookType.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<BookListResponse>(`/books/?${params}`);
    return res.data;
  },
});

const books = computed<Book[]>(() => booksResponse.value?.data || []);
const meta = computed(() => booksResponse.value?.meta || null);

const columns: TableColumn<Book>[] = [
  { key: 'buku', label: 'Informasi Buku' },
  { key: 'penulisPenerbit', label: 'Penulis & Penerbit', width: 'w-52' },
  { key: 'genre', label: 'Genre', width: 'w-44' },
  { key: 'stokTipe', label: 'Ketersediaan', align: 'center', width: 'w-36' },
  { key: 'createdAt', label: 'Terdaftar', width: 'w-32' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-24' },
];

// --- MODAL FORM STATE ---
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const selectedBook = ref<Book | null>(null);

const openCreateModal = () => {
  modalMode.value = 'create';
  selectedBook.value = null;
  isModalOpen.value = true;
};

const openEditModal = (book: Book) => {
  modalMode.value = 'edit';
  selectedBook.value = book;
  isModalOpen.value = true;
};

// --- MODAL HAPUS BUKU ---
const isDeleteModalOpen = ref(false);
const bookToDelete = ref<Book | null>(null);

const openDeleteModal = (book: Book) => {
  bookToDelete.value = book;
  isDeleteModalOpen.value = true;
};

const deleteBookMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Buku berhasil dihapus dari katalog!');
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus buku.'));
  },
});

const confirmDeleteBook = () => {
  if (bookToDelete.value) {
    deleteBookMutation.mutate(bookToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Kelola Buku Perpustakaan</h2>
        <p class="text-sm text-gray-500 mt-1">
          Daftar dan kelola katalog koleksi buku fisik dan e-book digital perpustakaan
        </p>
      </div>

      <Button variant="primary" :icon="PlusIcon" @click="openCreateModal" class="shrink-0">
        Tambah Buku Baru
      </Button>
    </div>

    <!-- Toolbar: Tabs & Search -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Tabs Tipe Buku: Fisik vs Digital -->
      <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          type="button"
          @click="handleBookTypeTab('Fisik')"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            activeBookType === 'Fisik'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          <BookOpenIcon class="w-4 h-4" />
          <span>Buku Fisik</span>
        </button>
        <button
          type="button"
          @click="handleBookTypeTab('Digital')"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            activeBookType === 'Digital'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          <DocumentTextIcon class="w-4 h-4" />
          <span>Buku Digital (E-Book)</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari judul, penulis, penerbit, atau ISBN..."
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total:
        <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? books.length }}</span> Judul
      </div>
    </div>

    <!-- Tabel Buku -->
    <Table
      :columns="columns"
      :items="books"
      :meta="meta"
      :loading="isLoading"
      :empty-message="`Belum ada data koleksi buku ${activeBookType.toLowerCase()} yang ditemukan.`"
      @change-page="handlePageChange"
    >
      <!-- Cell Informasi Buku (Cover + Judul + ISBN + Tahun) -->
      <template #cell-buku="{ item }">
        <div class="flex items-start gap-3.5 py-1">
          <div
            class="w-12 h-16 rounded-md bg-gray-100 overflow-hidden border border-gray-200 shrink-0 shadow-xs flex items-center justify-center relative group"
          >
            <img
              v-if="item.cover"
              :src="item.cover"
              :alt="item.judul"
              class="w-full h-full object-cover"
              @error="
                (e) =>
                  ((e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=60')
              "
            />
            <BookOpenIcon v-else class="w-6 h-6 text-gray-300" />
          </div>

          <div class="min-w-0">
            <span class="font-bold text-charcoalDark text-sm block leading-snug truncate max-w-xs">
              {{ item.judul }}
            </span>
            <div class="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
              <span>ISBN: {{ item.isbn }}</span>
              <span>•</span>
              <span>Thn: {{ item.tahunTerbit }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Cell Penulis & Penerbit -->
      <template #cell-penulisPenerbit="{ item }">
        <div class="text-xs space-y-0.5">
          <p class="font-semibold text-charcoalDark truncate max-w-50">{{ item.penulis }}</p>
          <p class="text-gray-400 text-[11px] truncate max-w-50">{{ item.penerbit }}</p>
        </div>
      </template>

      <!-- Cell Genre -->
      <template #cell-genre="{ item }">
        <div class="flex flex-wrap gap-1 max-w-42.5">
          <span
            v-for="(g, idx) in Array.isArray(item.genre) ? item.genre.slice(0, 2) : [item.genre]"
            :key="idx"
            class="inline-block text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
          >
            {{ g }}
          </span>
          <span
            v-if="Array.isArray(item.genre) && item.genre.length > 2"
            class="text-[10px] text-gray-400 font-medium px-1"
          >
            +{{ item.genre.length - 2 }}
          </span>
        </div>
      </template>

      <!-- Cell Stok / Ketersediaan -->
      <template #cell-stokTipe="{ item }">
        <div v-if="item.tipeBuku === 'Fisik'">
          <Badge :variant="item.jumlahStok > 0 ? 'success' : 'danger'">
            {{ item.jumlahStok }} Eksemplar
          </Badge>
        </div>
        <div v-else class="flex flex-col items-center gap-1">
          <Badge variant="mustard"> Digital E-Book </Badge>
          <a
            v-if="item.file"
            :href="item.file"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-[10px] font-bold text-mustardHover hover:underline mt-0.5"
          >
            <span>Buka PDF</span>
            <ArrowTopRightOnSquareIcon class="w-3 h-3" />
          </a>
        </div>
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
            title="Ubah Data Buku"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Buku"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TAMBAH / EDIT BUKU -->
    <BookFormModal
      v-model="isModalOpen"
      :mode="modalMode"
      :book="selectedBook"
      :default-book-type="activeBookType"
    />

    <!-- MODAL KONFIRMASI HAPUS BUKU -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Buku"
      :description="`Apakah Anda yakin ingin menghapus buku '${bookToDelete?.judul}' (${bookToDelete?.isbn}) dari katalog? Tindakan ini tidak dapat dibatalkan.`"
      :loading="deleteBookMutation.isPending.value"
      @confirm="confirmDeleteBook"
    />
  </div>
</template>
