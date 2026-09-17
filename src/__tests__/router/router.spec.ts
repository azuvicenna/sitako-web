import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import router from '@/router';

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    fetchProfile: vi.fn<() => Promise<null>>().mockResolvedValue(null),
  }),
}));

describe('Router Configuration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
  });

  it('routes to /login correctly', async () => {
    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('routes to /404 correctly', async () => {
    await router.push('/404');
    expect(router.currentRoute.value.path).toBe('/404');
    expect(router.currentRoute.value.name).toBe('error404');
  });

  it('routes to /403 correctly', async () => {
    await router.push('/403');
    expect(router.currentRoute.value.path).toBe('/403');
    expect(router.currentRoute.value.name).toBe('error403');
  });

  it('routes to /500 correctly', async () => {
    await router.push('/500');
    expect(router.currentRoute.value.path).toBe('/500');
    expect(router.currentRoute.value.name).toBe('error500');
  });

  it('redirects unknown unregistered URLs to /404 by default', async () => {
    await router.push('/halaman-yang-sama-sekali-tidak-ada-12345');
    expect(router.currentRoute.value.path).toBe('/404');
  });

  it('redirects /profil to librarian/member profile route based on user role', async () => {
    // Dengan mock unauthenticated fallback, redirect ke login atau /pustakawan/profil
    await router.push('/profil');
    // Rute profil memerlukan auth, sehingga akan diredirect ke login dengan query redirect
    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.redirect).toBe('/pustakawan/profil');
  });
});
