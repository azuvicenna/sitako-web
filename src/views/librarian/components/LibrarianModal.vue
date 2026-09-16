<script setup lang="ts">
import { ref, reactive, watch, onUnmounted, computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { UserGroupIcon, CameraIcon } from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Toggle from '@/components/common/Toggle.vue';
import { api } from '@/utils/axios';
import { compressImage } from '@/utils/image';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import {
  createLibrarianSchema,
  updateLibrarianSchema,
} from '@/validations/librarian/librarian.schema';
import type { LibrarianUser } from '@/types/auth';

interface Props {
  modelValue: boolean;
  librarian?: LibrarianUser | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  librarian: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const modalMode = computed(() => (props.librarian ? 'edit' : 'create'));
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
  if (form.fotoPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(form.fotoPreview);
  }
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

const initForm = () => {
  resetForm();
  if (props.librarian) {
    form.id = props.librarian.id;
    form.nama = props.librarian.nama;
    form.nip = props.librarian.nip;
    form.email = props.librarian.email;
    form.telepon = props.librarian.telepon;
    form.status_aktif = props.librarian.status_aktif;
    form.fotoPreview = props.librarian.foto;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.librarian,
  () => {
    if (props.modelValue) {
      initForm();
    }
  },
);

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    formErrors.value.foto = 'Ukuran gambar maksimal 5MB sebelum kompresi';
    return;
  }

  if (form.fotoPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(form.fotoPreview);
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
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      modalMode.value === 'create'
        ? 'Data pustakawan baru berhasil ditambahkan!'
        : 'Data pustakawan berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menyimpan data pustakawan.'));
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
    const updatePayload: Record<string, unknown> = {
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

onUnmounted(() => {
  if (form.fotoPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(form.fotoPreview);
  }
});
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
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
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400">
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
          <p class="text-[11px] text-gray-500 mt-0.5">Format JPG, PNG, atau WEBP (Maksimal 2MB).</p>
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
            <span v-else class="text-gray-400 font-normal">
              (Kosongkan jika tidak ingin mengubah)</span
            >
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
      <Button variant="secondary" @click="close" :disabled="librarianMutation.isPending.value">
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
</template>
