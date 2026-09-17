<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import {
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline';

import Card from '@/components/common/Card.vue';
import FormField from '@/components/common/FormField.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Alert from '@/components/common/Alert.vue';
import Badge from '@/components/common/Badge.vue';

import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';
import { updateProfileSchema } from '@/validations/profile/profile.schema';
import { getErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/date';
import type { UpdateProfilePayload } from '@/types/auth';

const { user, role, updateProfileAsync, isUpdatingProfile, fetchProfile } = useAuth();
const { showToast } = useToast();

const form = reactive({
  nama: '',
  email: '',
  telepon: '',
  password: '',
  confirmPassword: '',
});

const formErrors = reactive<Record<string, string | undefined>>({
  nama: undefined,
  email: undefined,
  telepon: undefined,
  password: undefined,
  confirmPassword: undefined,
});

const showPassword = ref(false);
const avatarLoadError = ref(false);
const generalError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const isLibrarian = computed(() => {
  return role.value === 'Pustakawan' || (user.value && 'nip' in user.value);
});

const identifierLabel = computed(() => (isLibrarian.value ? 'NIP' : 'NIS'));
const identifierValue = computed(() => {
  if (!user.value) return '-';
  if ('nip' in user.value && user.value.nip) return user.value.nip;
  if ('nis' in user.value && user.value.nis) return user.value.nis;
  return '-';
});

const userInitials = computed(() => {
  const name = user.value?.nama?.trim();
  if (!name) return 'U';
  const parts = name.split(/\s+/);
  const first = parts[0];
  const second = parts[1];
  if (first && second && first[0] && second[0]) {
    return (first[0] + second[0]).toUpperCase();
  }
  return (first || 'U').substring(0, 2).toUpperCase();
});

const populateFormFromUser = () => {
  if (!user.value) return;
  form.nama = user.value.nama || '';
  form.email = user.value.email || '';
  form.telepon = user.value.telepon || '';
  form.password = '';
  form.confirmPassword = '';
};

watch(
  () => user.value,
  () => {
    populateFormFromUser();
  },
  { immediate: true },
);

watch(
  () => user.value?.foto,
  () => {
    avatarLoadError.value = false;
  },
);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleReset = () => {
  generalError.value = null;
  successMessage.value = null;
  formErrors.nama = undefined;
  formErrors.email = undefined;
  formErrors.telepon = undefined;
  formErrors.password = undefined;
  formErrors.confirmPassword = undefined;
  populateFormFromUser();
};

const handleSubmit = async () => {
  generalError.value = null;
  successMessage.value = null;
  formErrors.nama = undefined;
  formErrors.email = undefined;
  formErrors.telepon = undefined;
  formErrors.password = undefined;
  formErrors.confirmPassword = undefined;

  // Validasi form dengan Zod
  const validation = updateProfileSchema.safeParse(form);
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      formErrors[field] = issue.message;
    }
    return;
  }

  // Siapkan payload parsial sesuai API_DOCUMENTATION.md
  const payload: UpdateProfilePayload = {};

  if (form.nama.trim() && form.nama.trim() !== user.value?.nama) {
    payload.nama = form.nama.trim();
  }
  if (form.email.trim() && form.email.trim() !== user.value?.email) {
    payload.email = form.email.trim();
  }
  if (form.telepon.trim() && form.telepon.trim() !== user.value?.telepon) {
    payload.telepon = form.telepon.trim();
  }
  if (form.password && form.password.trim().length > 0) {
    payload.password = form.password;
  }

  // Jika tidak ada data yang berubah
  if (Object.keys(payload).length === 0) {
    successMessage.value = 'Tidak ada perubahan data profil yang disimpan.';
    return;
  }

  try {
    const response = await updateProfileAsync(payload);
    const msg = response.message || 'Profil berhasil diperbarui';
    successMessage.value = msg;
    showToast('success', msg);
    form.password = '';
    form.confirmPassword = '';
  } catch (err) {
    generalError.value = getErrorMessage(err, 'Gagal memperbarui informasi profil.');
  }
};

