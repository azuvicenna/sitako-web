import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LoginView from '@/views/auth/LoginView.vue';

const mockPush = vi.fn<(to: string) => Promise<void>>();
const mockReplace = vi.fn<(to: string) => Promise<void>>();
const mockFetchCaptcha = vi
  .fn<() => Promise<string>>()
  .mockResolvedValue('<svg>mock-captcha</svg>');
const mockLoginAsync = vi.fn<(payload: unknown) => Promise<unknown>>();
const mockShowToast = vi.fn<(type: string, message: string) => void>();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    loginAsync: mockLoginAsync,
    isLoggingIn: false,
    fetchCaptcha: mockFetchCaptcha,
  }),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    mockReplace.mockClear();
    mockFetchCaptcha.mockClear();
    mockLoginAsync.mockClear();
    mockShowToast.mockClear();
  });

  it('renders login form and loads captcha on mount', async () => {
    const wrapper = mount(LoginView);
    await flushPromises();

    expect(wrapper.text()).toContain('Masuk ke Akun');
    expect(wrapper.text()).toContain('NIP / NIS');
    expect(wrapper.text()).toContain('Kata Sandi');
    expect(wrapper.text()).toContain('Kode Verifikasi (CAPTCHA)');
    expect(mockFetchCaptcha).toHaveBeenCalled();
    expect(wrapper.html()).toContain('mock-captcha');
  });

  it('validates required fields on submit without input', async () => {
    const wrapper = mount(LoginView);
    await flushPromises();

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mockLoginAsync).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('NIP/NIS tidak boleh kosong');
    expect(wrapper.text()).toContain('Password tidak boleh kosong');
    expect(wrapper.text()).toContain('Captcha tidak boleh kosong');
  });

  it('submits credentials when fields are valid', async () => {
    mockLoginAsync.mockResolvedValueOnce({
      success: true,
      message: 'Login sukses',
      user: { id: '1', nama: 'Admin', nip: '123456' },
    });

    const wrapper = mount(LoginView);
    await flushPromises();

    const idInput = wrapper.find('input[name="identifier"]');
    const pwdInput = wrapper.find('input[name="password"]');
    const captchaInput = wrapper.find('input[name="captcha"]');

    await idInput.setValue('198501012010011001');
    await pwdInput.setValue('secret123');
    await captchaInput.setValue('abc12');

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(mockLoginAsync).toHaveBeenCalledWith({
      identifier: '198501012010011001',
      password: 'secret123',
      captcha: 'abc12',
    });
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Login sukses');
  });
});
