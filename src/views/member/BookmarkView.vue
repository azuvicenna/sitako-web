<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  BookmarkIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Card from '@/components/common/Card.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import BookCard from './components/BookCard.vue';
import BookDetailModal from './components/BookDetailModal.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import type { MemberBookmarkItem, BookmarkListResponse } from '@/types/member-catalog';

const router = useRouter();
const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: FILTER & PENCARIAN ---
const { page, search, debouncedSearch, handleSearchChange, reset } = usePaginationSearch();
const typeFilter = ref<'Semua' | 'Fisik' | 'Digital'>('Semua');
const limit = 12;

// --- QUERY DAFTAR BOOKMARK ---
const { data: bookmarksResponse, isLoading } = useQuery({
  queryKey: ['member-bookmarks', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.toString(),
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });

    const res = await api.get<BookmarkListResponse>(`/book/bookmark?${params}`);
    return res.data;
  },
});

const allBookmarks = computed<MemberBookmarkItem[]>(() => bookmarksResponse.value?.data || []);

// Filter berdasarkan tipe buku (Semua / Fisik / Digital) di client
const filteredBookmarks = computed(() => {
  if (typeFilter.value === 'Semua') return allBookmarks.value;
  return allBookmarks.value.filter((item) => item.buku?.tipeBuku === typeFilter.value);
});

const pagination = computed(
  () =>
    bookmarksResponse.value?.pagination || {
      page: 1,
      limit: 12,
      totalItems: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
);

// --- STATE: HAPUS BOOKMARK ---
const isDeleteModalOpen = ref(false);
const itemToDelete = ref<MemberBookmarkItem | null>(null);
const isDeleting = ref(false);

const openDeleteModal = (item: MemberBookmarkItem) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const confirmDeleteBookmark = async () => {
  if (!itemToDelete.value) return;

  isDeleting.value = true;
  try {
    await api.delete(`/book/bookmark/delete/${itemToDelete.value.id}`);
    showToast('success', `"${itemToDelete.value.buku.judul}" berhasil dihapus dari bookmark.`);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['member-bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['my-bookmarks-map'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    isDeleteModalOpen.value = false;
    isDetailModalOpen.value = false;
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal menghapus bookmark'));
  } finally {
    isDeleting.value = false;
  }
};

// --- STATE: MODAL DETAIL BUKU ---
const isDetailModalOpen = ref(false);
const selectedBookmarkItem = ref<MemberBookmarkItem | null>(null);

const openDetailModal = (item: MemberBookmarkItem) => {
  selectedBookmarkItem.value = item;
  isDetailModalOpen.value = true;
};

const handleToggleFromDetail = () => {
  if (selectedBookmarkItem.value) {
    openDeleteModal(selectedBookmarkItem.value);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-amber-50 rounded-xl text-amber-600">
          <BookmarkIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Koleksi Buku Disimpan</h1>
          <p class="text-sm text-gray-500 mt-1">
            Daftar buku pilihan yang Anda tandai untuk dibaca atau dipinjam di kemudian hari.
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        @click="router.push('/anggota/katalog')"
        class="text-xs font-semibold self-start md:self-auto"
      >
        <BookOpenIcon class="w-4 h-4 mr-1.5" />
        Tambah Buku dari Katalog
      </Button>
    </div>

    <!-- FILTER & PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Tipe Filter Tabs -->
        <div class="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl w-fit">
          <button
            type="button"
            @click="typeFilter = 'Semua'"
            :class="[
              'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              typeFilter === 'Semua'
                ? 'bg-white text-charcoalDark shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            Semua
          </button>
          <button
            type="button"
            @click="typeFilter = 'Fisik'"
            :class="[
              'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              typeFilter === 'Fisik'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            Buku Fisik
          </button>
          <button
            type="button"
            @click="typeFilter = 'Digital'"
            :class="[
              'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              typeFilter === 'Digital'
                ? 'bg-white text-indigo-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            E-Book Digital
          </button>
        </div>

        <!-- Input Pencarian -->
        <div class="w-full sm:w-80">
          <Input
            :model-value="search"
            placeholder="Cari buku di bookmark..."
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

    <!-- SKELETON LOADING -->
    <div
      v-if="isLoading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <Card v-for="n in 6" :key="n" class="p-3 flex flex-col space-y-3 animate-pulse">
        <div class="aspect-3/4 bg-gray-200 rounded-lg w-full"></div>
        <div class="space-y-2 py-1">
          <div class="h-3.5 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    </div>

    <!-- EMPTY STATE -->
    <div
      v-else-if="filteredBookmarks.length === 0"
      class="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center"
    >
      <div
        class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4"
      >
        <BookmarkIcon class="w-8 h-8" />
      </div>
      <h3 class="text-base font-bold text-charcoalDark">
        {{ search ? 'Buku Tidak Ditemukan di Bookmark' : 'Belum Ada Buku yang Disimpan' }}
      </h3>
      <p class="text-xs text-gray-500 mt-1 max-w-sm">
        {{
          search
            ? 'Coba gunakan kata kunci pencarian lain.'
            : 'Simpan buku-buku menarik yang Anda temukan saat menjelajahi katalog perpustakaan.'
        }}
      </p>
      <Button
        variant="primary"
        size="sm"
        class="mt-4 text-xs font-semibold"
        @click="search ? reset() : router.push('/anggota/katalog')"
      >
        {{ search ? 'Hapus Filter Pencarian' : 'Jelajahi Katalog Buku Sekarang' }}
      </Button>
    </div>

    <!-- GRID BOOKMARK BUKU -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <BookCard
        v-for="item in filteredBookmarks"
        :key="item.id"
        :book="item.buku"
        :is-bookmarked="true"
        @click="openDetailModal(item)"
      >
        <template #action>
          <button
            type="button"
            @click.stop="openDeleteModal(item)"
            title="Hapus dari Bookmark"
            class="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-gray-500 hover:text-rose-600 hover:bg-white shadow-sm transition-transform active:scale-95 z-10 cursor-pointer"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </template>
      </BookCard>
    </div>

    <!-- PAGINATION -->
    <div
      v-if="pagination.totalPages > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200/60"
    >
      <p class="text-xs text-gray-500">
        Menampilkan halaman
        <span class="font-bold text-charcoalDark">{{ pagination.page }}</span> dari
        <span class="font-bold text-charcoalDark">{{ pagination.totalPages }}</span> (Total
        {{ pagination.totalItems }} buku tersimpan)
      </p>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :disabled="!pagination.hasPrev"
          @click="page--"
          class="text-xs font-semibold"
        >
          <ChevronLeftIcon class="w-4 h-4 mr-1" />
          Sebelumnya
        </Button>

        <Button
          variant="secondary"
          size="sm"
          :disabled="!pagination.hasNext"
          @click="page++"
          class="text-xs font-semibold"
        >
          Selanjutnya
          <ChevronRightIcon class="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>

    <!-- MODAL DETAIL BUKU -->
    <BookDetailModal
      v-model="isDetailModalOpen"
      :book="selectedBookmarkItem?.buku || null"
      :is-bookmarked="true"
      @toggle-bookmark="handleToggleFromDetail"
    />

    <!-- MODAL KONFIRMASI HAPUS BOOKMARK -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Hapus Buku dari Bookmark"
      :description="`Apakah Anda yakin ingin menghapus buku '${itemToDelete?.buku.judul}' dari daftar bookmark Anda?`"
      confirm-text="Ya, Hapus"
      variant="danger"
      :loading="isDeleting"
      @confirm="confirmDeleteBookmark"
    />
  </div>
</template>
