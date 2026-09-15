<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import Card from '@/components/common/Card.vue'
import type { TableColumn, PaginationMeta } from '@/types/table'

interface Props {
  columns: TableColumn<T>[]
  items: T[]
  meta?: PaginationMeta | null
  loading?: boolean
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  meta: null,
  loading: false,
  emptyMessage: 'Tidak ada data yang ditemukan',
})

const emit = defineEmits<{
  (e: 'change-page', page: number): void
}>()

const entryInfo = computed(() => {
  if (!props.meta || props.meta.totalRows === 0) return null
  const from = (props.meta.page - 1) * props.meta.limit + 1
  const to = Math.min(props.meta.page * props.meta.limit, props.meta.totalRows)
  return { from, to, total: props.meta.totalRows }
})

const visiblePages = computed(() => {
  if (!props.meta) return []
  const total = props.meta.totalPages
  const current = props.meta.page
  const delta = 2
  const pages: number[] = []

  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    pages.push(i)
  }
  return pages
})
</script>

<template>
  <Card class="flex flex-col overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                col.width ?? ''
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100 text-sm text-charcoal">
          <template v-if="loading">
            <tr v-for="n in 5" :key="n" class="animate-pulse">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3.5">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
            </tr>
          </template>

          <tr v-else-if="items.length === 0">
            <td :colspan="columns.length" class="px-4 py-12 text-center text-gray-400">
              <slot name="empty">
                <p class="text-sm font-medium">{{ emptyMessage }}</p>
              </slot>
            </td>
          </tr>

          <tr
            v-else
            v-for="(item, index) in items"
            :key="item.id || index"
            class="hover:bg-gray-50/70 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3.5',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
              ]"
            >
              <slot :name="`cell-${col.key}`" :item="item" :value="item[col.key]" :index="index">
                {{ item[col.key] ?? '-' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="meta && meta.totalPages > 0"
      class="px-4 py-3 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500"
    >
      <div>
        <span v-if="entryInfo">
          Menampilkan <strong class="text-charcoalDark">{{ entryInfo.from }}</strong> -
          <strong class="text-charcoalDark">{{ entryInfo.to }}</strong> dari
          <strong class="text-charcoalDark">{{ entryInfo.total }}</strong> entri
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="emit('change-page', meta.page - 1)"
          :disabled="!meta.hasPrevPage"
          class="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>

        <button
          v-for="pageNum in visiblePages"
          :key="pageNum"
          type="button"
          @click="emit('change-page', pageNum)"
          :class="[
            'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
            pageNum === meta.page
              ? 'bg-mustard text-charcoalDark font-bold shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          ]"
        >
          {{ pageNum }}
        </button>

        <button
          type="button"
          @click="emit('change-page', meta.page + 1)"
          :disabled="!meta.hasNextPage"
          class="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Selanjutnya"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Card>
</template>
