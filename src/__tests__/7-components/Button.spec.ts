import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '@/components/common/Button.vue';

describe('Button Component (Layer 7)', () => {
  it('renders default button with slot text', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Simpan Data' },
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.text()).toBe('Simpan Data');
    expect(wrapper.classes()).toContain('bg-gray-100'); // secondary default
  });

  it('renders primary variant with mustard background', () => {
    const wrapper = mount(Button, {
      props: { variant: 'primary' },
      slots: { default: 'Tambah Buku' },
    });

    expect(wrapper.classes()).toContain('bg-mustard');
  });

  it('renders dark variant with charcoal background', () => {
    const wrapper = mount(Button, {
      props: { variant: 'dark' },
      slots: { default: 'Hapus' },
    });

    expect(wrapper.classes()).toContain('bg-charcoalDark');
  });

  it('renders an anchor tag when href is passed', () => {
    const wrapper = mount(Button, {
      props: { href: 'https://example.com', target: '_blank' },
      slots: { default: 'Kunjungi Website' },
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('https://example.com');
    expect(wrapper.attributes('target')).toBe('_blank');
  });

  it('handles disabled state properly', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Sedang Proses' },
    });

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.classes()).toContain('disabled:opacity-50');

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
