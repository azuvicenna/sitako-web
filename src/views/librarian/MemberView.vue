<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useDebounceFn } from '@vueuse/core';
import dayjs from 'dayjs';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CameraIcon,
  EnvelopeIcon,
  PhoneIcon,
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
  createMemberSchema,
  updateMemberSchema,
} from '@/validations/librarian/member.schema';
import type { TableColumn } from '@/types/table';
import type { MemberUser } from '@/types/auth';
import type { MemberListResponse } from '@/types/user';

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
  data: membersResponse,
  isLoading,
} = useQuery({
  queryKey: ['members', page, statusActive, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      statusActive: statusActive.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<MemberListResponse>(`/user/members/?${params}`);
    return res.data;
  },
});

const members = computed<MemberUser[]>(() => membersResponse.value?.data || []);
const meta = computed(() => membersResponse.value?.meta || null);

const columns: TableColumn<MemberUser>[] = [
  { key: 'nama', label: 'Anggota / Siswa' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'status_aktif', label: 'Status Akun', align: 'center', width: 'w-32' },
  { key: 'createdAt', label: 'Terdaftar', width: 'w-36' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-28' },
];

const handlePageChange = (newPage: number) => {
  page.value = newPage;
};

// --- STATE & MUTATION: FORM TAMBAH / EDIT ANGGOTA ---
const isModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const fileInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  id: '',
  nama: '',
  nis: '',
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
  form.nis = '';
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

const openEditModal = (member: MemberUser) => {
  resetForm();
  modalMode.value = 'edit';
  form.id = member.id;
  form.nama = member.nama;
  form.nis = member.nis;
  form.email = member.email;
  form.telepon = member.telepon;
  form.status_aktif = member.status_aktif;
  form.fotoPreview = member.foto;
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

const memberMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    if (modalMode.value === 'create') {
      const res = await api.post('/user/members/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.put(`/user/members/${form.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    isModalOpen.value = false;
    showToast(
      'success',
      modalMode.value === 'create'
        ? 'Data anggota baru berhasil ditambahkan!'
        : 'Data anggota berhasil diperbarui!',
    );
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menyimpan data anggota.');
  },
});

const submitMemberForm = () => {
  formErrors.value = {};

  if (modalMode.value === 'create') {
    if (!form.foto) {
      formErrors.value.foto = 'Foto profil wajib diunggah untuk anggota baru';
    }

    const validation = createMemberSchema.safeParse({
      nama: form.nama,
      nis: form.nis,
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
        nis: errors.nis?.[0],
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
      nis: form.nis,
      email: form.email,
      telepon: form.telepon,
      status_aktif: form.status_aktif,
    };
    if (form.password.trim()) {
      updatePayload.password = form.password;
    }

    const validation = updateMemberSchema.safeParse(updatePayload);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        nama: errors.nama?.[0],
        nis: errors.nis?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        telepon: errors.telepon?.[0],
      };
      return;
    }
  }

  const formData = new FormData();
  formData.append('nama', form.nama.trim());
  formData.append('nis', form.nis.trim());
  formData.append('email', form.email.trim());
  formData.append('telepon', form.telepon.trim());
  formData.append('status_aktif', String(form.status_aktif));
  if (form.password.trim()) {
    formData.append('password', form.password.trim());
  }
  if (form.foto) {
    formData.append('foto', form.foto);
  }

  memberMutation.mutate(formData);
};

// --- STATE & MUTATION: HAPUS ANGGOTA ---
const isDeleteModalOpen = ref(false);
const memberToDelete = ref<MemberUser | null>(null);

const openDeleteModal = (member: MemberUser) => {
  memberToDelete.value = member;
  isDeleteModalOpen.value = true;
};

const deleteMemberMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/user/members/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Data anggota berhasil dihapus!');
  },
  onError: (err: any) => {
    showToast('danger', err.message || 'Gagal menghapus data anggota.');
  },
});

