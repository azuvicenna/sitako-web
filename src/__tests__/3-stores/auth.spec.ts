import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser, MemberUser } from '@/types/auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default empty state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.role).toBeNull();
    expect(store.isInitialized).toBe(false);
  });

  it('correctly sets member user and derives role "Anggota"', () => {
    const store = useAuthStore();
    const member: MemberUser = {
      id: 'usr-m1',
      nama: 'Budi Santoso',
      email: 'budi@example.com',
      telepon: '081234567890',
      foto: null,
      status_aktif: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      nis: 'NIS12345',
    };

    store.setUser(member);

    expect(store.user).toEqual(member);
    expect(store.isAuthenticated).toBe(true);
    expect(store.role).toBe('Anggota');
  });

  it('correctly sets librarian user and derives role "Pustakawan"', () => {
    const store = useAuthStore();
    const librarian: LibrarianUser = {
      id: 'usr-l1',
      nama: 'Siti Rahma',
      email: 'siti@example.com',
      telepon: '081298765432',
      foto: null,
      status_aktif: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      nip: 'NIP987654',
    };

    store.setUser(librarian);

    expect(store.user).toEqual(librarian);
    expect(store.isAuthenticated).toBe(true);
    expect(store.role).toBe('Pustakawan');
  });

  it('falls back to role property when nip/nis are not present', () => {
    const store = useAuthStore();
    const customUser = {
      id: 'usr-c1',
      nama: 'Staff Khusus',
      email: 'staff@example.com',
      telepon: '081211112222',
      foto: null,
      status_aktif: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      role: 'Pustakawan' as const,
    };

    store.setUser(customUser as unknown as LibrarianUser);

    expect(store.isAuthenticated).toBe(true);
    expect(store.role).toBe('Pustakawan');
  });

  it('returns null for role if user object lacks nip, nis, and role', () => {
    const store = useAuthStore();
    const unknownUser = {
      id: 'usr-u1',
      nama: 'Tanpa Identitas',
      email: 'anonymous@example.com',
      telepon: '081200000000',
      foto: null,
      status_aktif: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    store.setUser(unknownUser as unknown as MemberUser);

    expect(store.isAuthenticated).toBe(true);
    expect(store.role).toBeNull();
  });

  it('clears user state on clearUser()', () => {
    const store = useAuthStore();
    const member: MemberUser = {
      id: 'usr-m1',
      nama: 'Budi Santoso',
      email: 'budi@example.com',
      telepon: '081234567890',
      foto: null,
      status_aktif: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      nis: 'NIS12345',
    };

    store.setUser(member);
    expect(store.isAuthenticated).toBe(true);

    store.clearUser();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.role).toBeNull();
  });

  it('allows updating isInitialized state', () => {
    const store = useAuthStore();
    expect(store.isInitialized).toBe(false);

    store.isInitialized = true;
    expect(store.isInitialized).toBe(true);
  });
});
