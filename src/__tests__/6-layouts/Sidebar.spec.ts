import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import Sidebar from '@/components/layout/Sidebar.vue';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser, MemberUser } from '@/types/auth';

const mockLogoutAsync = vi.fn<() => Promise<void>>().mockResolvedValue();

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    logoutAsync: mockLogoutAsync,
  }),
}));

describe('Sidebar (Layer 6)', () => {
  let router: ReturnType<typeof createRouter>;

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

  beforeEach(async () => {
    setActivePinia(createPinia());
    mockLogoutAsync.mockClear();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/pustakawan/dashboard', component: { template: '<div>Librarian Dashboard</div>' } },
        { path: '/pustakawan/buku', component: { template: '<div>Books</div>' } },
        { path: '/pustakawan/rak', component: { template: '<div>Shelves</div>' } },
        { path: '/pustakawan/denda', component: { template: '<div>Fines</div>' } },
        { path: '/pustakawan/anggota', component: { template: '<div>Members</div>' } },
        { path: '/pustakawan/pustakawan', component: { template: '<div>Staff</div>' } },
        { path: '/pustakawan/peminjaman', component: { template: '<div>Borrowing</div>' } },
        { path: '/pustakawan/pengembalian', component: { template: '<div>Returns</div>' } },
        { path: '/pustakawan/laporan', component: { template: '<div>Reports</div>' } },
        { path: '/anggota/dashboard', component: { template: '<div>Member Dashboard</div>' } },
        { path: '/anggota/katalog', component: { template: '<div>Catalog</div>' } },
        { path: '/anggota/bookmark', component: { template: '<div>Bookmarks</div>' } },
        { path: '/anggota/peminjaman', component: { template: '<div>My Borrowing</div>' } },
        { path: '/anggota/denda', component: { template: '<div>My Fines</div>' } },
      ],
    });

    await router.push('/');
    await router.isReady();
  });

  it('adjusts width class based on isOpen prop', () => {
    const wrapperOpen = mount(Sidebar, {
      props: { isOpen: true },
      global: { plugins: [router] },
    });
    expect(wrapperOpen.find('aside').classes()).toContain('w-64');

    const wrapperClosed = mount(Sidebar, {
      props: { isOpen: false },
      global: { plugins: [router] },
    });
    expect(wrapperClosed.find('aside').classes()).toContain('w-0');
  });

  it('renders librarian menu items when authenticated as Pustakawan', () => {
    const authStore = useAuthStore();
    authStore.setUser(mockLibrarian);

    const wrapper = mount(Sidebar, {
      props: { isOpen: true },
      global: { plugins: [router] },
    });

    const text = wrapper.text();
    expect(text).toContain('Dashboard Pustakawan');
    expect(text).toContain('Kelola Rak Buku');
    expect(text).toContain('Kelola Buku Perpustakaan');
    expect(text).toContain('Kelola Denda Buku');
    expect(text).toContain('Daftar Pustakawan');

    // Anggota-specific menus must not be present
    expect(text).not.toContain('Katalog Buku');
    expect(text).not.toContain('Buku Tersimpan');
  });

  it('renders member menu items when authenticated as Anggota', () => {
    const authStore = useAuthStore();
    authStore.setUser(mockMember);

    const wrapper = mount(Sidebar, {
      props: { isOpen: true },
      global: { plugins: [router] },
    });

    const text = wrapper.text();
    expect(text).toContain('Dashboard Anggota');
    expect(text).toContain('Katalog Buku');
    expect(text).toContain('Buku Tersimpan');
    expect(text).toContain('Peminjaman Saya');
    expect(text).toContain('Riwayat & Denda');

    // Pustakawan-specific menus must not be present
    expect(text).not.toContain('Kelola Rak Buku');
    expect(text).not.toContain('Daftar Pustakawan');
  });

  it('executes logout workflow on confirmation', async () => {
    const authStore = useAuthStore();
    authStore.setUser(mockLibrarian);

    const wrapper = mount(Sidebar, {
      props: { isOpen: true },
      global: {
        plugins: [router],
        stubs: {
          Modal: {
            name: 'Modal',
            props: ['modelValue'],
            template:
              '<div v-if="modelValue" class="stub-modal"><slot name="footer" :close="() => {}" /></div>',
          },
        },
      },
    });

    // Find and click the Logout button in the sidebar
    const logoutBtn = wrapper.findAll('button').find((b) => b.text().includes('Logout'));
    expect(logoutBtn).toBeDefined();
    await logoutBtn?.trigger('click');

    // Confirm button in modal
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Ya, Keluar'));
    expect(confirmBtn).toBeDefined();
    await confirmBtn?.trigger('click');

    await flushPromises();

    expect(mockLogoutAsync).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/login');
  });
});
