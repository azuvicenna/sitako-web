<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import {
  createBookSchema,
  updateBookSchema,
} from '@/validations/librarian/book.schema';
import type { TableColumn } from '@/types/table';
import type { Book, BookListResponse } from '@/types/book';

const queryClient = useQueryClient();

// --- STATE: TOAST / NOTIFIKASI ---
const toast = ref<{ type: 'success' | 'danger'; message: string } | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const showToast = (type: 'success' | 'danger', message: string) => {
  toast.value = { type, message };
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 4000);
};

// --- STATE: TABS, SEARCH & TABEL ---
const page = ref(1);
const search = ref('');
const debouncedSearch = ref('');
const activeBookType = ref<'Fisik' | 'Digital'>('Fisik');

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

const handleBookTypeTab = (type: 'Fisik' | 'Digital') => {
  activeBookType.value = type;
  page.value = 1;
};

const {
  data: booksResponse,
  isLoading,
} = useQuery({
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

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- STATE & MUTATION: MODAL FORM TAMBAH / EDIT BUKU ---
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const coverInputRef = ref<HTMLInputElement | null>(null);
const pdfInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  id: '',
  judul: '',
  penulis: '',
  isbn: '',
  penerbit: '',
  genreInput: '',
  tipeBuku: 'Fisik' as 'Fisik' | 'Digital',
  tahunTerbit: new Date().getFullYear(),
  jumlahStok: 1,
  coverFile: null as File | null,
  coverPreview: '',
  pdfFile: null as File | null,
  pdfFileName: '',
  existingPdfUrl: '',
});

const formErrors = ref<Record<string, string | undefined>>({});

const resetForm = () => {
  form.id = '';
  form.judul = '';
  form.penulis = '';
  form.isbn = '';
  form.penerbit = '';
  form.genreInput = '';
  form.tipeBuku = activeBookType.value;
  form.tahunTerbit = new Date().getFullYear();
  form.jumlahStok = 1;
  form.coverFile = null;
  form.coverPreview = '';
  form.pdfFile = null;
  form.pdfFileName = '';
  form.existingPdfUrl = '';
  formErrors.value = {};
  if (coverInputRef.value) coverInputRef.value.value = '';
  if (pdfInputRef.value) pdfInputRef.value.value = '';
};

const openCreateModal = () => {
  resetForm();
  modalMode.value = 'create';
  isModalOpen.value = true;
};

const openEditModal = (book: Book) => {
  resetForm();
  modalMode.value = 'edit';
  form.id = book.id;
  form.judul = book.judul;
  form.penulis = book.penulis;
  form.isbn = book.isbn;
  form.penerbit = book.penerbit;
  form.genreInput = Array.isArray(book.genre) ? book.genre.join(', ') : (book.genre || '');
  form.tipeBuku = book.tipeBuku;
  form.tahunTerbit = book.tahunTerbit;
  form.jumlahStok = book.jumlahStok || 0;
  form.coverPreview = book.cover || '';
  form.existingPdfUrl = book.file || '';
  isModalOpen.value = true;
};

// Handle Cover Upload & Preview
const handleCoverChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    formErrors.value.cover = 'Ukuran cover maksimal 5MB';
    return;
  }

  form.coverFile = file;
  form.coverPreview = URL.createObjectURL(file);
  formErrors.value.cover = undefined;
};

// Handle PDF File Upload
const handlePdfChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    formErrors.value.pdf = 'Format file harus berupa dokumen PDF';
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    formErrors.value.pdf = 'Ukuran file PDF maksimal 20MB';
    return;
  }

  form.pdfFile = file;
  form.pdfFileName = file.name;
  formErrors.value.pdf = undefined;
};

const bookMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    if (modalMode.value === 'create') {
      const res = await api.post(`/books/?bookType=${form.tipeBuku}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.put(`/books/${form.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
    isModalOpen.value = false;
    showToast(
      'success',
      modalMode.value === 'create'
        ? 'Buku baru berhasil ditambahkan ke katalog!'
        : 'Data buku berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menyimpan data buku.');
  },
});

