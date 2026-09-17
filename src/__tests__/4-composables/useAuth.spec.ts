import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { defineComponent } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { api } from '@/utils/axios';
import type { LibrarianUser, MemberUser } from '@/types/auth';

vi.mock('@/utils/axios', () => ({
  api: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
}));

function setupAuthComposable() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  let composableInstance!: ReturnType<typeof useAuth>;

  const TestHost = defineComponent({
    setup() {
      composableInstance = useAuth();
      return () => null;
    },
  });

  mount(TestHost, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
    },
  });

  return composableInstance;
}

describe('useAuth', () => {
  const mockMember: MemberUser = {
    id: 'usr-m1',
    nama: 'Budi Santoso',
    email: 'budi@example.com',
    telepon: '081234567890',
    foto: null,
    status_aktif: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    nis: 'NIS12345',
  };

  const mockLibrarian: LibrarianUser = {
    id: 'usr-l1',
    nama: 'Siti Rahma',
    email: 'siti@example.com',
    telepon: '081298765432',
    foto: null,
    status_aktif: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    nip: 'NIP987654',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches captcha string successfully', async () => {
    const auth = setupAuthComposable();
    vi.mocked(api.get).mockResolvedValueOnce({ data: '<svg>captcha</svg>' });

    const captcha = await auth.fetchCaptcha();

    expect(api.get).toHaveBeenCalledWith('/auth/captcha', {
      responseType: 'text',
    });
    expect(captcha).toBe('<svg>captcha</svg>');
  });

  it('fetches user profile successfully and populates auth store', async () => {
    const auth = setupAuthComposable();
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockMember });

    const result = await auth.fetchProfile();

    expect(api.get).toHaveBeenCalledWith('/profile/me');
    expect(result).toEqual(mockMember);
    expect(auth.user.value).toEqual(mockMember);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.role.value).toBe('Anggota');
    expect(auth.isInitialized.value).toBe(true);
  });

  it('clears user and sets isInitialized on fetchProfile error', async () => {
    const auth = setupAuthComposable();
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthorized'));

    const result = await auth.fetchProfile();

    expect(result).toBeNull();
    expect(auth.user.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.role.value).toBeNull();
    expect(auth.isInitialized.value).toBe(true);
  });

  it('authenticates user via loginAsync and updates store state', async () => {
    const auth = setupAuthComposable();
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Login berhasil',
        user: mockLibrarian,
      },
    });

    const response = await auth.loginAsync({
      identifier: 'NIP987654',
      password: 'password123',
      captcha: 'ABCD',
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      identifier: 'NIP987654',
      password: 'password123',
      captcha: 'ABCD',
    });
    expect(response.user).toEqual(mockLibrarian);
    expect(auth.user.value).toEqual(mockLibrarian);
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.role.value).toBe('Pustakawan');
  });

  it('updates profile via updateProfileAsync and syncs store state', async () => {
    const auth = setupAuthComposable();
    const updatedUser: MemberUser = {
      ...mockMember,
      nama: 'Budi Santoso Updated',
      telepon: '081299998888',
    };
    vi.mocked(api.put).mockResolvedValueOnce({
      data: updatedUser,
    });

    await auth.updateProfileAsync({
      nama: 'Budi Santoso Updated',
      telepon: '081299998888',
    });

    expect(api.put).toHaveBeenCalledWith('/profile/me', {
      nama: 'Budi Santoso Updated',
      telepon: '081299998888',
    });
    expect(auth.user.value).toEqual(updatedUser);
  });

  it('logs out and clears user store state via logoutAsync', async () => {
    const auth = setupAuthComposable();
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockMember });
    await auth.fetchProfile();
    expect(auth.isAuthenticated.value).toBe(true);

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, message: 'Logout berhasil' },
    });

    await auth.logoutAsync();

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(auth.user.value).toBeNull();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.role.value).toBeNull();
  });
});
