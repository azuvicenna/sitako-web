<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/vue/24/solid';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Card from '@/components/common/Card.vue';
import BookCard from './components/BookCard.vue';
import BookDetailModal from './components/BookDetailModal.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import { useAuthStore } from '@/stores/auth';
import type {
  CatalogBookItem,
  CatalogListResponse,
  BookmarkListResponse,
} from '@/types/member-catalog';

const router = useRouter();
const authStore = useAuthStore();
const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: FILTER & PENCARIAN ---
const { page, search, debouncedSearch, handleSearchChange, reset } = usePaginationSearch();
const typeFilter = ref<'Semua' | 'Fisik' | 'Digital'>('Semua');
const limit = 12;

const handleTypeChange = (type: 'Semua' | 'Fisik' | 'Digital') => {
  typeFilter.value = type;
  page.value = 1;
};

// --- QUERY KATALOG BUKU ---
const { data: catalogResponse, isLoading } = useQuery({
  queryKey: ['member-catalog', page, typeFilter, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.toString(),
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
      ...(typeFilter.value !== 'Semua' ? { bookType: typeFilter.value } : {}),
    });

    const res = await api.get<CatalogListResponse>(`/book?${params}`);
    return res.data;
  },
});

const books = computed<CatalogBookItem[]>(() => catalogResponse.value?.data || []);
const pagination = computed(
  () =>
    catalogResponse.value?.pagination || {
      page: 1,
      limit: 12,
      totalItems: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
);

// --- QUERY BOOKMARK MAP ---
const { data: myBookmarksData } = useQuery({
  queryKey: ['my-bookmarks-map'],
  queryFn: async () => {
    const res = await api.get<BookmarkListResponse>('/book/bookmark?limit=100');
    return res.data.data || [];
  },
});

const bookmarkedMap = computed(() => {
  const map = new Map<string, string>();
  for (const bm of myBookmarksData.value || []) {
    if (bm.buku?.id) {
      map.set(bm.buku.id, bm.id);
    }
  }
  return map;
});

// --- MUTASI TOGGLE BOOKMARK ---
const isTogglingBookmark = ref<Record<string, boolean>>({});

const toggleBookmark = async (book: { id: string; judul: string }) => {
  const isBookmarked = bookmarkedMap.value.has(book.id);
  const bookmarkId = bookmarkedMap.value.get(book.id);

  isTogglingBookmark.value[book.id] = true;

  try {
    if (isBookmarked && bookmarkId) {
      await api.delete(`/book/bookmark/delete/${bookmarkId}`);
      showToast('success', `"${book.judul}" dihapus dari bookmark`);
    } else {
      await api.post(`/book/bookmark/${book.id}`, {
        bukuId: book.id,
        anggotaId: authStore.user?.id,
      });
      showToast('success', `"${book.judul}" disimpan ke bookmark`);
    }

    await queryClient.invalidateQueries({ queryKey: ['my-bookmarks-map'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal memperbarui status bookmark'));
  } finally {
    isTogglingBookmark.value[book.id] = false;
  }
};

// --- STATE: MODAL DETAIL BUKU ---
const isDetailModalOpen = ref(false);
const selectedBook = ref<CatalogBookItem | null>(null);

const openDetailModal = (book: CatalogBookItem) => {
  selectedBook.value = book;
  isDetailModalOpen.value = true;
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
          <BookOpenIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Katalog Koleksi Buku</h1>
          <p class="text-sm text-gray-500 mt-1">
            Temukan ribuan buku fisik dan e-book digital perpustakaan Sitako untuk menunjang studi
            Anda.
          </p>
        </div>
      </div>

      <!-- Shortcut Wishlist -->
      <Button
        variant="secondary"
        size="sm"
        @click="router.push('/anggota/bookmark')"
        class="text-xs font-semibold self-start md:self-auto"
      >
        <BookmarkSolidIcon class="w-4 h-4 mr-1.5 text-mustard" />
        Buku Tersimpan
        <span
          v-if="bookmarkedMap.size > 0"
          class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold"
        >
          {{ bookmarkedMap.size }}
        </span>
      </Button>
    </div>

    <!-- FILTER & PENCARIAN -->
    <Card class="p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Tipe Filter Tabs -->
        <div class="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl w-fit">
          <button
            type="button"
            @click="handleTypeChange('Semua')"
            :class="[
              'px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              typeFilter === 'Semua'
                ? 'bg-white text-charcoalDark shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            Semua Koleksi
          </button>
          <button
            type="button"
            @click="handleTypeChange('Fisik')"
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
            @click="handleTypeChange('Digital')"
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
            placeholder="Cari judul, penulis, atau ISBN..."
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

    <!-- LOADING STATE SKELETON -->
    <div
      v-if="isLoading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <Card v-for="n in 12" :key="n" class="p-3 flex flex-col space-y-3 animate-pulse">
        <div class="aspect-3/4 bg-gray-200 rounded-lg w-full"></div>
        <div class="space-y-2 py-1">
          <div class="h-3.5 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    </div>

    <!-- EMPTY STATE -->
    <div
      v-else-if="books.length === 0"
      class="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center"
    >
      <div
        class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4"
      >
        <BookOpenIcon class="w-8 h-8" />
      </div>
      <h3 class="text-base font-bold text-charcoalDark">Tidak Menemukan Buku yang Dicari</h3>
      <p class="text-xs text-gray-500 mt-1 max-w-sm">
        Coba ubah kata kunci pencarian atau ganti filter tipe buku untuk menemukan koleksi yang
        sesuai.
      </p>
      <Button
        variant="secondary"
        size="sm"
        class="mt-4 text-xs font-semibold"
        @click="
          reset();
          typeFilter = 'Semua';
        "
      >
        Reset Filter Pencarian
      </Button>
    </div>

    <!-- GRID KATALOG BUKU -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <BookCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        :is-bookmarked="bookmarkedMap.has(book.id)"
        :is-toggling-bookmark="isTogglingBookmark[book.id]"
        @click="openDetailModal(book)"
        @toggle-bookmark="toggleBookmark(book)"
      />
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
        {{ pagination.totalItems }} buku)
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
      :book="selectedBook"
      :is-bookmarked="selectedBook ? bookmarkedMap.has(selectedBook.id) : false"
      :is-toggling-bookmark="selectedBook ? isTogglingBookmark[selectedBook.id] : false"
      @toggle-bookmark="toggleBookmark"
    />
  </div>
</template>