onMounted(async () => {
  try {
    await fetchProfile();
  } catch {
    // Sesi profil ditangani secara global
  }
});
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto pb-8 font-sans">
    <!-- Header Page -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
      <div>
        <h1 class="text-2xl font-extrabold text-charcoalDark tracking-tight">Profil Pengguna</h1>
        <p class="text-xs text-gray-500 mt-1">
          Kelola informasi identitas pribadi, kontak, dan keamanan akun SITAKO Anda.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Badge :variant="isLibrarian ? 'mustard' : 'info'" size="md">
          {{ isLibrarian ? 'Pustakawan' : 'Anggota Perpustakaan' }}
        </Badge>
        <Badge :variant="user?.status_aktif ? 'success' : 'danger'" size="md" dot>
          {{ user?.status_aktif ? 'Akun Aktif' : 'Nonaktif' }}
        </Badge>
      </div>
    </div>

    <!-- Alert Notifikasi Global -->
    <div v-if="generalError">
      <Alert variant="danger" :title="generalError" />
    </div>
    <div v-if="successMessage">
      <Alert variant="success" :title="successMessage" />
    </div>

    <!-- 2-Kolom Layout Profil -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- SISI KIRI: Kartu Ringkasan Akun (4 Kolom) -->
      <div class="lg:col-span-4 space-y-6">
        <Card class="p-6 text-center">
          <!-- Foto Profil atau Placeholder -->
          <div class="relative mx-auto w-32 h-32 mb-4">
            <div
              class="w-32 h-32 rounded-2xl overflow-hidden border-2 border-amber-200/90 shadow-sm flex items-center justify-center bg-amber-50"
            >
              <img
                v-if="user?.foto && !avatarLoadError"
                :src="user.foto"
                :alt="user.nama || 'Foto Profil'"
                class="w-full h-full object-cover"
                @error="avatarLoadError = true"
              />
              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center bg-amber-100 text-charcoalDark select-none"
              >
                <span class="text-3xl font-extrabold text-amber-900 tracking-wider">
                  {{ userInitials }}
                </span>
                <span class="text-[10px] font-semibold text-amber-800/80 mt-1"> Foto Default </span>
              </div>
            </div>
          </div>

          <!-- Nama & Identitas -->
          <h2 class="text-base font-bold text-charcoalDark leading-tight">
            {{ user?.nama || 'Nama Pengguna' }}
          </h2>
          <p class="text-xs font-semibold text-mustardHover mt-1 font-mono">
            {{ identifierLabel }}: {{ identifierValue }}
          </p>

          <div class="mt-6 pt-5 border-t border-gray-100 text-left space-y-3">
            <div class="flex items-center gap-3 text-xs">
              <div
                class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200"
              >
                <EnvelopeIcon class="w-4 h-4 text-charcoal" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</p>
                <p class="text-xs font-semibold text-charcoalDark truncate">
                  {{ user?.email || '-' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 text-xs">
              <div
                class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200"
              >
                <PhoneIcon class="w-4 h-4 text-charcoal" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Telepon</p>
                <p class="text-xs font-semibold text-charcoalDark truncate">
                  {{ user?.telepon || '-' }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 text-xs">
              <div
                class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200"
              >
                <CalendarDaysIcon class="w-4 h-4 text-charcoal" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Terdaftar Sejak
                </p>
                <p class="text-xs font-semibold text-charcoalDark truncate">
                  {{ formatDate(user?.createdAt, 'D MMMM YYYY') }}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- SISI KANAN: Formulir Pembaruan Data (8 Kolom) -->
      <div class="lg:col-span-8">
        <Card class="p-6 sm:p-8">
          <div class="border-b border-gray-100 pb-4 mb-6">
            <h3 class="text-base font-bold text-charcoalDark">Pengaturan Informasi Profil</h3>
            <p class="text-xs text-gray-500 mt-1">
              Data di bawah ini disinkronkan secara langsung dengan basis data perpustakaan SITAKO.
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
            <!-- Nama Lengkap -->
            <FormField label="Nama Lengkap" required :error="formErrors.nama">
              <Input
                id="profile-nama"
                name="nama"
                v-model="form.nama"
                placeholder="Masukkan nama lengkap Anda"
                :icon="UserIcon"
                :disabled="isUpdatingProfile"
              />
            </FormField>

            <!-- Identitas Terdaftar (NIP / NIS) - Read Only -->
            <FormField
              :label="identifierLabel"
              hint="Nomor identitas institusi bersifat permanen dan tidak dapat diubah sendiri."
            >
              <Input
                id="profile-identifier"
                :model-value="identifierValue"
                :icon="IdentificationIcon"
                disabled
              />
            </FormField>

            <!-- Baris Email & Telepon -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Alamat Email" required :error="formErrors.email">
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  v-model="form.email"
                  placeholder="contoh@sitako.sch.id"
                  :icon="EnvelopeIcon"
                  :disabled="isUpdatingProfile"
                />
              </FormField>

              <FormField label="Nomor Telepon / WhatsApp" required :error="formErrors.telepon">
                <Input
                  id="profile-telepon"
                  name="telepon"
                  type="tel"
                  v-model="form.telepon"
                  placeholder="Contoh: 081234567890"
                  :icon="PhoneIcon"
                  :disabled="isUpdatingProfile"
                />
              </FormField>
            </div>

            <!-- Bagian Ganti Kata Sandi (Opsional) -->
            <div class="pt-4 border-t border-gray-100">
              <div class="mb-4">
                <h4 class="text-sm font-bold text-charcoalDark flex items-center gap-2">
                  <LockClosedIcon class="w-4 h-4 text-mustardHover" />
                  <span>Keamanan &amp; Kata Sandi Akun</span>
                </h4>
                <p class="text-xs text-gray-400 mt-0.5">
                  Kosongkan kedua kolom di bawah jika Anda tidak berencana mengganti kata sandi.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Kata Sandi Baru -->
                <FormField
                  label="Kata Sandi Baru"
                  :error="formErrors.password"
                  hint="Minimal 6 karakter"
                >
                  <Input
                    id="profile-password"
                    name="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Kata sandi baru"
                    :icon="LockClosedIcon"
                    :disabled="isUpdatingProfile"
                    autocomplete="new-password"
                  >
                    <template #iconRight>
                      <button
                        type="button"
                        @click="togglePassword"
                        class="text-gray-400 hover:text-charcoalDark transition-colors p-1 cursor-pointer focus:outline-none"
                        :title="showPassword ? 'Sembunyikan' : 'Tampilkan'"
                        tabindex="-1"
                      >
                        <EyeSlashIcon v-if="showPassword" class="w-4 h-4" />
                        <EyeIcon v-else class="w-4 h-4" />
                      </button>
                    </template>
                  </Input>
                </FormField>

                <!-- Konfirmasi Kata Sandi Baru -->
                <FormField
                  label="Konfirmasi Kata Sandi Baru"
                  :error="formErrors.confirmPassword"
                  hint="Ketik ulang kata sandi baru"
                >
                  <Input
                    id="profile-confirm-password"
                    name="confirmPassword"
                    v-model="form.confirmPassword"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Ulangi kata sandi baru"
                    :icon="ShieldCheckIcon"
                    :disabled="isUpdatingProfile"
                    autocomplete="new-password"
                  />
                </FormField>
              </div>
            </div>

            <!-- Tombol Aksi -->
            <div class="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                @click="handleReset"
                :disabled="isUpdatingProfile"
                class="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                :disabled="isUpdatingProfile"
                class="shadow-xs cursor-pointer"
              >
                <template #icon>
                  <ArrowPathIcon v-if="isUpdatingProfile" class="w-4 h-4 animate-spin" />
                  <CheckIcon v-else class="w-4 h-4" />
                </template>
                {{ isUpdatingProfile ? 'Menyimpan Perubahan...' : 'Simpan Perubahan' }}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  </div>
</template>
