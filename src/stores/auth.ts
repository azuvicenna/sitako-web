import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => user.value !== null);

  const role = computed<UserRole | null>(() => {
    if (!user.value) return null;
    if ('nip' in user.value && user.value.nip) return 'Pustakawan';
    if ('nis' in user.value && user.value.nis) return 'Anggota';
    return user.value.role ?? null;
  });

  const setUser = (newUser: User | null) => {
    user.value = newUser;
  };

  const clearUser = () => {
    user.value = null;
  };

  return {
    user,
    isInitialized,
    isAuthenticated,
    role,
    setUser,
    clearUser,
  };
});
