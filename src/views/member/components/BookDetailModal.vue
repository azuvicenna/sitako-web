<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { BookOpenIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/vue/24/solid';

import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import type {
  CatalogBookItem,
  BookDetailResponse,
  BookmarkBookDetail,
  DigitalBookReadResponse,
} from '@/types/member-catalog';

interface Props {
  modelValue: boolean;
  book: CatalogBookItem | BookDetailResponse | BookmarkBookDetail | null;
  isBookmarked?: boolean;
  isTogglingBookmark?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  book: null,
  isBookmarked: false,
  isTogglingBookmark: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'toggle-bookmark', book: CatalogBookItem | BookDetailResponse | BookmarkBookDetail): void;
}>();

const router = useRouter();
const { showToast } = useToast();

const fetchedDetail = ref<BookDetailResponse | null>(null);
const isLoadingDetail = ref(false);
const isLoadingReadUrl = ref(false);

const activeBook = computed(() => {
  if (fetchedDetail.value) return fetchedDetail.value;
  return props.book;
});

type FullBookInfo = CatalogBookItem | BookDetailResponse;

const activeStock = computed<number>(() => {
  const b = activeBook.value as FullBookInfo | null;
  return typeof b?.jumlahStok === 'number' ? b.jumlahStok : 0;
});

const isPhysicalAvailable = computed<boolean>(() => {
  return activeBook.value?.tipeBuku === 'Fisik' && activeStock.value > 0;
});

const bookPublisher = computed<string>(() => {
  const b = activeBook.value as FullBookInfo | null;
  return b?.penerbit || '-';
});

const bookYear = computed<string | number>(() => {
  const b = activeBook.value as FullBookInfo | null;
  return b?.tahunTerbit ?? '-';
});

const bookIsbn = computed<string>(() => {
  const b = activeBook.value as FullBookInfo | null;
  return b?.isbn || '-';
});

const fetchDetailIfNeeded = async (bookId: string) => {
  const b = props.book as FullBookInfo | null;
  if (b?.isbn) {
    fetchedDetail.value = null;
    return;
  }

  isLoadingDetail.value = true;
  fetchedDetail.value = null;
  try {
    const res = await api.get<BookDetailResponse>(`/book/detail/${bookId}`);
    fetchedDetail.value = res.data;
  } catch (err: unknown) {
    showToast('danger', getErrorMessage(err, 'Gagal memuat detail buku'));
  } finally {
    isLoadingDetail.value = false;
  }
};

watch(
  () => [props.modelValue, props.book?.id],
  ([isOpen, bookId]) => {
    if (isOpen && bookId) {
      fetchDetailIfNeeded(String(bookId));
    } else {
      fetchedDetail.value = null;
    }
  },
  { immediate: true },
);

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleReadDigitalBook = async () => {
  if (!activeBook.value) return;
  isLoadingReadUrl.value = true;
  try {
    const res = await api.get<DigitalBookReadResponse>(`/book/digital/read/${activeBook.value.id}`);
    const fileUrl = res.data.file;
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('danger', 'Berkas PDF untuk buku digital ini belum tersedia.');
    }
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal memuat berkas digital buku'));
  } finally {
    isLoadingReadUrl.value = false;
  }
};

const handleBorrowPhysicalBook = () => {
  if (!activeBook.value) return;
  handleClose();
  router.push({
    path: '/anggota/peminjaman',
    query: { bukuId: activeBook.value.id, judul: activeBook.value.judul },
  });
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Detail Informasi Buku"
    size="lg"
  >
    <div v-if="activeBook" class="space-y-6">
      <div class="flex flex-col sm:flex-row gap-6 items-start">
        <!-- Cover Buku -->
        <div
          class="w-36 sm:w-44 aspect-3/4 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0 flex items-center justify-center mx-auto sm:mx-0"
        >
          <img
            v-if="activeBook.cover"
            :src="activeBook.cover"
            :alt="activeBook.judul"
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
                activeBook.tipeBuku === 'Digital'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-amber-100 text-amber-800'
              "
            >
              Buku {{ activeBook.tipeBuku }}
            </span>

            <span
              v-if="activeBook.tipeBuku === 'Fisik'"
              class="px-2.5 py-0.5 text-xs font-bold rounded-full"
              :class="
                isPhysicalAvailable
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              "
            >
              {{ isPhysicalAvailable ? `Tersedia (${activeStock})` : 'Stok Habis' }}
            </span>
          </div>

          <h3 class="text-xl font-bold text-charcoalDark leading-snug">
            {{ activeBook.judul }}
          </h3>

          <!-- Grid Atribut -->
          <div class="grid grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100">
            <div>
              <span class="text-gray-400 block mb-0.5">Penulis</span>
              <span class="font-semibold text-charcoalDark">{{ activeBook.penulis || '-' }}</span>
            </div>
            <div>
              <span class="text-gray-400 block mb-0.5">Penerbit</span>
              <span class="font-semibold text-charcoalDark">{{ bookPublisher }}</span>
            </div>
            <div>
              <span class="text-gray-400 block mb-0.5">Tahun Terbit</span>
              <span class="font-semibold text-charcoalDark">{{ bookYear }}</span>
            </div>
            <div>
              <span class="text-gray-400 block mb-0.5">ISBN</span>
              <span class="font-mono font-semibold text-charcoalDark">{{ bookIsbn }}</span>
            </div>
          </div>

          <!-- Genre / Kategori -->
          <div v-if="activeBook.genre?.length" class="pt-2">
            <span class="text-xs text-gray-400 block mb-1.5">Genre / Kategori:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="g in activeBook.genre"
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
        v-if="activeBook.tipeBuku === 'Fisik'"
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
          v-if="activeBook"
          variant="secondary"
          size="sm"
          :loading="isTogglingBookmark"
          @click="emit('toggle-bookmark', activeBook)"
          class="text-xs font-semibold"
        >
          <BookmarkSolidIcon v-if="isBookmarked" class="w-4 h-4 mr-1.5 text-mustard" />
          <BookmarkOutlineIcon v-else class="w-4 h-4 mr-1.5" />
          {{ isBookmarked ? 'Tersimpan di Bookmark' : 'Simpan ke Bookmark' }}
        </Button>

        <div class="flex items-center gap-2 ml-auto">
          <Button variant="secondary" size="sm" @click="handleClose"> Tutup </Button>

          <!-- Aksi Utama: Baca Online jika Digital -->
          <Button
            v-if="activeBook?.tipeBuku === 'Digital'"
            variant="primary"
            size="sm"
            :loading="isLoadingReadUrl"
            @click="handleReadDigitalBook"
            class="text-xs font-semibold bg-indigo-600! hover:bg-indigo-700! text-white!"
          >
            <ArrowTopRightOnSquareIcon class="w-4 h-4 mr-1.5" />
            Baca E-Book Sekarang
          </Button>

          <!-- Aksi Utama: Ajukan Pinjam jika Fisik -->
          <Button
            v-else-if="activeBook?.tipeBuku === 'Fisik'"
            variant="primary"
            size="sm"
            :disabled="!isPhysicalAvailable"
            @click="handleBorrowPhysicalBook"
            class="text-xs font-semibold"
          >
            <BookOpenIcon class="w-4 h-4 mr-1.5" />
            {{ isPhysicalAvailable ? 'Ajukan Peminjaman' : 'Stok Habis' }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
