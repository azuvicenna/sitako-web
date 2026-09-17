import axios, { type AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; success?: boolean }>) => {
    const customMessage = error.response?.data?.message;
    if (customMessage) {
      error.message = customMessage;
    }

    // Tangani sesi kedaluwarsa (401 Unauthorized) saat pengguna sedang aktif
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const { useAuthStore } = await import('@/stores/auth');
        const authStore = useAuthStore();

        // Hanya redirect jika pengguna sebelumnya terotentikasi (bukan gagal login / initial check)
        if (authStore.isAuthenticated) {
          authStore.clearUser();
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            const { default: router } = await import('@/router');
            await router.push({
              name: 'login',
              query: { redirect: currentPath },
            });
          }
        }
      } catch {
        // Abaikan jika store atau router belum terinisialisasi
      }
    }

    return Promise.reject(error);
  },
);
