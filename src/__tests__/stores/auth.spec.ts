import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser, MemberUser } from '@/types/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with unauthenticated state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.role).toBeNull();
  });

  it('correctly identifies Librarian role from nip', () => {
    const store = useAuthStore();
    const librarian: LibrarianUser = {
      id: 'lib-1',
      nama: 'Pak Joko',
      nip: '19870101',
      email: 'joko@school.sch.id',
      telepon: '08123456789',
      foto: 'foto.jpg',
      status_aktif: true,
      createdAt: '2026-09-16T00:00:00.000Z',
    };

    store.setUser(librarian);
    expect(store.isAuthenticated).toBe(true);
    expect(store.role).toBe('Pustakawan');
  });

  it('correctly identifies Member role from nis', () => {
    const store = useAuthStore();
    const member: MemberUser = {
      id: 'mem-1',
      nama: 'Budi Santoso',
      nis: '2024001',
      email: 'budi@school.sch.id',
      telepon: '08987654321',
      foto: 'foto.jpg',
      status_aktif: true,
      createdAt: '2026-09-16T00:00:00.000Z',
    };

    store.setUser(member);
    expect(store.isAuthenticated).toBe(true);
    expect(store.role).toBe('Anggota');
  });

  it('clears user state on clearUser', () => {
    const store = useAuthStore();
    store.setUser({
      id: 'lib-1',
      nama: 'Pak Joko',
      nip: '19870101',
      email: 'joko@school.sch.id',
      telepon: '08123456789',
      foto: 'foto.jpg',
      status_aktif: true,
      createdAt: '2026-09-16T00:00:00.000Z',
    });
    expect(store.isAuthenticated).toBe(true);

    store.clearUser();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.role).toBeNull();
  });
});
