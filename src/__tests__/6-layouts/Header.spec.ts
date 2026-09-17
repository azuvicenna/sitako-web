import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Header from '@/components/layout/Header.vue';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser, MemberUser } from '@/types/auth';

describe('Header (Layer 6)', () => {
  let router: ReturnType<typeof createRouter>;

  const mockMember: MemberUser = {
    id: 'usr-m1',
    nama: 'Budi Santoso',
    email: 'budi@example.com',
    telepon: '081234567890',
    foto: null,
    status_aktif: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    nis: '123456',
  };

  const mockLibrarian: LibrarianUser = {
    id: 'usr-l1',
    nama: 'Siti Rahma',
    email: 'siti@example.com',
    telepon: '081298765432',
    foto: null,
    status_aktif: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    nip: '987654321',
  };

  beforeEach(async () => {
    setActivePinia(createPinia());
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/pustakawan/profil', component: { template: '<div>Librarian Profile</div>' } },
        { path: '/anggota/profil', component: { template: '<div>Member Profile</div>' } },
        { path: '/anggota/katalog', component: { template: '<div>Catalog</div>' } },
      ],
    });
    await router.push('/');
    await router.isReady();
  });

  it('emits toggleSidebar when hamburger button is clicked', async () => {
    const wrapper = mount(Header, {
      global: { plugins: [router] },
    });

    const toggleBtn = wrapper.find('button[aria-label="Toggle Sidebar"]');
    expect(toggleBtn.exists()).toBe(true);

    await toggleBtn.trigger('click');
    expect(wrapper.emitted('toggleSidebar')).toBeTruthy();
    expect(wrapper.emitted('toggleSidebar')?.length).toBe(1);
  });

  it('renders librarian profile information and search placeholder', () => {
    const authStore = useAuthStore();
    authStore.setUser(mockLibrarian);

    const wrapper = mount(Header, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain('Siti Rahma');
    expect(wrapper.text()).toContain('NIP: 987654321');
    expect(wrapper.text()).toContain('Pustakawan');
    expect(wrapper.text()).toContain('S'); // Initial of Siti

    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toContain('Cari ISBN, Judul, atau Nama Anggota');

    const profileLink = wrapper.find('a[title="Buka Profil Saya"]');
    expect(profileLink.attributes('href')).toBe('/pustakawan/profil');
  });

  it('renders member profile information and catalog placeholder', () => {
    const authStore = useAuthStore();
    authStore.setUser(mockMember);

    const wrapper = mount(Header, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain('Budi Santoso');
    expect(wrapper.text()).toContain('NIS: 123456');
    expect(wrapper.text()).toContain('Anggota');
    expect(wrapper.text()).toContain('B'); // Initial of Budi

    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toContain('Cari judul buku atau ISBN');

    const profileLink = wrapper.find('a[title="Buka Profil Saya"]');
    expect(profileLink.attributes('href')).toBe('/anggota/profil');
  });
});
