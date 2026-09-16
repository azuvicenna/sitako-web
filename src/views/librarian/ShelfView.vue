<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  ArchiveBoxIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  Square3Stack3DIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { createShelfSchema } from '@/validations/librarian/shelf.schema';
import { createStackSchema } from '@/validations/librarian/stack.schema';
import type { TableColumn } from '@/types/table';
import type {
  Shelf,
  ShelfStack,
  ShelfListResponse,
  ShelfStackListResponse,
} from '@/types/shelf';

const queryClient = useQueryClient();

// --- STATE: NOTIFICATION / ALERT ---
const toast = ref<{ type: 'success' | 'danger'; message: string } | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const showToast = (type: 'success' | 'danger', message: string) => {
  toast.value = { type, message };
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 4000);
};

// --- STATE: DAFTAR RAK (TABLE & SEARCH) ---
const page = ref(1);
const search = ref('');
const debouncedSearch = ref('');

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

const {
  data: shelvesResponse,
  isLoading,
  refetch: refetchShelves,
} = useQuery({
  queryKey: ['shelves', page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<ShelfListResponse>(`/shelves/?${params}`);
    return res.data;
  },
});

const shelves = computed<Shelf[]>(() => shelvesResponse.value?.data || []);
const meta = computed(() => shelvesResponse.value?.meta || null);

const columns: TableColumn<Shelf>[] = [
  { key: 'namaRak', label: 'Nama Rak' },
  { key: 'totalSusunan', label: 'Susunan Buku', align: 'center', width: 'w-40' },
  { key: 'createdAt', label: 'Tanggal Dibuat', width: 'w-48' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-36' },
];

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- STATE & MUTATION: TAMBAH / EDIT RAK ---
const isShelfModalOpen = ref(false);
const shelfModalMode = ref<'create' | 'edit'>('create');
const shelfForm = reactive({
  id: '',
  namaRak: '',
});
const shelfErrors = ref<{ namaRak?: string }>({});

const openCreateShelfModal = () => {
  shelfModalMode.value = 'create';
  shelfForm.id = '';
  shelfForm.namaRak = '';
  shelfErrors.value = {};
  isShelfModalOpen.value = true;
};

const openEditShelfModal = (shelf: Shelf) => {
  shelfModalMode.value = 'edit';
  shelfForm.id = shelf.id;
  shelfForm.namaRak = shelf.namaRak;
  shelfErrors.value = {};
  isShelfModalOpen.value = true;
};

const shelfMutation = useMutation({
  mutationFn: async (payload: { id?: string; namaRak: string }) => {
    if (shelfModalMode.value === 'create') {
      const res = await api.post('/shelves/', { namaRak: payload.namaRak });
      return res.data;
    } else {
      const res = await api.put(`/shelves/${payload.id}`, { namaRak: payload.namaRak });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    isShelfModalOpen.value = false;
    showToast(
      'success',
      shelfModalMode.value === 'create'
        ? 'Rak buku berhasil ditambahkan!'
        : 'Data rak buku berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal memproses data rak.');
  },
});

const submitShelfForm = () => {
  shelfErrors.value = {};
  const validation = createShelfSchema.safeParse({
    namaRak: shelfForm.namaRak,
  });

  if (!validation.success) {
    const errorIssues = validation.error.flatten().fieldErrors;
    shelfErrors.value = {
      namaRak: errorIssues.namaRak?.[0],
    };
    return;
  }

  shelfMutation.mutate({
    id: shelfForm.id,
    namaRak: shelfForm.namaRak,
  });
};

// --- STATE & MUTATION: HAPUS RAK ---
const isDeleteModalOpen = ref(false);
const shelfToDelete = ref<Shelf | null>(null);

const openDeleteModal = (shelf: Shelf) => {
  shelfToDelete.value = shelf;
  isDeleteModalOpen.value = true;
};

const deleteShelfMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/shelves/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Rak buku berhasil dihapus!');
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus rak buku.');
  },
});

const confirmDeleteShelf = () => {
  if (shelfToDelete.value) {
    deleteShelfMutation.mutate(shelfToDelete.value.id);
  }
};

// --- STATE & MUTATION: SUSUNAN BUKU (STACKS) ---
const isStacksModalOpen = ref(false);
const selectedShelfForStacks = ref<Shelf | null>(null);
const stackSearch = ref('');
const stackPage = ref(1);