const submitBookForm = () => {
  formErrors.value = {};

  const genres = form.genreInput
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);

  if (genres.length === 0) {
    formErrors.value.genre = 'Minimal isi satu genre buku';
  }

  if (modalMode.value === 'create') {
    if (!form.coverFile) {
      formErrors.value.cover = 'Cover buku wajib diunggah';
    }
    if (form.tipeBuku === 'Digital' && !form.pdfFile) {
      formErrors.value.pdf = 'File dokumen PDF wajib diunggah untuk buku digital';
    }

    const validation = createBookSchema.safeParse({
      judul: form.judul,
      penulis: form.penulis,
      isbn: form.isbn,
      penerbit: form.penerbit,
      genre: genres,
      tipeBuku: form.tipeBuku,
      tahunTerbit: form.tahunTerbit,
      jumlahStok: form.tipeBuku === 'Fisik' ? form.jumlahStok : 0,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        ...formErrors.value,
        judul: errors.judul?.[0],
        penulis: errors.penulis?.[0],
        isbn: errors.isbn?.[0],
        penerbit: errors.penerbit?.[0],
        tahunTerbit: errors.tahunTerbit?.[0],
        jumlahStok: errors.jumlahStok?.[0],
      };
    }

    if (Object.values(formErrors.value).some((msg) => msg !== undefined)) {
      return;
    }
  } else {
    // Mode EDIT
    const validation = updateBookSchema.safeParse({
      judul: form.judul,
      penulis: form.penulis,
      isbn: form.isbn,
      penerbit: form.penerbit,
      genre: genres,
      tipeBuku: form.tipeBuku,
      tahunTerbit: form.tahunTerbit,
      jumlahStok: form.tipeBuku === 'Fisik' ? form.jumlahStok : 0,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        ...formErrors.value,
        judul: errors.judul?.[0],
        penulis: errors.penulis?.[0],
        isbn: errors.isbn?.[0],
        penerbit: errors.penerbit?.[0],
        tahunTerbit: errors.tahunTerbit?.[0],
        jumlahStok: errors.jumlahStok?.[0],
      };
      return;
    }
  }

  const formData = new FormData();
  formData.append('judul', form.judul.trim());
  formData.append('penulis', form.penulis.trim());
  formData.append('isbn', form.isbn.trim());
  formData.append('penerbit', form.penerbit.trim());
  formData.append('genre', JSON.stringify(genres));
  formData.append('tipeBuku', form.tipeBuku);
  formData.append('tahunTerbit', String(form.tahunTerbit));
  formData.append('jumlahStok', String(form.tipeBuku === 'Fisik' ? form.jumlahStok : 0));

  if (form.coverFile) {
    formData.append('cover', form.coverFile);
  }
  if (form.tipeBuku === 'Digital' && form.pdfFile) {
    formData.append('file', form.pdfFile);
  }

  bookMutation.mutate(formData);
};

