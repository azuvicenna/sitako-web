import { storeToRefs } from 'pinia';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { api } from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';
import type { LoginPayload, LoginResponse, ProfileResponse } from '@/types/auth';

export function useAuth() {
  const authStore = useAuthStore();
  const { user, isAuthenticated, role, isInitialized } = storeToRefs(authStore);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginPayload) => {
      const { data } = await api.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      authStore.setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      authStore.clearUser();
      queryClient.clear();
    },
  });

  const fetchCaptcha = async (): Promise<string> => {
    const { data } = await api.get<string>('/auth/captcha', {
      responseType: 'text',
    });
    return data;
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get<ProfileResponse>('/profile/me');
      authStore.setUser(data);
      return data;
    } catch {
      authStore.clearUser();
      return null;
    } finally {
      authStore.isInitialized = true;
    }
  };

  return {
    user,
    isAuthenticated,
    role,
    isInitialized,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    fetchCaptcha,
    fetchProfile,
  };
}