const openStacksModal = (shelf: Shelf) => {
  selectedShelfForStacks.value = shelf;
  stackSearch.value = '';
  stackPage.value = 1;
  showStackForm.value = false;
  isStacksModalOpen.value = true;
};

const {
  data: stacksResponse,
  isLoading: isLoadingStacks,
} = useQuery({
  queryKey: [
    'shelf-stacks',
    () => selectedShelfForStacks.value?.id,
    stackPage,
    stackSearch,
  ],
  queryFn: async () => {
    if (!selectedShelfForStacks.value) return null;
    const params = new URLSearchParams({
      page: stackPage.value.toString(),
      limit: '10',
      ...(stackSearch.value ? { search: stackSearch.value } : {}),
    });
    const res = await api.get<ShelfStackListResponse>(
      `/shelves/${selectedShelfForStacks.value.id}/stacks?${params}`,
    );
    return res.data;
  },
  enabled: computed(() => isStacksModalOpen.value && !!selectedShelfForStacks.value),
});

const stacks = computed<ShelfStack[]>(() => stacksResponse.value?.data || []);
const stacksMeta = computed(() => stacksResponse.value?.meta || null);

// Data buku untuk dropdown form susunan
const { data: booksListResponse } = useQuery({
  queryKey: ['books-simple-list'],
  queryFn: async () => {
    const res = await api.get('/books?limit=100');
    return res.data;
  },
  enabled: computed(() => isStacksModalOpen.value),
});

const availableBooks = computed<any[]>(() => booksListResponse.value?.data || []);