// --- STATE & MUTATION: HAPUS BUKU ---
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
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus data buku.');
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
          Manajemen katalog koleksi buku fisik dan pustaka digital (e-book) SITAKO
        </p>
      </div>
      <Button
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateModal"
        class="shrink-0"
      >
        Tambah Buku Baru
      </Button>
    </div>

    <!-- Alert / Toast Banner -->
    <Transition name="fade">
      <Alert
        v-if="toast"
        :variant="toast.type === 'success' ? 'success' : 'danger'"
        :icon="toast.type === 'success' ? CheckCircleIcon : ExclamationCircleIcon"
        :title="toast.type === 'success' ? 'Berhasil' : 'Perhatian'"
        :description="toast.message"
      />
    </Transition>

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
        Total: <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? books.length }}</span> Judul
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
          <!-- Cover Thumbnail -->
          <div
            class="w-12 h-16 rounded-md bg-gray-100 overflow-hidden border border-gray-200 shrink-0 shadow-xs flex items-center justify-center relative group"
          >
            <img
              v-if="item.cover"
              :src="item.cover"
              :alt="item.judul"
              class="w-full h-full object-cover"
              @error="(e) => ((e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=60')"
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
          <p class="font-semibold text-charcoalDark truncate max-w-[200px]">{{ item.penulis }}</p>
          <p class="text-gray-400 text-[11px] truncate max-w-[200px]">{{ item.penerbit }}</p>
        </div>
      </template>

      <!-- Cell Genre -->
      <template #cell-genre="{ item }">
        <div class="flex flex-wrap gap-1 max-w-[170px]">
          <span
            v-for="(g, idx) in (Array.isArray(item.genre) ? item.genre.slice(0, 2) : [item.genre])"
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
          <Badge variant="mustard">
            Digital E-Book
          </Badge>
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

    <!-- MODAL FORM TAMBAH / EDIT BUKU (Ukuran 2XL) -->
    <Modal
      v-model="isModalOpen"
      :title="modalMode === 'create' ? 'Tambah Buku ke Katalog' : 'Ubah Informasi Buku'"
      :description="
        modalMode === 'create'
          ? 'Lengkapi metadata buku perpustakaan, upload cover buku, dan lampirkan file PDF jika digital.'
          : 'Perbarui rincian metadata informasi buku atau perbarui berkas lampiran.'
      "
      :icon="BookOpenIcon"
      size="2xl"
    >
      <form @submit.prevent="submitBookForm" class="pt-1">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          <!-- SISI KIRI: Upload Cover & File PDF (4 Kolom) -->
          <div class="md:col-span-4 space-y-4">
            <!-- Box Preview & Upload Cover -->
            <div>
              <label class="block text-xs font-bold text-charcoalDark mb-2">
                Cover Buku <span v-if="modalMode === 'create'" class="text-red-500">*</span>
              </label>

              <!-- Cover Preview Card -->
              <div
                class="relative w-full aspect-[3/4] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex flex-col items-center justify-center p-2 text-center group cursor-pointer hover:border-mustard transition-colors shadow-xs"
                @click="coverInputRef?.click()"
              >
                <img
                  v-if="form.coverPreview"
                  :src="form.coverPreview"
                  alt="Cover Preview"
                  class="w-full h-full object-cover rounded-lg shadow-sm"
                />
                <div
                  v-else
                  class="flex flex-col items-center justify-center text-gray-400 p-4"
                >
                  <div class="w-12 h-12 rounded-full bg-amber-50 text-mustardHover flex items-center justify-center mb-2">
                    <PhotoIcon class="w-6 h-6" />
                  </div>
                  <p class="text-xs font-bold text-charcoalDark">Pilih Cover Buku</p>
                  <p class="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP (Maks 5MB)</p>
                </div>

                <!-- Hover Overlay saat cover sudah ada -->
                <div
                  v-if="form.coverPreview"
                  class="absolute inset-0 bg-charcoalDark/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity p-2"
                >
                  <ArrowUpTrayIcon class="w-6 h-6 mb-1 text-mustard" />
                  <span class="text-xs font-bold">Ganti Gambar Cover</span>
                </div>
              </div>

              <input
                ref="coverInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="handleCoverChange"
              />

              <div class="flex items-center justify-between mt-2">
                <button
                  type="button"
                  @click="coverInputRef?.click()"
                  class="text-xs font-bold text-mustardHover hover:underline cursor-pointer"
                >
                  {{ form.coverPreview ? 'Ganti Cover' : 'Upload Cover' }}
                </button>
                <span v-if="form.coverFile" class="text-[11px] text-green-600 font-medium truncate max-w-[120px]">
                  ✓ {{ form.coverFile.name }}
                </span>
              </div>
              <p v-if="formErrors.cover" class="text-xs text-red-500 mt-1 font-medium">
                {{ formErrors.cover }}
              </p>
            </div>

            <!-- Upload File PDF (Kondisional jika Tipe Buku = Digital) -->
            <div
              v-if="form.tipeBuku === 'Digital'"
              class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80"
            >
              <div class="flex items-start gap-2 mb-2">
                <DocumentTextIcon class="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p class="text-xs font-bold text-charcoalDark">
                    File E-Book (PDF) <span v-if="modalMode === 'create'" class="text-red-500">*</span>
                  </p>
                  <p class="text-[10px] text-gray-500 mt-0.5">
                    Maksimal 20MB. Berkas buku digital yang dapat dibaca anggota.
                  </p>
                </div>
              </div>

              <input
                ref="pdfInputRef"
                type="file"
                accept="application/pdf"
                class="hidden"
                @change="handlePdfChange"
              />

              <div class="flex items-center gap-2 mt-2">
                <Button
                  variant="secondary"
                  type="button"
                  @click="pdfInputRef?.click()"
                  class="text-xs! py-1.5! px-3!"
                >
                  {{ form.pdfFileName || form.existingPdfUrl ? 'Ganti File PDF' : 'Pilih File PDF' }}
                </Button>
                <span
                  v-if="form.pdfFileName"
                  class="text-xs font-semibold text-charcoalDark truncate max-w-[120px]"
                >
                  {{ form.pdfFileName }}
                </span>
                <a
                  v-else-if="form.existingPdfUrl"
                  :href="form.existingPdfUrl"
                  target="_blank"
                  class="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                >
                  <span>PDF Saat Ini</span>
                  <ArrowTopRightOnSquareIcon class="w-3 h-3" />
                </a>
              </div>
              <p v-if="formErrors.pdf" class="text-xs text-red-500 mt-1 font-medium">
                {{ formErrors.pdf }}
              </p>
            </div>
          </div>

          <!-- SISI KANAN: Form Fields Metadata Buku (8 Kolom) -->
          <div class="md:col-span-8 space-y-3.5">
            <!-- Pilihan Tipe Buku -->
            <div>
              <label class="block text-xs font-bold text-charcoalDark mb-1.5">
                Tipe Format Buku <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="form.tipeBuku = 'Fisik'"
                  :class="[
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer',
                    form.tipeBuku === 'Fisik'
                      ? 'bg-mustard/20 border-mustard text-charcoalDark shadow-xs'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                  ]"
                >
                  <BookOpenIcon class="w-4 h-4 text-charcoal" />
                  <span>Buku Fisik</span>
                </button>
                <button
                  type="button"
                  @click="form.tipeBuku = 'Digital'"
                  :class="[
                    'flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer',
                    form.tipeBuku === 'Digital'
                      ? 'bg-mustard/20 border-mustard text-charcoalDark shadow-xs'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                  ]"
                >
                  <DocumentTextIcon class="w-4 h-4 text-charcoal" />
                  <span>Buku Digital</span>
                </button>
              </div>
            </div>

            <!-- Judul Buku -->
            <div>
              <label class="block text-xs font-bold text-charcoalDark mb-1">
                Judul Buku <span class="text-red-500">*</span>
              </label>
              <Input
                v-model="form.judul"
                placeholder="Contoh: Clean Code: A Handbook of Agile Software Craftsmanship"
                :disabled="bookMutation.isPending.value"
              />
              <p v-if="formErrors.judul" class="text-xs text-red-500 mt-0.5 font-medium">
                {{ formErrors.judul }}
              </p>
            </div>

            <!-- Grid: ISBN & Tahun Terbit -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-charcoalDark mb-1">
                  ISBN <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="form.isbn"
                  placeholder="Contoh: 9780132350884"
                  :disabled="bookMutation.isPending.value"
                />
                <p v-if="formErrors.isbn" class="text-xs text-red-500 mt-0.5 font-medium">
                  {{ formErrors.isbn }}
                </p>
              </div>

              <div>
                <label class="block text-xs font-bold text-charcoalDark mb-1">
                  Tahun Terbit <span class="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  v-model="form.tahunTerbit"
                  placeholder="2024"
                  :disabled="bookMutation.isPending.value"
                />
                <p v-if="formErrors.tahunTerbit" class="text-xs text-red-500 mt-0.5 font-medium">
                  {{ formErrors.tahunTerbit }}
                </p>
              </div>
            </div>

            <!-- Grid: Penulis & Penerbit -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-charcoalDark mb-1">
                  Penulis / Pengarang <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="form.penulis"
                  placeholder="Contoh: Robert C. Martin"
                  :disabled="bookMutation.isPending.value"
                />
                <p v-if="formErrors.penulis" class="text-xs text-red-500 mt-0.5 font-medium">
                  {{ formErrors.penulis }}
                </p>
              </div>

              <div>
                <label class="block text-xs font-bold text-charcoalDark mb-1">
                  Penerbit <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="form.penerbit"
                  placeholder="Contoh: Prentice Hall"
                  :disabled="bookMutation.isPending.value"
                />
                <p v-if="formErrors.penerbit" class="text-xs text-red-500 mt-0.5 font-medium">
                  {{ formErrors.penerbit }}
                </p>
              </div>
            </div>

            <!-- Grid: Genre & Stok (Jika Fisik) -->
            <div class="grid grid-cols-1" :class="form.tipeBuku === 'Fisik' ? 'sm:grid-cols-3 gap-3' : ''">
              <div :class="form.tipeBuku === 'Fisik' ? 'sm:col-span-2' : ''">
                <label class="block text-xs font-bold text-charcoalDark mb-1">
                  Genre / Kategori <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="form.genreInput"
                  placeholder="Contoh: Komputer, Teknologi, Software (Pisahkan koma)"
                  :disabled="bookMutation.isPending.value"
                />
                <p class="text-[10px] text-gray-400 mt-0.5">Pisahkan beberapa genre dengan tanda koma (,)</p>
                <p v-if="formErrors.genre" class="text-xs text-red-500 mt-0.5 font-medium">
                  {{ formErrors.genre }}
                </p>
              </div>

              <!-- Jumlah Stok (Hanya untuk Buku Fisik) -->
              <div v-if="form.tipeBuku === 'Fisik'">
                <label class="block text-xs font-bold text-charcoalDark mb-1">
                  Jumlah Stok Fisik <span class="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  v-model="form.jumlahStok"
                  placeholder="10"
                  :disabled="bookMutation.isPending.value"
                />
                <p v-if="formErrors.jumlahStok" class="text-xs text-red-500 mt-0.5 font-medium">
                  {{ formErrors.jumlahStok }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="bookMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitBookForm"
          :disabled="bookMutation.isPending.value"
        >
          {{ bookMutation.isPending.value ? 'Menyimpan...' : 'Simpan Buku' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KONFIRMASI HAPUS BUKU -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Buku"
      :description="`Apakah Anda yakin ingin menghapus buku '${bookToDelete?.judul}' (${bookToDelete?.isbn}) dari katalog? Tindakan ini tidak dapat dibatalkan.`"
      :icon="TrashIcon"
      icon-variant="danger"
      size="md"
    >
      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="deleteBookMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="dark"
          @click="confirmDeleteBook"
          :disabled="deleteBookMutation.isPending.value"
        >
          {{ deleteBookMutation.isPending.value ? 'Menghapus...' : 'Ya, Hapus Buku' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
