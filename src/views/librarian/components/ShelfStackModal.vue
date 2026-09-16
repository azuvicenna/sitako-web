<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  Square3Stack3DIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BookOpenIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import FormField from '@/components/common/FormField.vue';
import Table from '@/components/tables/Table.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { createStackSchema } from '@/validations/librarian/stack.schema';
import type { TableColumn } from '@/types/table';
import type { Book, BookListResponse } from '@/types/book';
import type { Shelf, ShelfStack, ShelfStackListResponse } from '@/types/shelf';

interface Props {
  modelValue: boolean;
  shelf: Shelf | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  shelf: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

// Query daftar susunan pada rak yang dipilih
const { data: stacksResponse, isLoading: isLoadingStacks } = useQuery({
  queryKey: ['shelf-stacks', computed(() => props.shelf?.id)],
  queryFn: async () => {
    if (!props.shelf?.id) return { data: [] };
    const res = await api.get<ShelfStackListResponse>(`/shelves/${props.shelf.id}/stacks/`);
    return res.data;
  },
  enabled: computed(() => !!props.shelf && props.modelValue),
});

const stacks = computed<ShelfStack[]>(() => stacksResponse.value?.data || []);

// Query master buku fisik untuk pilihan dropdown
const { data: booksResponse } = useQuery({
  queryKey: ['books-dropdown-physical'],
  queryFn: async () => {
    const res = await api.get<BookListResponse>('/books/?bookType=Fisik&limit=100');
    return res.data;
  },
  enabled: computed(() => props.modelValue),
});

const availableBooks = computed<Book[]>(() => booksResponse.value?.data || []);

const stackColumns: TableColumn<ShelfStack>[] = [
  { key: 'nomorSusunan', label: 'Tingkat', width: 'w-20', align: 'center' },
  { key: 'kdSusunan', label: 'Kode Susunan', width: 'w-36' },
  { key: 'judulBuku', label: 'Buku yang Ditempatkan' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-24' },
];

// --- FORM STATE SUSUNAN RAK ---
const showStackForm = ref(false);
const stackFormMode = ref<'create' | 'edit'>('create');
const stackForm = reactive({
  id: '',
  kdSusunan: '',
  nomorSusunan: 1,
  bukuId: '',
});
const stackErrors = ref<{ kdSusunan?: string; nomorSusunan?: string; bukuId?: string }>({});

const openCreateStackForm = () => {
  stackFormMode.value = 'create';
  stackForm.id = '';
  stackForm.kdSusunan = props.shelf
    ? `RAK-${props.shelf.namaRak.slice(0, 3).toUpperCase().trim()}-${(stacks.value.length || 0) + 1}`
    : '';
  stackForm.nomorSusunan = (stacks.value.length || 0) + 1;
  stackForm.bukuId = '';
  stackErrors.value = {};
  showStackForm.value = true;
};

const openEditStackForm = (stack: ShelfStack) => {
  stackFormMode.value = 'edit';
  stackForm.id = stack.id;
  stackForm.kdSusunan = stack.kdSusunan;
  stackForm.nomorSusunan = stack.nomorSusunan;
  stackForm.bukuId = stack.bukuId;
  stackErrors.value = {};
  showStackForm.value = true;
};

const closeStackForm = () => {
  showStackForm.value = false;
  stackErrors.value = {};
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      closeStackForm();
    }
  },
);

