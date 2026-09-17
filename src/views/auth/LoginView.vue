<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  BookOpenIcon,
  IdentificationIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightEndOnRectangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';

import Card from '@/components/common/Card.vue';
import FormField from '@/components/common/FormField.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Alert from '@/components/common/Alert.vue';

import { useAuth } from '@/composables/useAuth';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { loginSchema } from '@/validations/auth/auth.schema';
import { getErrorMessage } from '@/utils/error';
import { appInfo } from '@/data/app-info';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { loginAsync, isLoggingIn, fetchCaptcha } = useAuth();
const { showToast } = useToast();

const form = reactive({
  identifier: '',
  password: '',
  captcha: '',
});

const formErrors = reactive<Record<string, string | undefined>>({
  identifier: undefined,
  password: undefined,
  captcha: undefined,
});

const showPassword = ref(false);
const captchaSvg = ref<string>('');
const isFetchingCaptcha = ref(false);
const generalError = ref<string | null>(null);

const currentYear = new Date().getFullYear();

// Ambil gambar SVG CAPTCHA dari backend
const loadCaptcha = async () => {
  isFetchingCaptcha.value = true;
  try {
    const svgData = await fetchCaptcha();
    captchaSvg.value = svgData;
  } catch {
    generalError.value = 'Gagal memuat CAPTCHA. Silakan klik tombol muat ulang.';
  } finally {
    isFetchingCaptcha.value = false;
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  generalError.value = null;
  formErrors.identifier = undefined;
  formErrors.password = undefined;
  formErrors.captcha = undefined;

  // Validasi Zod di sisi client
  const validation = loginSchema.safeParse(form);
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      formErrors[field] = issue.message;
    }
    return;
  }

  try {
    const response = await loginAsync({
      identifier: form.identifier.trim(),
      password: form.password,
      captcha: form.captcha.trim(),
    });

    showToast('success', response.message || 'Login berhasil! Selamat datang.');

    // Navigasi ke URL tujuan
    const redirectUrl = route.query.redirect as string | undefined;
    if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      await router.push(redirectUrl);
    } else {
      if (authStore.role === 'Anggota') {
        await router.push('/anggota/dashboard');
      } else {
        await router.push('/pustakawan/dashboard');
      }
    }
  } catch (err) {
    generalError.value = getErrorMessage(err, 'Terjadi kesalahan saat mencoba masuk.');
    // Backend menghapus cookie captcha_token saat validasi gagal,
    // muat ulang captcha baru dan bersihkan input captcha
    form.captcha = '';
    await loadCaptcha();
  }
};

