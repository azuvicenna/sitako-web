<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';
import Toggle from '@/components/common/Toggle.vue';
import Table from '@/components/tables/Table.vue';
import { api } from '@/utils/axios';
import { compressImage } from '@/utils/image';
import {
  createLibrarianSchema,
  updateLibrarianSchema,
} from '@/validations/librarian/librarian.schema';
import type { TableColumn } from '@/types/table';
import type { LibrarianUser } from '@/types/auth';
import type { LibrarianListResponse } from '@/types/user';

const queryClient = useQueryClient();

// --- STATE: TOAST / NOTIFICATION ---
const toast = ref<{ type: 'success' | 'danger'; message: string } | null>(null);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;
const showToast = (type: 'success' | 'danger', message: string) => {
  toast.value = { type, message };
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 4000);
};

// --- STATE: FILTER & TABLE ---
const page = ref(1);
const search = ref('');
const debouncedSearch = ref('');
const statusActive = ref<'Semua' | 'true' | 'false'>('Semua');

const onSearchInput = useDebounceFn((val: string) => {
  debouncedSearch.value = val;
  page.value = 1;
}, 300);

const handleSearchChange = (val: string | number) => {
  search.value = String(val);
  onSearchInput(String(val));
};

const handleStatusFilter = (status: 'Semua' | 'true' | 'false') => {
  statusActive.value = status;
  page.value = 1;
};

const {
  data: librariansResponse,
  isLoading,
} = useQuery({
  queryKey: ['librarians', page, statusActive, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      statusActive: statusActive.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<LibrarianListResponse>(`/user/librarians/?${params}`);
    return res.data;
  },
});

const librarians = computed<LibrarianUser[]>(() => librariansResponse.value?.data || []);
const meta = computed(() => librariansResponse.value?.meta || null);

const columns: TableColumn<LibrarianUser>[] = [
  { key: 'nama', label: 'Petugas Pustakawan' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'status_aktif', label: 'Status Akun', align: 'center', width: 'w-32' },
  { key: 'createdAt', label: 'Terdaftar', width: 'w-36' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-28' },
];

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- STATE & MUTATION: FORM TAMBAH / EDIT PUSTAKAWAN ---
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const fileInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  id: '',
  nama: '',
  nip: '',
  email: '',
  password: '',
  telepon: '',
  status_aktif: true,
  foto: null as File | null,
  fotoPreview: '',
});

const formErrors = ref<Record<string, string | undefined>>({});

const resetForm = () => {
  form.id = '';
  form.nama = '';
  form.nip = '';
  form.email = '';
  form.password = '';
  form.telepon = '';
  form.status_aktif = true;
  form.foto = null;
  form.fotoPreview = '';
  formErrors.value = {};
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const openCreateModal = () => {
  resetForm();
  modalMode.value = 'create';
  isModalOpen.value = true;
};

const openEditModal = (librarian: LibrarianUser) => {
  resetForm();
  modalMode.value = 'edit';
  form.id = librarian.id;
  form.nama = librarian.nama;
  form.nip = librarian.nip;
  form.email = librarian.email;
  form.telepon = librarian.telepon;
  form.status_aktif = librarian.status_aktif;
  form.fotoPreview = librarian.foto;
  isModalOpen.value = true;
};

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    formErrors.value.foto = 'Ukuran gambar maksimal 5MB sebelum kompresi';
    return;
  }

  try {
    const compressed = await compressImage(file);
    form.foto = compressed;
    form.fotoPreview = URL.createObjectURL(compressed);
    formErrors.value.foto = undefined;
  } catch {
    form.foto = file;
    form.fotoPreview = URL.createObjectURL(file);
  }
};

const librarianMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    if (modalMode.value === 'create') {
      const res = await api.post('/user/librarians/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.put(`/user/librarians/${form.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarians'] });
    isModalOpen.value = false;
    showToast(
      'success',
      modalMode.value === 'create'
        ? 'Data pustakawan baru berhasil ditambahkan!'
        : 'Data pustakawan berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menyimpan data pustakawan.');
  },
});

