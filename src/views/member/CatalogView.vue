<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import {
  BookOpenIcon,
  BookmarkIcon as BookmarkOutlineIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/vue/24/solid';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Card from '@/components/common/Card.vue';
import { api } from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';
import type {
  CatalogBookItem,
  CatalogListResponse,
  BookmarkListResponse,
  DigitalBookReadResponse,
} from '@/types/member-catalog';

const router = useRouter();
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

// --- STATE: FILTER & PENCARIAN ---
const search = ref('');
const debouncedSearch = ref('');
const typeFilter = ref<'Semua' | 'Fisik' | 'Digital'>('Semua');
const page = ref(1);
const limit = 12;

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

const handleTypeChange = (type: 'Semua' | 'Fisik' | 'Digital') => {
  typeFilter.value = type;
  page.value = 1;
};

// --- QUERY KATALOG BUKU ---
const {
  data: catalogResponse,
  isLoading,
  isFetching,
} = useQuery({
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
// Mengambil daftar bookmark milik user untuk mengecek status tersimpan
const { data: myBookmarksData } = useQuery({
  queryKey: ['my-bookmarks-map'],
  queryFn: async () => {
    const res = await api.get<BookmarkListResponse>('/book/bookmark?limit=100');
    return res.data.data || [];
  },
});

// Map bookId -> bookmarkId
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

const toggleBookmark = async (book: CatalogBookItem) => {
  const isBookmarked = bookmarkedMap.value.has(book.id);
  const bookmarkId = bookmarkedMap.value.get(book.id);

  isTogglingBookmark.value[book.id] = true;

  try {
    if (isBookmarked && bookmarkId) {
      // Hapus bookmark
      await api.delete(`/book/bookmark/delete/${bookmarkId}`);
      showToast('success', `"${book.judul}" dihapus dari bookmark`);
    } else {
      // Tambah bookmark
      await api.post(`/book/bookmark/${book.id}`, {
        bukuId: book.id,
        anggotaId: authStore.user?.id,
      });
      showToast('success', `"${book.judul}" disimpan ke bookmark`);
    }

    // Refresh query bookmark dan dashboard
    await queryClient.invalidateQueries({ queryKey: ['my-bookmarks-map'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
  } catch (error: any) {
    console.error('Toggle bookmark error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal memperbarui status bookmark',
    );
  } finally {
    isTogglingBookmark.value[book.id] = false;
  }
};

// --- STATE: MODAL DETAIL BUKU ---
const isDetailModalOpen = ref(false);
const selectedBook = ref<CatalogBookItem | null>(null);
const isLoadingReadUrl = ref(false);

const openDetailModal = (book: CatalogBookItem) => {
  selectedBook.value = book;
  isDetailModalOpen.value = true;
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  selectedBook.value = null;
};

// Baca buku digital
const handleReadDigitalBook = async (book: CatalogBookItem) => {
  isLoadingReadUrl.value = true;
  try {
    const res = await api.get<DigitalBookReadResponse>(`/book/digital/read/${book.id}`);
    const fileUrl = res.data.file;
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('danger', 'Berkas PDF untuk buku digital ini belum tersedia.');
    }
  } catch (error: any) {
    console.error('Read digital book error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal memuat berkas digital buku',
    );
  } finally {
    isLoadingReadUrl.value = false;
  }
};

// Navigasi ajukan pinjam
const handleBorrowPhysicalBook = (book: CatalogBookItem) => {
  closeDetailModal();
  router.push({
    path: '/anggota/peminjaman',
    query: { bukuId: book.id, judul: book.judul },
  });
};
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
          <BookOpenIcon class="w-8 h-8" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Katalog Koleksi Buku</h1>
          <p class="text-sm text-gray-500 mt-1">
            Temukan ribuan buku fisik dan e-book digital perpustakaan Sitako untuk menunjang studi Anda.
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
              'px-4 py-2 rounded-lg text-xs font-bold transition-all',
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
              'px-4 py-2 rounded-lg text-xs font-bold transition-all',
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
              'px-4 py-2 rounded-lg text-xs font-bold transition-all',
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
        <div class="aspect-[3/4] bg-gray-200 rounded-lg w-full"></div>
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
      <div class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
        <BookOpenIcon class="w-8 h-8" />
      </div>
      <h3 class="text-base font-bold text-charcoalDark">Tidak Menemukan Buku yang Dicari</h3>
      <p class="text-xs text-gray-500 mt-1 max-w-sm">
        Coba ubah kata kunci pencarian atau ganti filter tipe buku untuk menemukan koleksi yang sesuai.
      </p>
      <Button
        variant="secondary"
        size="sm"
        class="mt-4 text-xs font-semibold"
        @click="
          search = '';
          debouncedSearch = '';
          typeFilter = 'Semua';
        "
      >
        Reset Filter Pencarian
      </Button>
    </div>

    <!-- GRID KATALOG BUKU -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <div
        v-for="book in books"
        :key="book.id"
        class="bg-white rounded-xl border border-gray-200/80 hover:border-mustard/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer"
        @click="openDetailModal(book)"
      >
        <!-- COVER BUKU (ASPECT RATIO 3:4) -->
        <div class="aspect-[3/4] bg-gray-100 relative overflow-hidden flex items-center justify-center">
          <img
            v-if="book.cover"
            :src="book.cover"
            :alt="book.judul"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div v-else class="flex flex-col items-center justify-center p-3 text-gray-400">
            <BookOpenIcon class="w-10 h-10 mb-1" />
            <span class="text-[10px] text-center font-medium">No Cover</span>
          </div>

          <!-- BADGE TIPE BUKU -->
          <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <span
              class="px-2 py-0.5 text-[10px] font-bold rounded-md shadow-xs"
              :class="
                book.tipeBuku === 'Digital'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-amber-600 text-white'
              "
            >
              {{ book.tipeBuku }}
            </span>
          </div>

          <!-- TOMBOL TOGGLE BOOKMARK -->
          <button
            type="button"
            @click.stop="toggleBookmark(book)"
            :disabled="isTogglingBookmark[book.id]"
            title="Simpan ke Bookmark"
            class="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-gray-600 hover:text-amber-500 shadow-sm transition-transform active:scale-95 z-10"
          >
            <BookmarkSolidIcon
              v-if="bookmarkedMap.has(book.id)"
              class="w-4 h-4 text-mustard"
            />
            <BookmarkOutlineIcon v-else class="w-4 h-4" />
          </button>

          <!-- STOK INDICATOR (FISIK) -->
          <div
            v-if="book.tipeBuku === 'Fisik'"
            class="absolute bottom-2 left-2 z-10"
          >
            <span
              class="px-2 py-0.5 text-[10px] font-bold rounded-md shadow-xs backdrop-blur-xs"
              :class="
                book.jumlahStok > 0
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-rose-600/90 text-white'
              "
            >
              {{ book.jumlahStok > 0 ? `Stok: ${book.jumlahStok}` : 'Habis' }}
            </span>
          </div>
        </div>

        <!-- INFO BUKU -->
        <div class="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h4
              class="text-xs font-bold text-charcoalDark line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors"
              :title="book.judul"
            >
              {{ book.judul }}
            </h4>
            <p class="text-[11px] text-gray-500 mt-1 truncate">
              {{ book.penulis }}
            </p>
          </div>

          <div class="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span class="text-[10px] text-gray-400 font-medium">
              {{ book.tahunTerbit || '-' }}
            </span>
            <span class="text-[10px] font-semibold text-mustard flex items-center gap-0.5">
              Detail &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGINATION -->
    <div
      v-if="pagination.totalPages > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs text-gray-600"
    >
      <span>
        Menampilkan halaman <strong>{{ pagination.page }}</strong> dari
        <strong>{{ pagination.totalPages }}</strong> (Total
        {{ pagination.totalItems }} buku)
      </span>

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
    <Modal
      v-model="isDetailModalOpen"
      title="Detail Informasi Buku"
      size="lg"
      @close="closeDetailModal"
    >
      <div v-if="selectedBook" class="space-y-6">
        <div class="flex flex-col sm:flex-row gap-6 items-start">
          <!-- Cover Buku -->
          <div
            class="w-36 sm:w-44 aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0 flex items-center justify-center mx-auto sm:mx-0"
          >
            <img
              v-if="selectedBook.cover"
              :src="selectedBook.cover"
              :alt="selectedBook.judul"
              class="w-full h-full object-cover"
            />
            <BookOpenIcon v-else class="w-12 h-12 text-gray-400" />
          </div>

          <!-- Metadata Rinci -->
          <div class="flex-1 min-w-0 space-y-3">
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-0.5 text-xs font-bold rounded-full"
                :class="
                  selectedBook.tipeBuku === 'Digital'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-amber-100 text-amber-800'
                "
              >
                Buku {{ selectedBook.tipeBuku }}
              </span>

              <span
                v-if="selectedBook.tipeBuku === 'Fisik'"
                class="px-2.5 py-0.5 text-xs font-bold rounded-full"
                :class="
                  selectedBook.jumlahStok > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                "
              >
                {{ selectedBook.jumlahStok > 0 ? `Tersedia (${selectedBook.jumlahStok})` : 'Stok Habis' }}
              </span>
            </div>

            <h3 class="text-xl font-bold text-charcoalDark leading-snug">
              {{ selectedBook.judul }}
            </h3>

            <!-- Grid Atribut -->
            <div class="grid grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100">
              <div>
                <span class="text-gray-400 block mb-0.5">Penulis</span>
                <span class="font-semibold text-charcoalDark">{{ selectedBook.penulis || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block mb-0.5">Penerbit</span>
                <span class="font-semibold text-charcoalDark">{{ selectedBook.penerbit || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block mb-0.5">Tahun Terbit</span>
                <span class="font-semibold text-charcoalDark">{{ selectedBook.tahunTerbit || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block mb-0.5">ISBN</span>
                <span class="font-mono font-semibold text-charcoalDark">{{ selectedBook.isbn || '-' }}</span>
              </div>
            </div>

            <!-- Genre / Kategori -->
            <div v-if="selectedBook.genre?.length" class="pt-2">
              <span class="text-xs text-gray-400 block mb-1.5">Genre / Kategori:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="g in selectedBook.genre"
                  :key="g"
                  class="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700 rounded-md"
                >
                  {{ g }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Regulasi Singkat -->
        <Alert
          v-if="selectedBook.tipeBuku === 'Fisik'"
          type="info"
          title="Ketentuan Peminjaman Fisik"
          description="Buku fisik dapat dipinjam dengan batas waktu 7 hari kerja. Silakan ajukan peminjaman mandiri dan ambil buku di meja sirkulasi perpustakaan."
        />
        <Alert
          v-else
          type="info"
          title="Akses Buku Digital"
          description="E-book digital ini dapat Anda baca langsung secara daring melalui peramban kapan saja dan di mana saja."
        />
      </div>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-3 w-full">
          <!-- Tombol Bookmark -->
          <Button
            v-if="selectedBook"
            variant="secondary"
            size="sm"
            :loading="isTogglingBookmark[selectedBook.id]"
            @click="toggleBookmark(selectedBook)"
            class="text-xs font-semibold"
          >
            <BookmarkSolidIcon
              v-if="bookmarkedMap.has(selectedBook.id)"
              class="w-4 h-4 mr-1.5 text-mustard"
            />
            <BookmarkOutlineIcon v-else class="w-4 h-4 mr-1.5" />
            {{ bookmarkedMap.has(selectedBook.id) ? 'Tersimpan di Bookmark' : 'Simpan ke Bookmark' }}
          </Button>

          <div class="flex items-center gap-2 ml-auto">
            <Button variant="secondary" size="sm" @click="closeDetailModal"> Tutup </Button>

            <!-- Aksi Utama: Baca Online jika Digital -->
            <Button
              v-if="selectedBook?.tipeBuku === 'Digital'"
              variant="primary"
              size="sm"
              :loading="isLoadingReadUrl"
              @click="handleReadDigitalBook(selectedBook)"
              class="text-xs font-semibold !bg-indigo-600 hover:!bg-indigo-700 !text-white"
            >
              <ArrowTopRightOnSquareIcon class="w-4 h-4 mr-1.5" />
              Baca E-Book Sekarang
            </Button>

            <!-- Aksi Utama: Ajukan Pinjam jika Fisik -->
            <Button
              v-else-if="selectedBook?.tipeBuku === 'Fisik'"
              variant="primary"
              size="sm"
              :disabled="selectedBook.jumlahStok <= 0"
              @click="handleBorrowPhysicalBook(selectedBook)"
              class="text-xs font-semibold"
            >
              <BookOpenIcon class="w-4 h-4 mr-1.5" />
              {{ selectedBook.jumlahStok > 0 ? 'Ajukan Peminjaman' : 'Stok Habis' }}
            </Button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>
