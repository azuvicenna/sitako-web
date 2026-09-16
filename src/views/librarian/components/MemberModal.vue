<script setup lang="ts">
import { ref, reactive, watch, onUnmounted, computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { UsersIcon, CameraIcon } from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import Toggle from '@/components/common/Toggle.vue';
import { api } from '@/utils/axios';
import { compressImage } from '@/utils/image';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { createMemberSchema, updateMemberSchema } from '@/validations/librarian/member.schema';
import type { MemberUser } from '@/types/auth';

interface Props {
  modelValue: boolean;
  member?: MemberUser | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  member: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const modalMode = computed(() => (props.member ? 'edit' : 'create'));
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
  if (form.fotoPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(form.fotoPreview);
  }
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

const initForm = () => {
  resetForm();
  if (props.member) {
    form.id = props.member.id;
    form.nama = props.member.nama;
    form.nis = props.member.nis;
    form.email = props.member.email;
    form.telepon = props.member.telepon;
    form.status_aktif = props.member.status_aktif;
    form.fotoPreview = props.member.foto;
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
  () => props.member,
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
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      modalMode.value === 'create'
        ? 'Data anggota baru berhasil ditambahkan!'
        : 'Data anggota berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menyimpan data anggota.'));
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
    const updatePayload: Record<string, unknown> = {
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
            <span v-else class="text-gray-400 font-normal">
              (Kosongkan jika tidak ingin mengubah)</span
            >
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
      <Button variant="secondary" @click="close" :disabled="memberMutation.isPending.value">
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
</template>