const stackColumns: TableColumn<ShelfStack>[] = [
  { key: 'kdSusunan', label: 'Kode Susunan' },
  { key: 'nomorSusunan', label: 'No Slot', align: 'center', width: 'w-24' },
  { key: 'judulBuku', label: 'Buku yang Ditempatkan' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-24' },
];

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
  stackForm.kdSusunan = selectedShelfForStacks.value
    ? `RAK-${selectedShelfForStacks.value.namaRak.slice(0, 3).toUpperCase().trim()}-${(stacks.value.length || 0) + 1}`
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

const stackMutation = useMutation({
  mutationFn: async (payload: {
    id?: string;
    rakId: string;
    kdSusunan: string;
    nomorSusunan: number;
    bukuId: string;
  }) => {
    if (stackFormMode.value === 'create') {
      const res = await api.post(`/shelves/${payload.rakId}/stacks`, {
        rakId: payload.rakId,
        kdSusunan: payload.kdSusunan,
        nomorSusunan: payload.nomorSusunan,
        bukuId: payload.bukuId,
      });
      return res.data;
    } else {
      const res = await api.put(
        `/shelves/${payload.rakId}/stacks/${payload.id}`,
        {
          kdSusunan: payload.kdSusunan,
          nomorSusunan: payload.nomorSusunan,
        },
      );
      return res.data;
    }
  },
  onSuccess: () => {
    if (selectedShelfForStacks.value) {
      queryClient.invalidateQueries({
        queryKey: ['shelf-stacks', selectedShelfForStacks.value.id],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    showStackForm.value = false;
    showToast(
      'success',
      stackFormMode.value === 'create'
        ? 'Susunan buku berhasil ditambahkan!'
        : 'Data susunan berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menyimpan susunan rak.');
  },
});

const submitStackForm = () => {
  if (!selectedShelfForStacks.value) return;

  stackErrors.value = {};
  const validation = createStackSchema.safeParse({
    rakId: selectedShelfForStacks.value.id,
    bukuId: stackForm.bukuId,
    kdSusunan: stackForm.kdSusunan,
    nomorSusunan: stackForm.nomorSusunan,
  });

  if (!validation.success) {
    const errorIssues = validation.error.flatten().fieldErrors;
    stackErrors.value = {
      kdSusunan: errorIssues.kdSusunan?.[0],
      nomorSusunan: errorIssues.nomorSusunan?.[0],
      bukuId: errorIssues.bukuId?.[0],
    };
    return;
  }

  stackMutation.mutate({
    id: stackForm.id,
    rakId: selectedShelfForStacks.value.id,
    kdSusunan: stackForm.kdSusunan,
    nomorSusunan: Number(stackForm.nomorSusunan),
    bukuId: stackForm.bukuId,
  });
};

const deleteStackMutation = useMutation({
  mutationFn: async ({ shelfId, stackId }: { shelfId: string; stackId: string }) => {
    const res = await api.delete(`/shelves/${shelfId}/stacks/${stackId}`);
    return res.data;
  },
  onSuccess: () => {
    if (selectedShelfForStacks.value) {
      queryClient.invalidateQueries({
        queryKey: ['shelf-stacks', selectedShelfForStacks.value.id],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    showToast('success', 'Susunan buku berhasil dihapus.');
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus susunan buku.');
  },
});

const handleDeleteStack = (stack: ShelfStack) => {
  if (!selectedShelfForStacks.value) return;
  if (confirm(`Hapus susunan "${stack.kdSusunan}" dari rak?`)) {
    deleteStackMutation.mutate({
      shelfId: selectedShelfForStacks.value.id,
      stackId: stack.id,
    });
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Kelola Rak Buku</h2>
        <p class="text-sm text-gray-500 mt-1">
          Atur master lokasi rak dan penataan susunan buku fisik perpustakaan
        </p>
      </div>
      <Button
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateShelfModal"
        class="shrink-0"
      >
        Tambah Rak Baru
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

    <!-- Search & Filter Bar -->
    <div class="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari nama rak buku..."
          @update:model-value="handleSearchChange"
        />
      </div>
      <div class="text-xs font-semibold text-gray-500 ml-auto">
        Total: <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? shelves.length }}</span> Rak
      </div>
    </div>

    <!-- Tabel Rak Buku -->
    <Table
      :columns="columns"
      :items="shelves"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada data rak buku yang terdaftar."
      @change-page="handlePageChange"
    >
      <!-- Cell Nama Rak -->
      <template #cell-namaRak="{ item }">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-lg bg-mustard/15 text-charcoalDark flex items-center justify-center shrink-0"
          >
            <ArchiveBoxIcon class="w-5 h-5" />
          </div>
          <div>
            <span class="font-bold text-charcoalDark text-sm block leading-snug">
              {{ item.namaRak }}
            </span>
            <span class="text-[11px] text-gray-400">ID: {{ item.id }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Total Susunan Buku -->
      <template #cell-totalSusunan="{ item }">
        <button
          type="button"
          @click="openStacksModal(item)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
        >
          <Square3Stack3DIcon class="w-4 h-4 text-amber-700" />
          <span>Susunan Buku</span>
          <span v-if="item.totalSusunan !== undefined" class="text-amber-700 font-extrabold">
            ({{ item.totalSusunan }})
          </span>
        </button>
      </template>

      <!-- Cell Tanggal Dibuat -->
      <template #cell-createdAt="{ item }">
        <span class="text-xs text-gray-600">
          {{ item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY, HH:mm') : '-' }}
        </span>
      </template>

      <!-- Cell Aksi -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-1">
          <button
            type="button"
            @click="openEditShelfModal(item)"
            class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Ubah Nama Rak"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Rak"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL TAMBAH / EDIT RAK BUKU -->
    <Modal
      v-model="isShelfModalOpen"
      :title="shelfModalMode === 'create' ? 'Tambah Rak Baru' : 'Ubah Nama Rak'"
      :description="
        shelfModalMode === 'create'
          ? 'Masukkan nama rak untuk mengelompokkan koleksi buku perpustakaan.'
          : 'Perbarui nama rak sesuai pengaturan lokasi fisik perpustakaan.'
      "
      :icon="ArchiveBoxIcon"
      size="md"
    >
      <form @submit.prevent="submitShelfForm" class="space-y-4 pt-1">
        <div>
          <label class="block text-xs font-bold text-charcoalDark mb-1.5">
            Nama Rak <span class="text-red-500">*</span>
          </label>
          <Input
            v-model="shelfForm.namaRak"
            placeholder="Contoh: Rak A - Teknologi & Sains"
            :disabled="shelfMutation.isPending.value"
            auto-focus
          />
          <p v-if="shelfErrors.namaRak" class="text-xs text-red-500 mt-1 font-medium">
            {{ shelfErrors.namaRak }}
          </p>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="shelfMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitShelfForm"
          :disabled="shelfMutation.isPending.value"
        >
          {{ shelfMutation.isPending.value ? 'Menyimpan...' : 'Simpan Rak' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KONFIRMASI HAPUS RAK BUKU -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Rak"
      :description="`Apakah Anda yakin ingin menghapus rak '${shelfToDelete?.namaRak}'? Data susunan dan susunan buku terkait akan terhapus.`"
      :icon="TrashIcon"
      icon-variant="danger"
      size="md"
    >
      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="deleteShelfMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="dark"
          @click="confirmDeleteShelf"
          :disabled="deleteShelfMutation.isPending.value"
        >
          {{ deleteShelfMutation.isPending.value ? 'Menghapus...' : 'Ya, Hapus Rak' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KELOLA SUSUNAN BUKU (STACKS) -->
    <Modal
      v-model="isStacksModalOpen"
      :title="`Susunan Buku: ${selectedShelfForStacks?.namaRak || ''}`"
      description="Kelola slot susunan penempatan dan nomor buku fisik pada rak ini"
      :icon="Square3Stack3DIcon"
      size="2xl"
    >
      <div class="space-y-4">
        <!-- Form Tambah/Edit Susunan (Collapsible) -->
        <div v-if="showStackForm" class="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-charcoalDark uppercase tracking-wider">
              {{ stackFormMode === 'create' ? 'Tambah Susunan Baru' : 'Ubah Susunan Buku' }}
            </h4>
            <button
              type="button"
              @click="showStackForm = false"
              class="text-gray-400 hover:text-charcoalDark p-1 cursor-pointer"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="submitStackForm" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-charcoalDark mb-1">
                Kode Susunan <span class="text-red-500">*</span>
              </label>
              <Input
                v-model="stackForm.kdSusunan"
                placeholder="Contoh: RAK-A-1"
                :disabled="stackMutation.isPending.value"
              />
              <p v-if="stackErrors.kdSusunan" class="text-[11px] text-red-500 mt-0.5">
                {{ stackErrors.kdSusunan }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-charcoalDark mb-1">
                Nomor Slot <span class="text-red-500">*</span>
              </label>
              <Input
                type="number"
                v-model="stackForm.nomorSusunan"
                placeholder="1"
                :disabled="stackMutation.isPending.value"
              />
              <p v-if="stackErrors.nomorSusunan" class="text-[11px] text-red-500 mt-0.5">
                {{ stackErrors.nomorSusunan }}
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-charcoalDark mb-1">
                Pilih Buku <span class="text-red-500">*</span>
              </label>
              <select
                v-model="stackForm.bukuId"
                :disabled="stackMutation.isPending.value"
                class="block w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard disabled:opacity-50"
              >
                <option value="" disabled>-- Pilih Buku --</option>
                <option
                  v-for="buku in availableBooks"
                  :key="buku.id"
                  :value="buku.id"
                >
                  {{ buku.judul }} ({{ buku.isbn || 'No ISBN' }})
                </option>
              </select>
              <p v-if="stackErrors.bukuId" class="text-[11px] text-red-500 mt-0.5">
                {{ stackErrors.bukuId }}
              </p>
            </div>

            <div class="sm:col-span-3 flex justify-end gap-2 mt-2">
              <Button
                variant="secondary"
                @click="showStackForm = false"
                :disabled="stackMutation.isPending.value"
              >
                Batal
              </Button>
              <Button
                variant="primary"
                @click="submitStackForm"
                :disabled="stackMutation.isPending.value"
              >
                {{ stackMutation.isPending.value ? 'Menyimpan...' : 'Simpan Susunan' }}
              </Button>
            </div>
          </form>
        </div>

        <!-- Toolbar Susunan -->
        <div class="flex items-center justify-between gap-4">
          <div class="max-w-xs flex-1">
            <Input
              v-model="stackSearch"
              :icon="MagnifyingGlassIcon"
              placeholder="Filter susunan / buku..."
            />
          </div>
          <Button
            v-if="!showStackForm"
            variant="primary"
            :icon="PlusIcon"
            @click="openCreateStackForm"
          >
            Tambah Susunan
          </Button>
        </div>

        <!-- Tabel Susunan Rak -->
        <Table
          :columns="stackColumns"
          :items="stacks"
          :meta="stacksMeta"
          :loading="isLoadingStacks"
          empty-message="Belum ada susunan buku di rak ini."
        >
          <template #cell-kdSusunan="{ value }">
            <Badge variant="neutral">
              {{ value }}
            </Badge>
          </template>

          <template #cell-nomorSusunan="{ value }">
            <span class="font-bold text-charcoalDark">Slot {{ value }}</span>
          </template>

          <template #cell-judulBuku="{ item }">
            <div class="flex items-center gap-2">
              <BookOpenIcon class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="font-semibold text-charcoalDark text-xs">
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
                title="Edit Susunan"
              >
                <PencilSquareIcon class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click="handleDeleteStack(item)"
                class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                title="Hapus Susunan"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </template>
        </Table>
      </div>

      <template #footer="{ close }">
        <Button variant="secondary" @click="close">
          Tutup
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
