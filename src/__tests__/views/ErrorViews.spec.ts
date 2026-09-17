import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import NotFoundView from '@/views/errors/NotFoundView.vue';
import ForbiddenView from '@/views/errors/ForbiddenView.vue';
import ServerErrorView from '@/views/errors/ServerErrorView.vue';

// Mock router
const mockPush = vi.fn<(to: string) => Promise<void>>();
const mockBack = vi.fn<() => void>();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    logoutAsync: vi.fn<() => Promise<void>>(),
    isLoggingOut: false,
  }),
}));

describe('Error Views', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('renders NotFoundView (404) with correct title and status', () => {
    const wrapper = mount(NotFoundView);
    expect(wrapper.text()).toContain('404');
    expect(wrapper.text()).toContain('Halaman Tidak Ditemukan');
  });

  it('renders ForbiddenView (403) with correct title and status', () => {
    const wrapper = mount(ForbiddenView);
    expect(wrapper.text()).toContain('403');
    expect(wrapper.text()).toContain('Akses Ditolak');
  });

  it('renders ServerErrorView (500) with correct title and status', () => {
    const wrapper = mount(ServerErrorView);
    expect(wrapper.text()).toContain('500');
    expect(wrapper.text()).toContain('Terjadi Kesalahan Server');
  });
});
