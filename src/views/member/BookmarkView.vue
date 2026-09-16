<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  BookmarkIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/vue/24/solid';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Card from '@/components/common/Card.vue';
import { api } from '@/utils/axios';
import type {
  MemberBookmarkItem,
  BookmarkListResponse,
  DigitalBookReadResponse,
  BookDetailResponse,
} from '@/types/member-catalog';

const router = useRouter();
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

// --- QUERY DAFTAR BOOKMARK ---
const {
  data: bookmarksResponse,
  isLoading,
  isFetching,
} = useQuery({
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

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  itemToDelete.value = null;
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
    closeDeleteModal();
  } catch (error: any) {
    console.error('Delete bookmark error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal menghapus bookmark',
    );
  } finally {
    isDeleting.value = false;
  }
};

// --- STATE: MODAL DETAIL BUKU ---
const isDetailModalOpen = ref(false);
const detailBook = ref<BookDetailResponse | null>(null);
const isLoadingDetail = ref(false);
const isLoadingReadUrl = ref(false);

const openDetailModal = async (item: MemberBookmarkItem) => {
  isDetailModalOpen.value = true;
  isLoadingDetail.value = true;
  detailBook.value = null;

  try {
    const res = await api.get<BookDetailResponse>(`/book/detail/${item.buku.id}`);
    detailBook.value = res.data;
  } catch (error: any) {
    console.error('Fetch book detail error:', error);
    showToast(
      'danger',
      error.response?.data?.message || 'Gagal memuat detail buku',
    );
    isDetailModalOpen.value = false;
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  detailBook.value = null;
};

// Baca buku digital
const handleReadDigitalBook = async (bookId: string) => {
  isLoadingReadUrl.value = true;
  try {
    const res = await api.get<DigitalBookReadResponse>(`/book/digital/read/${bookId}`);
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
const handleBorrowPhysicalBook = (bookId: string, judul: string) => {
  closeDetailModal();
  router.push({
    path: '/anggota/peminjaman',
    query: { bukuId: bookId, judul },
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
          <BookmarkSolidIcon class="w-8 h-8 text-mustard" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-charcoalDark tracking-tight">Buku Tersimpan</h1>
            <span
              v-if="pagination.totalItems > 0"
              class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800"
            >
              {{ pagination.totalItems }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-1">
            Daftar koleksi buku favorit yang Anda simpan untuk dibaca atau dipinjam nanti.
          </p>
        </div>
      </div>

      <!-- Button Explore Catalog -->
      <Button
        variant="primary"
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
              'px-4 py-2 rounded-lg text-xs font-bold transition-all',
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
            @click="typeFilter = 'Digital'"
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
        <div class="aspect-[3/4] bg-gray-200 rounded-lg w-full"></div>
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
      <div class="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
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
        @click="search ? (search = '', debouncedSearch = '') : router.push('/anggota/katalog')"
      >
        {{ search ? 'Hapus Filter Pencarian' : 'Jelajahi Katalog Buku Sekarang' }}
      </Button>
    </div>

    <!-- GRID BOOKMARK BUKU -->
    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <div
        v-for="item in filteredBookmarks"
        :key="item.id"
        class="bg-white rounded-xl border border-gray-200/80 hover:border-mustard/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer"
        @click="openDetailModal(item)"
      >
        <!-- COVER BUKU (ASPECT RATIO 3:4) -->
        <div class="aspect-[3/4] bg-gray-100 relative overflow-hidden flex items-center justify-center">
          <img
            v-if="item.buku.cover"
            :src="item.buku.cover"
            :alt="item.buku.judul"
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
                item.buku.tipeBuku === 'Digital'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-amber-600 text-white'
              "
            >
              {{ item.buku.tipeBuku }}
            </span>
          </div>

          <!-- TOMBOL HAPUS DARI BOOKMARK -->
          <button
            type="button"
            @click.stop="openDeleteModal(item)"
            title="Hapus dari Bookmark"
            class="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-gray-500 hover:text-rose-600 hover:bg-white shadow-sm transition-transform active:scale-95 z-10"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- INFO BUKU -->
        <div class="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h4
              class="text-xs font-bold text-charcoalDark line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors"
              :title="item.buku.judul"
            >
              {{ item.buku.judul }}
            </h4>
            <p class="text-[11px] text-gray-500 mt-1 truncate">
              {{ item.buku.penulis }}
            </p>
          </div>

          <div class="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span class="text-[10px] text-gray-400">
              {{ dayjs(item.createdAt).format('DD/MM/YYYY') }}
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

    <!-- MODAL KONFIRMASI HAPUS BOOKMARK -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Hapus dari Bookmark"
      size="sm"
      @close="closeDeleteModal"
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Apakah Anda yakin ingin menghapus buku
          <strong class="text-charcoalDark">{{ itemToDelete?.buku.judul }}</strong>
          dari daftar buku tersimpan Anda?
        </p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" @click="closeDeleteModal"> Batal </Button>
          <Button
            variant="primary"
            size="sm"
            :loading="isDeleting"
            @click="confirmDeleteBookmark"
            class="!bg-rose-600 hover:!bg-rose-700 !text-white"
          >
            Hapus Bookmark
          </Button>
        </div>
      </template>
    </Modal>

    <!-- MODAL DETAIL BUKU -->
    <Modal
      v-model="isDetailModalOpen"
      title="Detail Informasi Buku"
      size="lg"
      @close="closeDetailModal"
    >
      <div v-if="isLoadingDetail" class="py-12 text-center animate-pulse space-y-4">
        <div class="w-32 h-44 bg-gray-200 rounded-xl mx-auto"></div>
        <div class="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
      </div>

      <div v-else-if="detailBook" class="space-y-6">
        <div class="flex flex-col sm:flex-row gap-6 items-start">
          <!-- Cover Buku -->
          <div
            class="w-36 sm:w-44 aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0 flex items-center justify-center mx-auto sm:mx-0"
          >
            <img
              v-if="detailBook.cover"
              :src="detailBook.cover"
              :alt="detailBook.judul"
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
                  detailBook.tipeBuku === 'Digital'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-amber-100 text-amber-800'
                "
              >
                Buku {{ detailBook.tipeBuku }}
              </span>

              <span
                v-if="detailBook.tipeBuku === 'Fisik'"
                class="px-2.5 py-0.5 text-xs font-bold rounded-full"
                :class="
                  detailBook.jumlahStok > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                "
              >
                {{ detailBook.jumlahStok > 0 ? `Tersedia (${detailBook.jumlahStok})` : 'Stok Habis' }}
              </span>
            </div>

            <h3 class="text-xl font-bold text-charcoalDark leading-snug">
              {{ detailBook.judul }}
            </h3>

            <!-- Grid Atribut -->
            <div class="grid grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100">
              <div>
                <span class="text-gray-400 block mb-0.5">Penulis</span>
                <span class="font-semibold text-charcoalDark">{{ detailBook.penulis || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block mb-0.5">Penerbit</span>
                <span class="font-semibold text-charcoalDark">{{ detailBook.penerbit || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block mb-0.5">Tahun Terbit</span>
                <span class="font-semibold text-charcoalDark">{{ detailBook.tahunTerbit || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400 block mb-0.5">ISBN</span>
                <span class="font-mono font-semibold text-charcoalDark">{{ detailBook.isbn || '-' }}</span>
              </div>
            </div>

            <!-- Genre / Kategori -->
            <div v-if="detailBook.genre?.length" class="pt-2">
              <span class="text-xs text-gray-400 block mb-1.5">Genre / Kategori:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="g in detailBook.genre"
                  :key="g"
                  class="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700 rounded-md"
                >
                  {{ g }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" @click="closeDetailModal"> Tutup </Button>

          <!-- Aksi: Baca Online jika Digital -->
          <Button
            v-if="detailBook?.tipeBuku === 'Digital'"
            variant="primary"
            size="sm"
            :loading="isLoadingReadUrl"
            @click="detailBook && handleReadDigitalBook(detailBook.id)"
            class="text-xs font-semibold !bg-indigo-600 hover:!bg-indigo-700 !text-white"
          >
            <ArrowTopRightOnSquareIcon class="w-4 h-4 mr-1.5" />
            Baca E-Book
          </Button>

          <!-- Aksi: Ajukan Pinjam jika Fisik -->
          <Button
            v-else-if="detailBook?.tipeBuku === 'Fisik'"
            variant="primary"
            size="sm"
            :disabled="detailBook.jumlahStok <= 0"
            @click="detailBook && handleBorrowPhysicalBook(detailBook.id, detailBook.judul)"
            class="text-xs font-semibold"
          >
            <BookOpenIcon class="w-4 h-4 mr-1.5" />
            {{ detailBook.jumlahStok > 0 ? 'Ajukan Peminjaman' : 'Stok Habis' }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
