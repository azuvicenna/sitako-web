<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  BookOpenIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
} from '@heroicons/vue/24/outline';

import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import FormField from '@/components/common/FormField.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { createBookSchema, updateBookSchema } from '@/validations/librarian/book.schema';
import type { Book } from '@/types/book';

interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  book?: Book | null;
  defaultBookType?: 'Fisik' | 'Digital';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create',
  book: null,
  defaultBookType: 'Fisik',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

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
  if (form.coverPreview.startsWith('blob:')) {
    URL.revokeObjectURL(form.coverPreview);
  }

  if (props.mode === 'edit' && props.book) {
    form.id = props.book.id;
    form.judul = props.book.judul;
    form.penulis = props.book.penulis;
    form.isbn = props.book.isbn;
    form.penerbit = props.book.penerbit;
    form.genreInput = Array.isArray(props.book.genre)
      ? props.book.genre.join(', ')
      : props.book.genre || '';
    form.tipeBuku = props.book.tipeBuku;
    form.tahunTerbit = props.book.tahunTerbit;
    form.jumlahStok = props.book.jumlahStok || 0;
    form.coverFile = null;
    form.coverPreview = props.book.cover || '';
    form.pdfFile = null;
    form.pdfFileName = '';
    form.existingPdfUrl = props.book.file || '';
  } else {
    form.id = '';
    form.judul = '';
    form.penulis = '';
    form.isbn = '';
    form.penerbit = '';
    form.genreInput = '';
    form.tipeBuku = props.defaultBookType;
    form.tahunTerbit = new Date().getFullYear();
    form.jumlahStok = 1;
    form.coverFile = null;
    form.coverPreview = '';
    form.pdfFile = null;
    form.pdfFileName = '';
    form.existingPdfUrl = '';
  }
  formErrors.value = {};
  if (coverInputRef.value) coverInputRef.value.value = '';
  if (pdfInputRef.value) pdfInputRef.value.value = '';
};

watch(
  () => [props.modelValue, props.book],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (form.coverPreview.startsWith('blob:')) {
    URL.revokeObjectURL(form.coverPreview);
  }
});

const handleCoverChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    formErrors.value.cover = 'Ukuran cover maksimal 5MB';
    return;
  }

  if (form.coverPreview.startsWith('blob:')) {
    URL.revokeObjectURL(form.coverPreview);
  }

  form.coverFile = file;
  form.coverPreview = URL.createObjectURL(file);
  formErrors.value.cover = undefined;
};

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
    if (props.mode === 'create') {
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
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      props.mode === 'create'
        ? 'Buku baru berhasil ditambahkan ke katalog!'
        : 'Data buku berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menyimpan data buku.'));
  },
});