const submitLibrarianForm = () => {
  formErrors.value = {};

  if (modalMode.value === 'create') {
    if (!form.foto) {
      formErrors.value.foto = 'Foto profil wajib diunggah untuk staf baru';
    }

    const validation = createLibrarianSchema.safeParse({
      nama: form.nama,
      nip: form.nip,
      email: form.email,
      password: form.password,
      telepon: form.telepon,
      status_aktif: form.status_aktif,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        ...formErrors.value,
        nama: errors.nama?.[0],
        nip: errors.nip?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        telepon: errors.telepon?.[0],
      };
    }

    if (Object.values(formErrors.value).some((msg) => msg !== undefined)) {
      return;
    }
  } else {
    // Mode EDIT
    const updatePayload: Record<string, any> = {
      nama: form.nama,
      nip: form.nip,
      email: form.email,
      telepon: form.telepon,
      status_aktif: form.status_aktif,
    };
    if (form.password.trim()) {
      updatePayload.password = form.password;
    }

    const validation = updateLibrarianSchema.safeParse(updatePayload);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        nama: errors.nama?.[0],
        nip: errors.nip?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        telepon: errors.telepon?.[0],
      };
      return;
    }
  }

  const formData = new FormData();
  formData.append('nama', form.nama.trim());
  formData.append('nip', form.nip.trim());
  formData.append('email', form.email.trim());
  formData.append('telepon', form.telepon.trim());
  formData.append('status_aktif', String(form.status_aktif));
  if (form.password.trim()) {
    formData.append('password', form.password.trim());
  }
  if (form.foto) {
    formData.append('foto', form.foto);
  }

  librarianMutation.mutate(formData);
};

// --- STATE & MUTATION: HAPUS PUSTAKAWAN ---
const isDeleteModalOpen = ref(false);
const librarianToDelete = ref<LibrarianUser | null>(null);

const openDeleteModal = (librarian: LibrarianUser) => {
  librarianToDelete.value = librarian;
  isDeleteModalOpen.value = true;
};

const deleteLibrarianMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/user/librarians/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarians'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Data pustakawan berhasil dihapus!');
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus data pustakawan.');
  },
});