const confirmDeleteMember = () => {
  if (memberToDelete.value) {
    deleteMemberMutation.mutate(memberToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Daftar Anggota</h2>
        <p class="text-sm text-gray-500 mt-1">
          Kelola data siswa dan pengguna perpustakaan yang terdaftar di SITAKO
        </p>
      </div>
      <Button
        variant="primary"
        :icon="PlusIcon"
        @click="openCreateModal"
        class="shrink-0"
      >
        Tambah Anggota
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
          placeholder="Cari nama, NIS, email, atau telepon..."
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total: <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? members.length }}</span> Anggota
      </div>
    </div>

    <!-- Tabel Data Anggota -->
    <Table
      :columns="columns"
      :items="members"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada data anggota yang terdaftar."
      @change-page="handlePageChange"
    >
      <!-- Cell Nama & NIS -->
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
            <span class="font-bold text-charcoalDark text-sm block leading-tight">
              {{ item.nama }}
            </span>
            <span class="text-[11px] text-gray-500 mt-0.5 block">NIS: {{ item.nis }}</span>
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
            title="Ubah Data Anggota"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Anggota"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TAMBAH / EDIT ANGGOTA -->
    <Modal
      v-model="isModalOpen"
      :title="modalMode === 'create' ? 'Tambah Anggota Baru' : 'Ubah Data Anggota'"
      :description="
        modalMode === 'create'
          ? 'Lengkapi informasi pendaftaran anggota/siswa baru di perpustakaan.'
          : 'Perbarui profil informasi keanggotaan dan kontak anggota.'
      "
      :icon="UsersIcon"
      size="lg"
    >
      <form @submit.prevent="submitMemberForm" class="space-y-4 pt-1">
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
              placeholder="Contoh: Budi Santoso"
              :disabled="memberMutation.isPending.value"
            />
            <p v-if="formErrors.nama" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.nama }}
            </p>
          </div>

          <!-- NIS -->
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              NIS (Nomor Induk Siswa) <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="form.nis"
              placeholder="Contoh: 202601001"
              :disabled="memberMutation.isPending.value"
            />
            <p v-if="formErrors.nis" class="text-xs text-red-500 mt-0.5 font-medium">
              {{ formErrors.nis }}
            </p>
          </div>

          <!-- Nomor Telepon -->
          <div>
            <label class="block text-xs font-bold text-charcoalDark mb-1">
              Nomor Telepon / WhatsApp <span class="text-red-500">*</span>
            </label>
            <Input
              v-model="form.telepon"
              placeholder="Contoh: 081234567890"
              :disabled="memberMutation.isPending.value"
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
              placeholder="budi@student.sch.id"
              :disabled="memberMutation.isPending.value"
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
              :placeholder="modalMode === 'create' ? 'Kata sandi akun anggota' : '••••••••'"
              :disabled="memberMutation.isPending.value"
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
              description="Anggota dengan status aktif diperbolehkan meminjam buku dan mengakses layanan sirkulasi."
              :disabled="memberMutation.isPending.value"
            />
          </div>
        </div>
      </form>

      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="memberMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="primary"
          @click="submitMemberForm"
          :disabled="memberMutation.isPending.value"
        >
          {{ memberMutation.isPending.value ? 'Menyimpan...' : 'Simpan Data' }}
        </Button>
      </template>
    </Modal>

    <!-- MODAL KONFIRMASI HAPUS ANGGOTA -->
    <Modal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Anggota"
      :description="`Apakah Anda yakin ingin menghapus anggota '${memberToDelete?.nama}' (${memberToDelete?.nis})? Riwayat keanggotaan ini akan dihapus dari sistem.`"
      :icon="TrashIcon"
      icon-variant="danger"
      size="md"
    >
      <template #footer="{ close }">
        <Button
          variant="secondary"
          @click="close"
          :disabled="deleteMemberMutation.isPending.value"
        >
          Batal
        </Button>
        <Button
          variant="dark"
          @click="confirmDeleteMember"
          :disabled="deleteMemberMutation.isPending.value"
        >
          {{ deleteMemberMutation.isPending.value ? 'Menghapus...' : 'Ya, Hapus Anggota' }}
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