const submitForm = () => {
  formErrors.value = {};

  const genres = form.genreInput
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);

  if (genres.length === 0) {
    formErrors.value.genre = 'Minimal isi satu genre buku';
  }

  if (props.mode === 'create') {
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
      tahunTerbit: Number(form.tahunTerbit),
      jumlahStok: form.tipeBuku === 'Fisik' ? Number(form.jumlahStok) : undefined,
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
  } else {
    const validation = updateBookSchema.safeParse({
      judul: form.judul,
      penulis: form.penulis,
      isbn: form.isbn,
      penerbit: form.penerbit,
      genre: genres,
      tipeBuku: form.tipeBuku,
      tahunTerbit: Number(form.tahunTerbit),
      jumlahStok: form.tipeBuku === 'Fisik' ? Number(form.jumlahStok) : undefined,
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
  }

  if (Object.values(formErrors.value).some(Boolean)) {
    return;
  }

  const formData = new FormData();
  formData.append('judul', form.judul);
  formData.append('penulis', form.penulis);
  formData.append('isbn', form.isbn);
  formData.append('penerbit', form.penerbit);
  formData.append('tahunTerbit', String(form.tahunTerbit));
  formData.append('tipeBuku', form.tipeBuku);
  genres.forEach((g) => formData.append('genre', g));

  if (form.tipeBuku === 'Fisik') {
    formData.append('jumlahStok', String(form.jumlahStok));
  }

  if (form.coverFile) {
    formData.append('cover', form.coverFile);
  }

  if (form.tipeBuku === 'Digital' && form.pdfFile) {
    formData.append('file', form.pdfFile);
  }

  bookMutation.mutate(formData);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="mode === 'create' ? 'Tambah Buku ke Katalog' : 'Ubah Informasi Buku'"
    :description="
      mode === 'create'
        ? 'Lengkapi metadata buku perpustakaan, upload cover buku, dan lampirkan file PDF jika digital.'
        : 'Perbarui rincian metadata informasi buku atau perbarui berkas lampiran.'
    "
    :icon="BookOpenIcon"
    size="2xl"
  >
    <form @submit.prevent="submitForm" class="pt-1">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- SISI KIRI: Upload Cover & File PDF (4 Kolom) -->
        <div class="md:col-span-4 space-y-4">
          <!-- Box Preview & Upload Cover -->
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-2">
              Cover Buku <span v-if="mode === 'create'" class="text-red-500">*</span>
            </label>

            <!-- Cover Preview Card -->
            <div
              class="relative w-full aspect-3/4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex flex-col items-center justify-center p-2 text-center group cursor-pointer hover:border-mustard transition-colors shadow-xs"
              @click="coverInputRef?.click()"
            >
              <img
                v-if="form.coverPreview"
                :src="form.coverPreview"
                alt="Cover Preview"
                class="w-full h-full object-cover rounded-lg shadow-sm"
              />
              <div v-else class="flex flex-col items-center justify-center text-gray-400 p-4">
                <div
                  class="w-12 h-12 rounded-full bg-amber-50 text-mustardHover flex items-center justify-center mb-2"
                >
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
              <span
                v-if="form.coverFile"
                class="text-[11px] text-green-600 font-medium truncate max-w-30"
              >
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
                  File E-Book (PDF) <span v-if="mode === 'create'" class="text-red-500">*</span>
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
                class="text-xs font-semibold text-charcoalDark truncate max-w-30"
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
          <FormField label="Judul Buku" required :error="formErrors.judul">
            <Input
              v-model="form.judul"
              placeholder="Contoh: Clean Code: A Handbook of Agile Software Craftsmanship"
              :disabled="bookMutation.isPending.value"
            />
          </FormField>

          <!-- Grid: ISBN & Tahun Terbit -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="ISBN" required :error="formErrors.isbn">
              <Input
                v-model="form.isbn"
                placeholder="Contoh: 9780132350884"
                :disabled="bookMutation.isPending.value"
              />
            </FormField>

            <FormField label="Tahun Terbit" required :error="formErrors.tahunTerbit">
              <Input
                type="number"
                v-model="form.tahunTerbit"
                placeholder="2024"
                :disabled="bookMutation.isPending.value"
              />
            </FormField>
          </div>

          <!-- Grid: Penulis & Penerbit -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Penulis / Pengarang" required :error="formErrors.penulis">
              <Input
                v-model="form.penulis"
                placeholder="Contoh: Robert C. Martin"
                :disabled="bookMutation.isPending.value"
              />
            </FormField>

            <FormField label="Penerbit" required :error="formErrors.penerbit">
              <Input
                v-model="form.penerbit"
                placeholder="Contoh: Prentice Hall"
                :disabled="bookMutation.isPending.value"
              />
            </FormField>
          </div>

          <!-- Grid: Genre & Stok (Jika Fisik) -->
          <div
            class="grid grid-cols-1"
            :class="form.tipeBuku === 'Fisik' ? 'sm:grid-cols-3 gap-3' : ''"
          >
            <div :class="form.tipeBuku === 'Fisik' ? 'sm:col-span-2' : ''">
              <FormField
                label="Genre / Kategori"
                required
                hint="Pisahkan beberapa genre dengan tanda koma (,)"
                :error="formErrors.genre"
              >
                <Input
                  v-model="form.genreInput"
                  placeholder="Contoh: Komputer, Teknologi, Software"
                  :disabled="bookMutation.isPending.value"
                />
              </FormField>
            </div>

            <!-- Jumlah Stok (Hanya untuk Buku Fisik) -->
            <div v-if="form.tipeBuku === 'Fisik'">
              <FormField label="Jumlah Stok Fisik" required :error="formErrors.jumlahStok">
                <Input
                  type="number"
                  v-model="form.jumlahStok"
                  placeholder="10"
                  :disabled="bookMutation.isPending.value"
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close" :disabled="bookMutation.isPending.value">
        Batal
      </Button>
      <Button variant="primary" @click="submitForm" :disabled="bookMutation.isPending.value">
        {{ bookMutation.isPending.value ? 'Menyimpan...' : 'Simpan Buku' }}
      </Button>
    </template>
  </Modal>
</template>