onMounted(async () => {
  // Jika user sudah login, langsung alihkan ke dashboard yang sesuai
  if (authStore.isAuthenticated && authStore.role) {
    if (authStore.role === 'Anggota') {
      router.replace('/anggota/dashboard');
    } else {
      router.replace('/pustakawan/dashboard');
    }
    return;
  }

  await loadCaptcha();
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col justify-between items-center px-4 py-8 font-sans"
  >
    <!-- Header Logo & Branding -->
    <header class="w-full max-w-md flex items-center justify-center gap-3 pt-4">
      <div class="w-12 h-12 rounded-2xl bg-mustard flex items-center justify-center shadow-sm">
        <BookOpenIcon class="w-7 h-7 text-charcoalDark" />
      </div>
      <div>
        <h1 class="font-extrabold text-2xl tracking-tight text-charcoalDark leading-none">
          {{ appInfo.name }}
        </h1>
        <p class="text-xs font-semibold text-gray-500 mt-1">
          {{ appInfo.description }}
        </p>
      </div>
    </header>

    <!-- Main Container -->
    <main class="w-full max-w-md my-auto py-6">
      <Card class="p-6 sm:p-8 shadow-sm border-gray-200">
        <!-- Form Header -->
        <div class="mb-6">
          <h2 class="text-xl font-bold text-charcoalDark tracking-tight">Masuk ke Akun</h2>
          <p class="text-xs text-gray-500 mt-1">
            Gunakan NIP untuk Pustakawan atau NIS untuk Siswa/Anggota.
          </p>
        </div>

        <!-- Alert Error Global -->
        <div v-if="generalError" class="mb-5">
          <Alert variant="danger" :title="generalError" class="py-3 px-4 text-xs" />
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4" novalidate>
          <!-- NIP / NIS -->
          <FormField label="NIP / NIS" required :error="formErrors.identifier">
            <Input
              id="identifier"
              name="identifier"
              v-model="form.identifier"
              placeholder="Masukkan NIP atau NIS Anda"
              :icon="IdentificationIcon"
              :disabled="isLoggingIn"
              autocomplete="username"
            />
          </FormField>

          <!-- Password -->
          <FormField label="Kata Sandi" required :error="formErrors.password">
            <Input
              id="password"
              name="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Masukkan kata sandi akun"
              :icon="LockClosedIcon"
              :disabled="isLoggingIn"
              autocomplete="current-password"
            >
              <template #iconRight>
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="text-gray-400 hover:text-charcoalDark transition-colors p-1 cursor-pointer focus:outline-none"
                  :title="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                  tabindex="-1"
                >
                  <EyeSlashIcon v-if="showPassword" class="w-5 h-5" />
                  <EyeIcon v-else class="w-5 h-5" />
                </button>
              </template>
            </Input>
          </FormField>

          <!-- Captcha Box -->
          <FormField
            label="Kode Verifikasi (CAPTCHA)"
            required
            :error="formErrors.captcha"
            hint="Ketik teks yang terlihat pada gambar di atas"
          >
            <!-- CAPTCHA Preview & Refresh -->
            <div class="flex items-center gap-2 mb-2">
              <div
                class="flex-1 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden select-none px-2"
                :class="{ 'opacity-50 animate-pulse': isFetchingCaptcha }"
              >
                <div
                  v-if="captchaSvg"
                  v-html="captchaSvg"
                  class="w-full h-full flex items-center justify-center [&>svg]:max-h-10 [&>svg]:w-auto"
                />
                <span v-else class="text-xs text-gray-400 font-medium"> Memuat CAPTCHA... </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                @click="loadCaptcha"
                :disabled="isFetchingCaptcha || isLoggingIn"
                class="h-12 w-12 px-0! flex items-center justify-center shrink-0 cursor-pointer"
                title="Muat ulang kode CAPTCHA"
              >
                <template #icon>
                  <ArrowPathIcon
                    :class="[
                      'w-5 h-5 text-charcoal',
                      isFetchingCaptcha ? 'animate-spin text-mustardHover' : '',
                    ]"
                  />
                </template>
              </Button>
            </div>

            <!-- CAPTCHA Input Field -->
            <Input
              id="captcha"
              name="captcha"
              v-model="form.captcha"
              placeholder="Masukkan kode CAPTCHA"
              :icon="ShieldCheckIcon"
              :disabled="isLoggingIn"
              autocomplete="off"
            />
          </FormField>

          <!-- Submit Button -->
          <div class="pt-2">
            <Button
              type="submit"
              variant="primary"
              :disabled="isLoggingIn || isFetchingCaptcha"
              class="w-full py-2.5! text-sm font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <template #icon>
                <ArrowRightEndOnRectangleIcon
                  v-if="!isLoggingIn"
                  class="w-5 h-5 text-charcoalDark"
                />
                <ArrowPathIcon v-else class="w-5 h-5 text-charcoalDark animate-spin" />
              </template>
              {{ isLoggingIn ? 'Memproses Masuk...' : 'Masuk ke Sistem' }}
            </Button>
          </div>
        </form>

        <!-- Information Note -->
        <div class="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5 text-gray-500">
          <InformationCircleIcon class="w-4 h-4 text-mustardHover shrink-0 mt-0.5" />
          <p class="text-[11px] leading-relaxed">
            Belum memiliki akun atau lupa kata sandi? Silakan hubungi petugas perpustakaan sekolah
            untuk aktivasi dan pengelolaan akun.
          </p>
        </div>
      </Card>
    </main>

    <!-- Footer -->
    <footer class="w-full max-w-md text-center py-3 text-xs text-gray-400">
      &copy; {{ currentYear }} {{ appInfo.name }} &bull; {{ appInfo.description }}
    </footer>
  </div>
</template>
