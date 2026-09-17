import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Header from '@/components/layout/Header.vue';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser } from '@/types/auth';

const dummyUser: LibrarianUser = {
  id: '01JMB39478',
  nama: 'Ahmad Fauzi',
  nip: '198501012010011001',
  email: 'ahmad.fauzi@sitako.sch.id',
  telepon: '081234567890',
  foto: null,
  status_aktif: true,
  createdAt: '2026-01-15T08:30:00.000Z',
  role: 'Pustakawan',
};

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn<(to: unknown) => Promise<void>>(),
  }),
}));

// Mock router-link
const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to" class="router-link-mock"><slot /></a>',
};

describe('Header Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    authStore.setUser(dummyUser);
  });

  it('contains router-link pointing to profile page', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
    });
    await flushPromises();

    const profileLink = wrapper.find('.router-link-mock');
    expect(profileLink.exists()).toBe(true);
    expect(profileLink.attributes('href')).toBe('/pustakawan/profil');
  });

  it('applies cursor-pointer on photo, name, NIP/NIS, and role area', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
    });
    await flushPromises();

    const link = wrapper.find('.router-link-mock');
    expect(link.classes()).toContain('cursor-pointer');

    // Cek foto container
    const avatarContainer = link.find('.w-9.h-9');
    expect(avatarContainer.classes()).toContain('cursor-pointer');

    // Cek nama, NIP, role
    const textNodes = link.findAll('p');
    for (const p of textNodes) {
      expect(p.classes()).toContain('cursor-pointer');
    }
  });

  it('renders placeholder when foto attribute is null', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
    });
    await flushPromises();

    // Foto bernilai null, maka tidak boleh ada img, melainkan inisial
    expect(wrapper.find('.router-link-mock img').exists()).toBe(false);
    expect(wrapper.find('.router-link-mock').text()).toContain('A');
  });

  it('renders user photo when foto attribute is provided', async () => {
    const authStore = useAuthStore();
    authStore.setUser({
      ...dummyUser,
      foto: 'https://storage.sitako.id/profiles/uuid.jpg',
    });

    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': RouterLinkStub,
        },
      },
    });
    await flushPromises();

    const img = wrapper.find('.router-link-mock img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://storage.sitako.id/profiles/uuid.jpg');
  });
});
