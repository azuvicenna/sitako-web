<script setup lang="ts">
import { BookOpenIcon } from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/vue/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/vue/24/solid';
import { getBookCoverPlaceholder } from '@/utils/image';
import type { CatalogBookItem, BookmarkBookDetail } from '@/types/member-catalog';

interface Props {
  book: CatalogBookItem | BookmarkBookDetail;
  isBookmarked?: boolean;
  isTogglingBookmark?: boolean;
}

withDefaults(defineProps<Props>(), {
  isBookmarked: false,
  isTogglingBookmark: false,
});

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'toggle-bookmark'): void;
}>();
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200/80 hover:border-mustard/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer"
    @click="emit('click')"
  >
    <!-- COVER BUKU (ASPECT RATIO 3:4) -->
    <div class="aspect-3/4 bg-gray-100 relative overflow-hidden flex items-center justify-center">
      <img
        v-if="book.cover"
        :src="book.cover"
        :alt="book.judul"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        @error="(e) => ((e.target as HTMLImageElement).src = getBookCoverPlaceholder(book.judul))"
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
            book.tipeBuku === 'Digital' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
          "
        >
          {{ book.tipeBuku }}
        </span>
      </div>

      <!-- TOMBOL AKSI TOP-RIGHT (CUSTOM SLOT ATAU DEFAULT BOOKMARK TOGGLE) -->
      <slot name="action">
        <button
          type="button"
          @click.stop="emit('toggle-bookmark')"
          :disabled="isTogglingBookmark"
          title="Simpan ke Bookmark"
          class="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-gray-600 hover:text-amber-500 shadow-sm transition-transform active:scale-95 z-10 cursor-pointer"
        >
          <BookmarkSolidIcon v-if="isBookmarked" class="w-4 h-4 text-mustard" />
          <BookmarkOutlineIcon v-else class="w-4 h-4" />
        </button>
      </slot>

      <!-- STOK INDICATOR (FISIK) -->
      <div
        v-if="book.tipeBuku === 'Fisik' && 'jumlahStok' in book && book.jumlahStok !== undefined"
        class="absolute bottom-2 left-2 z-10"
      >
        <span
          class="px-2 py-0.5 text-[10px] font-bold rounded-md shadow-xs backdrop-blur-xs"
          :class="
            book.jumlahStok > 0 ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
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
          {{ 'tahunTerbit' in book && book.tahunTerbit ? book.tahunTerbit : 'Tahun -' }}
        </span>
        <span
          v-if="book.genre?.length"
          class="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded truncate max-w-24"
        >
          {{ book.genre[0] }}
        </span>
      </div>
    </div>
  </div>
</template>
