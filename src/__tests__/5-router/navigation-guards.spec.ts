import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser, MemberUser } from '@/types/auth';

const mockFetchProfile = vi.fn<() => Promise<unknown>>().mockResolvedValue(null);

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    fetchProfile: mockFetchProfile,
  }),
}));

vi.mock('nprogress', () => ({
  default: {
    configure: vi.fn<() => void>(),
    start: vi.fn<() => void>(),
    done: vi.fn<() => void>(),
  },
}));

describe('Router Navigation Guards (Layer 5)', () => {
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
    setActivePinia(createPinia());
    mockFetchProfile.mockClear();
  });

  it('calls fetchProfile if authStore is not initialized', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = false;

    await router.push('/login');
    expect(mockFetchProfile).toHaveBeenCalled();
  });

  it('updates document title based on route meta title', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;

    await router.push('/login');
    expect(document.title).toBe('Masuk | SITAKO');

    await router.push('/404');
    expect(document.title).toBe('404 - Halaman Tidak Ditemukan | SITAKO');
  });

  it('allows unauthenticated users to access public pages like /login and /404', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.clearUser();

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/login');

    await router.push('/404');
    expect(router.currentRoute.value.path).toBe('/404');
  });

  it('redirects unauthenticated users attempting protected routes to /login with redirect query', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.clearUser();

    await router.push('/pustakawan/dashboard');
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/pustakawan/dashboard');

    await router.push('/anggota/dashboard');
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/anggota/dashboard');
  });

  it('redirects authenticated librarian away from /login to /pustakawan/dashboard', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.setUser(mockLibrarian);

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/pustakawan/dashboard');
  });

  it('redirects authenticated member away from /login to /anggota/dashboard', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.setUser(mockMember);

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/anggota/dashboard');
  });

  it('allows librarian to access librarian-scoped routes', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.setUser(mockLibrarian);

    await router.push('/pustakawan/dashboard');
    expect(router.currentRoute.value.path).toBe('/pustakawan/dashboard');

    await router.push('/pustakawan/buku');
    expect(router.currentRoute.value.path).toBe('/pustakawan/buku');
  });

  it('blocks librarian from accessing member-only routes and redirects to /403', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.setUser(mockLibrarian);

    await router.push('/anggota/dashboard');
    expect(router.currentRoute.value.path).toBe('/403');
  });

  it('allows member to access member-scoped routes', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.setUser(mockMember);

    await router.push('/anggota/dashboard');
    expect(router.currentRoute.value.path).toBe('/anggota/dashboard');

    await router.push('/anggota/katalog');
    expect(router.currentRoute.value.path).toBe('/anggota/katalog');
  });

  it('blocks member from accessing librarian-only routes and redirects to /403', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;
    authStore.setUser(mockMember);

    await router.push('/pustakawan/dashboard');
    expect(router.currentRoute.value.path).toBe('/403');
  });

  it('redirects root route / based on active user role', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;

    authStore.setUser(mockMember);
    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/anggota/dashboard');

    authStore.setUser(mockLibrarian);
    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/pustakawan/dashboard');
  });

  it('redirects /profil route based on active user role', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;

    authStore.setUser(mockMember);
    await router.push('/profil');
    expect(router.currentRoute.value.path).toBe('/anggota/profil');

    authStore.setUser(mockLibrarian);
    await router.push('/profil');
    expect(router.currentRoute.value.path).toBe('/pustakawan/profil');
  });

  it('redirects unknown routes to /404', async () => {
    const authStore = useAuthStore();
    authStore.isInitialized = true;

    await router.push('/halaman-yang-tidak-pernah-ada');
    expect(router.currentRoute.value.path).toBe('/404');
  });
});
