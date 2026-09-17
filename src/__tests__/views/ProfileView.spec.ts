import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computed } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ProfileView from '@/views/profile/ProfileView.vue';
import { useAuthStore } from '@/stores/auth';
import type { LibrarianUser } from '@/types/auth';

const mockUpdateProfileAsync = vi.fn<(payload: unknown) => Promise<unknown>>();
const mockFetchProfile = vi.fn<() => Promise<null>>().mockResolvedValue(null);
const mockShowToast = vi.fn<(type: string, message: string) => void>();

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => {
    const authStore = useAuthStore();
    return {
      user: computed(() => authStore.user),
      role: computed(() => authStore.role),
      updateProfileAsync: mockUpdateProfileAsync,
      isUpdatingProfile: false,
      fetchProfile: mockFetchProfile,
    };
  },
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('ProfileView', () => {
  const dummyLibrarian: LibrarianUser = {
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

  beforeEach(() => {
    setActivePinia(createPinia());
    const authStore = useAuthStore();
    authStore.setUser(dummyLibrarian);
    mockUpdateProfileAsync.mockClear();
    mockFetchProfile.mockClear();
    mockShowToast.mockClear();
  });

  it('renders profile overview and placeholder when foto is null', async () => {
    const wrapper = mount(ProfileView);
    await flushPromises();

    expect(wrapper.text()).toContain('Profil Pengguna');
    expect(wrapper.text()).toContain('Ahmad Fauzi');
    expect(wrapper.text()).toContain('198501012010011001');
    expect(wrapper.text()).toContain('Foto Default');
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders profile photo when foto attribute is provided', async () => {
    const authStore = useAuthStore();
    authStore.setUser({
      ...dummyLibrarian,
      foto: 'https://storage.sitako.id/profiles/avatar.jpg',
    });

    const wrapper = mount(ProfileView);
    await flushPromises();

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://storage.sitako.id/profiles/avatar.jpg');
  });

  it('validates email format before submitting', async () => {
    const wrapper = mount(ProfileView);
    await flushPromises();

    const emailInput = wrapper.find('input[name="email"]');
    await emailInput.setValue('invalid-email');

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mockUpdateProfileAsync).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Format email tidak valid');
  });

  it('submits updated profile data successfully', async () => {
    mockUpdateProfileAsync.mockResolvedValueOnce({
      success: true,
      message: 'Profil berhasil diperbarui',
    });

    const wrapper = mount(ProfileView);
    await flushPromises();

    const nameInput = wrapper.find('input[name="nama"]');
    await nameInput.setValue('Ahmad Fauzi, M.Pd');

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mockUpdateProfileAsync).toHaveBeenCalledWith({
      nama: 'Ahmad Fauzi, M.Pd',
    });
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Profil berhasil diperbarui');
  });
});