const stackMutation = useMutation({
  mutationFn: async (payload: {
    id?: string;
    rakId: string;
    kdSusunan: string;
    nomorSusunan: number;
    bukuId: string;
  }) => {
    if (stackFormMode.value === 'create') {
      const res = await api.post(`/shelves/${payload.rakId}/stacks/`, {
        kdSusunan: payload.kdSusunan,
        nomorSusunan: payload.nomorSusunan,
        bukuId: payload.bukuId,
      });
      return res.data;
    } else {
      const res = await api.put(`/shelves/${payload.rakId}/stacks/${payload.id}`, {
        kdSusunan: payload.kdSusunan,
        nomorSusunan: payload.nomorSusunan,
        bukuId: payload.bukuId,
      });
      return res.data;
    }
  },
  onSuccess: () => {
    if (props.shelf) {
      queryClient.invalidateQueries({
        queryKey: ['shelf-stacks', props.shelf.id],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    showStackForm.value = false;
    showToast(
      'success',
      stackFormMode.value === 'create'
        ? 'Susunan buku berhasil ditambahkan!'
        : 'Susunan buku berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menyimpan susunan rak.'));
  },
});

const submitStackForm = () => {
  stackErrors.value = {};
  if (!props.shelf) return;

  const validation = createStackSchema.safeParse({
    rakId: props.shelf.id,
    bukuId: stackForm.bukuId,
    nomorSusunan: Number(stackForm.nomorSusunan),
    kdSusunan: stackForm.kdSusunan,
  });

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    stackErrors.value = {
      bukuId: errors.bukuId?.[0],
      nomorSusunan: errors.nomorSusunan?.[0],
      kdSusunan: errors.kdSusunan?.[0],
    };
    return;
  }

  stackMutation.mutate({
    id: stackForm.id,
    rakId: props.shelf.id,
    kdSusunan: stackForm.kdSusunan,
    nomorSusunan: Number(stackForm.nomorSusunan),
    bukuId: stackForm.bukuId,
  });
};

// --- HAPUS SUSUNAN RAK ---
const isDeleteStackOpen = ref(false);
const stackToDelete = ref<ShelfStack | null>(null);

const openDeleteStackModal = (stack: ShelfStack) => {
  stackToDelete.value = stack;
  isDeleteStackOpen.value = true;
};

const deleteStackMutation = useMutation({
  mutationFn: async ({ shelfId, stackId }: { shelfId: string; stackId: string }) => {
    const res = await api.delete(`/shelves/${shelfId}/stacks/${stackId}`);
    return res.data;
  },
  onSuccess: () => {
    if (props.shelf) {
      queryClient.invalidateQueries({
        queryKey: ['shelf-stacks', props.shelf.id],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    isDeleteStackOpen.value = false;
    showToast('success', 'Susunan buku berhasil dihapus.');
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus susunan buku.'));
  },
});

const confirmDeleteStack = () => {
  if (props.shelf && stackToDelete.value) {
    deleteStackMutation.mutate({
      shelfId: props.shelf.id,
      stackId: stackToDelete.value.id,
    });
  }
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="`Susunan Rak: ${shelf?.namaRak || ''}`"
    description="Kelola urutan dan tingkat penempatan koleksi buku pada rak ini"
    :icon="Square3Stack3DIcon"
    size="xl"
  >
    <div class="space-y-4 pt-1">
      <div class="flex items-center justify-between pb-2 border-b border-gray-100">
        <span class="text-xs font-semibold text-gray-500">
          Total Koleksi di Rak Ini:
          <strong class="text-charcoalDark">{{ stacks.length }} Buku</strong>
        </span>
        <Button
          v-if="!showStackForm"
          variant="primary"
          :icon="PlusIcon"
          @click="openCreateStackForm"
          class="text-xs! py-1.5! px-3!"
        >
          Tambah Buku ke Rak
        </Button>
      </div>

      <!-- INLINE FORM TAMBAH / EDIT SUSUNAN BUKU -->
      <div
        v-if="showStackForm"
        class="p-4 bg-amber-50/50 rounded-xl border border-mustard/30 space-y-3"
      >
        <div class="flex items-center justify-between pb-2 border-b border-mustard/20">
          <h4 class="text-xs font-bold text-charcoalDark">
            {{ stackFormMode === 'create' ? 'Tambah Penempatan Buku' : 'Ubah Posisi Buku' }}
          </h4>
          <button
            type="button"
            @click="closeStackForm"
            class="text-gray-400 hover:text-charcoalDark cursor-pointer"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="submitStackForm" class="space-y-3">
          <FormField label="Pilih Koleksi Buku Fisik" required :error="stackErrors.bukuId">
            <Select
              v-model="stackForm.bukuId"
              :disabled="stackMutation.isPending.value"
              placeholder="-- Pilih Buku --"
              :options="
                availableBooks.map((buku) => ({
                  label: `${buku.judul} (${buku.isbn || 'No ISBN'})`,
                  value: buku.id,
                }))
              "
            />
          </FormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Tingkat / Nomor Susunan" required :error="stackErrors.nomorSusunan">
              <Input
                type="number"
                v-model="stackForm.nomorSusunan"
                placeholder="1"
                :disabled="stackMutation.isPending.value"
              />
            </FormField>

            <FormField label="Kode Susunan (Auto/Manual)" required :error="stackErrors.kdSusunan">
              <Input
                v-model="stackForm.kdSusunan"
                placeholder="Contoh: RAK-UMU-01"
                :disabled="stackMutation.isPending.value"
              />
            </FormField>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              @click="closeStackForm"
              :disabled="stackMutation.isPending.value"
              class="text-xs! py-1.5! px-3!"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              type="submit"
              :disabled="stackMutation.isPending.value"
              class="text-xs! py-1.5! px-3!"
            >
              {{ stackMutation.isPending.value ? 'Menyimpan...' : 'Simpan Posisi' }}
            </Button>
          </div>
        </form>
      </div>

      <!-- TABEL SUSUNAN BUKU -->
      <Table
        :columns="stackColumns"
        :items="stacks"
        :loading="isLoadingStacks"
        empty-message="Belum ada buku yang ditata di rak ini."
      >
        <template #cell-nomorSusunan="{ item }">
          <span class="font-bold text-xs bg-gray-100 text-charcoal px-2 py-0.5 rounded">
            Tingkat {{ item.nomorSusunan }}
          </span>
        </template>

        <template #cell-kdSusunan="{ item }">
          <span class="font-mono text-xs font-bold text-mustardHover">
            {{ item.kdSusunan }}
          </span>
        </template>

        <template #cell-judulBuku="{ item }">
          <div class="flex items-center gap-2">
            <BookOpenIcon class="w-4 h-4 text-gray-400 shrink-0" />
            <span class="font-semibold text-xs text-charcoalDark truncate max-w-64">
              {{ item.judulBuku || item.bukuId }}
            </span>
          </div>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <button
              type="button"
              @click="openEditStackForm(item)"
              class="p-1.5 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Ubah Posisi"
            >
              <PencilSquareIcon class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click="openDeleteStackModal(item)"
              class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Keluarkan dari Rak"
            >
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </Table>
    </div>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close"> Tutup </Button>
    </template>
  </Modal>

  <!-- CONFIRM DELETE STACK -->
  <ConfirmModal
    v-model="isDeleteStackOpen"
    title="Keluarkan Buku dari Rak"
    :description="`Apakah Anda yakin ingin mengeluarkan buku '${stackToDelete?.judulBuku}' dari susunan rak ini?`"
    confirm-text="Ya, Keluarkan"
    :loading="deleteStackMutation.isPending.value"
    @confirm="confirmDeleteStack"
  />
</template>
