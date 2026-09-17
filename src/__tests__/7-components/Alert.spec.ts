import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Alert from '@/components/common/Alert.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';

describe('Alert Component (Layer 7)', () => {
  it('renders default mustard alert with title and description', () => {
    const wrapper = mount(Alert, {
      props: {
        title: 'Perhatian',
        description: 'Buku harus dikembalikan tepat waktu.',
      },
    });

    expect(wrapper.text()).toContain('Perhatian');
    expect(wrapper.text()).toContain('Buku harus dikembalikan tepat waktu.');
    expect(wrapper.classes()).toContain('bg-mustard/10');
  });

  it('renders danger variant styling', () => {
    const wrapper = mount(Alert, {
      props: {
        variant: 'danger',
        title: 'Kesalahan Sistem',
        description: 'Gagal terhubung ke server.',
      },
    });

    expect(wrapper.classes()).toContain('bg-red-50');
    expect(wrapper.classes()).toContain('border-red-200');
  });

  it('renders success variant styling', () => {
    const wrapper = mount(Alert, {
      props: {
        variant: 'success',
        title: 'Berhasil',
      },
    });

    expect(wrapper.classes()).toContain('bg-green-50');
    expect(wrapper.classes()).toContain('border-green-200');
  });

  it('renders icon and action slot', () => {
    const wrapper = mount(Alert, {
      props: {
        icon: InformationCircleIcon,
        title: 'Info Terkini',
      },
      slots: {
        action: '<button class="test-action-btn">Tutup</button>',
      },
    });

    expect(wrapper.findComponent(InformationCircleIcon).exists()).toBe(true);
    expect(wrapper.find('.test-action-btn').exists()).toBe(true);
  });
});