const confirmDeleteLibrarian = () => {
  if (librarianToDelete.value) {
    deleteLibrarianMutation.mutate(librarianToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Daftar Pustakawan</h2>
        <p class="text-sm text-gray-500 mt-1">
          Kelola data staf dan administrator pengelola perpustakaan SITAKO
        </p>
      </div>
      <Button
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateModal"
        class="shrink-0"
      >
        Tambah Pustakawan
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

    <!-- Filter & Search Toolbar -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Filter Status Pills -->
      <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          type="button"
          @click="handleStatusFilter('Semua')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'Semua'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Semua
        </button>
        <button
          type="button"
          @click="handleStatusFilter('true')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'true'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Aktif
        </button>
        <button
          type="button"
          @click="handleStatusFilter('false')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'false'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Nonaktif
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari nama, NIP, email, atau telepon..."
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total: <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? librarians.length }}</span> Pustakawan
      </div>
    </div>

    <!-- Tabel Data Pustakawan -->
    <Table
      :columns="columns"
      :items="librarians"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada data pustakawan yang terdaftar."
      @change-page="handlePageChange"
    >
      <!-- Cell Nama & NIP -->
      <template #cell-nama="{ item }">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center"
          >
            <img
              v-if="item.foto"
              :src="item.foto"
              :alt="item.nama"
              class="w-full h-full object-cover"
              @error="(e) => ((e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=eab308&color=1f2937`)"
            />
            <span v-else class="text-xs font-bold text-gray-400">
              {{ item.nama.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-charcoalDark text-sm leading-tight">
                {{ item.nama }}
              </span>
              <ShieldCheckIcon class="w-4 h-4 text-mustardHover shrink-0" title="Staf Pustakawan" />
            </div>
            <span class="text-[11px] text-gray-500 mt-0.5 block">NIP: {{ item.nip }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Kontak -->
      <template #cell-kontak="{ item }">
        <div class="space-y-0.5 text-xs text-gray-600">
          <div class="flex items-center gap-1.5">
            <EnvelopeIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="truncate max-w-[180px]">{{ item.email }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <PhoneIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{{ item.telepon }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Status -->
      <template #cell-status_aktif="{ item }">
        <Badge :variant="item.status_aktif ? 'success' : 'neutral'">
          {{ item.status_aktif ? 'Aktif' : 'Nonaktif' }}
        </Badge>
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
            title="Ubah Data Pustakawan"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Pustakawan"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TAMBAH / EDIT PUSTAKAWAN -->
    <Modal
      v-model="isModalOpen"
      :title="modalMode === 'create' ? 'Tambah Pustakawan Baru' : 'Ubah Data Pustakawan'"
      :description="
        modalMode === 'create'
          ? 'Lengkapi data staf pengelola perpustakaan baru untuk akses sistem.'
          : 'Perbarui profil informasi dan kontak staf pustakawan.'
      "
      :icon="UserGroupIcon"
      size="lg"
    >
      <form @submit.prevent="submitLibrarianForm" class="space-y-4 pt-1">
        <!-- Foto Profil Uploader -->
        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div
            class="relative w-16 h-16 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex items-center justify-center shrink-0 cursor-pointer group"
            @click="fileInputRef?.click()"
          >
            <img
              v-if="form.fotoPreview"
              :src="form.fotoPreview"
              alt="Preview"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center text-gray-400"
            >
              <CameraIcon class="w-6 h-6" />
            </div>
            <div
              class="absolute inset-0 bg-charcoalDark/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
            >
              <CameraIcon class="w-5 h-5" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-charcoalDark">
              Foto Profil <span v-if="modalMode === 'create'" class="text-red-500">*</span>
            </p>
            <p class="text-[11px] text-gray-500 mt-0.5">
              Format JPG, PNG, atau WEBP (Maksimal 2MB).
            </p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="handleFileChange"
            />
            <button
              type="button"
              @click="fileInputRef?.click()"
              class="mt-1.5 text-xs font-bold text-mustardHover hover:underline cursor-pointer"
            >
              {{ form.fotoPreview ? 'Ganti Foto' : 'Pilih Foto' }}
            </button>
            <p v-if="formErrors.foto" class="text-xs text-red-500 mt-1 font-medium">
              {{ formErrors.foto }}
            </p>
          </div>
        </div>

        <!-- Form Fields Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Nama Lengkap -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Nama Lengkap <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="form.nama"
              placeholder="Contoh: Siti Nurhaliza, S.Ptk"
              :disabled="librarianMutation.isPending.value"
            />
            <p v-if="formErrors.nama" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.nama }}
            </p>
          </div>

          <!-- NIP -->
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              NIP (Nomor Induk Pegawai) <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="form.nip"
              placeholder="Contoh: 199002022015022002"
              :disabled="librarianMutation.isPending.value"
            />
            <p v-if="formErrors.nip" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.nip }}
            </p>
          </div>

          <!-- Nomor Telepon -->
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Nomor Telepon / WhatsApp <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="form.telepon"
              placeholder="Contoh: 081234567891"
              :disabled="librarianMutation.isPending.value"
            />
            <p v-if="formErrors.telepon" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.telepon }}
            </p>
          </div>

          <!-- Email -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <Input
              type="email"
              v-model="form.email"
              placeholder="siti@sitako.sch.id"
              :disabled="librarianMutation.isPending.value"
            />
            <p v-if="formErrors.email" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.email }}
            </p>
          </div>

          <!-- Password -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Password
              <span v-if="modalMode === 'create'" class="text-red-500">*</span>
              <span v-else class="text-gray-400 font-normal"> (Kosongkan jika tidak ingin mengubah)</span>
            </label>
            <Input
              type="password"
              v-model="form.password"
              :placeholder="modalMode === 'create' ? 'Kata sandi akun pustakawan' : '••••••••'"
              :disabled="librarianMutation.isPending.value"
            />
            <p v-if="formErrors.password" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.password }}
            </p>
          </div>

          <!-- Status Aktif Toggle -->
          <div class="sm:col-span-2 pt-1">
            <Toggle
              v-model="form.status_aktif"
              label="Status Akun Aktif"
              description="Pustakawan aktif dapat login dan mengelola seluruh modul sistem perpustakaan."
              :disabled="librarianMutation.isPending.value"
            />
          </div>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="librarianMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitLibrarianForm"
          :disabled="librarianMutation.isPending.value"
        >
          {{ librarianMutation.isPending.value ? 'Menyimpan...' : 'Simpan Data' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KONFIRMASI HAPUS PUSTAKAWAN -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Pustakawan"
      :description="`Apakah Anda yakin ingin menghapus akun pustakawan '${librarianToDelete?.nama}' (${librarianToDelete?.nip})? Akun ini tidak akan dapat login kembali.`"
      :icon="TrashIcon"
      icon-variant="danger"
      size="md"
    >
      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="deleteLibrarianMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="dark"
          @click="confirmDeleteLibrarian"
          :disabled="deleteLibrarianMutation.isPending.value"
        >
          {{ deleteLibrarianMutation.isPending.value ? 'Menghapus...' : 'Ya, Hapus Pustakawan' }}
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
