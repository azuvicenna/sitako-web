import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Toggle from '@/components/common/Toggle.vue';

describe('Toggle Component (Layer 7)', () => {
  it('renders unchecked toggle with role="switch" and aria-checked', () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        label: 'Status Aktif',
        description: 'Aktifkan akun anggota',
      },
    });

    const button = wrapper.find('button[role="switch"]');
    expect(button.attributes('aria-checked')).toBe('false');
    expect(button.classes()).toContain('bg-gray-300');
    expect(wrapper.text()).toContain('Status Aktif');
    expect(wrapper.text()).toContain('Aktifkan akun anggota');
  });

  it('toggles value and emits update:modelValue on click', async () => {
    const wrapper = mount(Toggle, {
      props: { modelValue: false },
    });

    const button = wrapper.find('button[role="switch"]');
    await button.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(wrapper.emitted('change')?.[0]).toEqual([true]);
  });

  it('reflects checked active state with mustard color', () => {
    const wrapper = mount(Toggle, {
      props: { modelValue: true },
    });

    const button = wrapper.find('button[role="switch"]');
    expect(button.attributes('aria-checked')).toBe('true');
    expect(button.classes()).toContain('bg-mustard');
  });

  it('supports size variations', () => {
    const smWrapper = mount(Toggle, {
      props: { size: 'sm' },
    });
    expect(smWrapper.find('button').classes()).toContain('w-7');

    const lgWrapper = mount(Toggle, {
      props: { size: 'lg' },
    });
    expect(lgWrapper.find('button').classes()).toContain('w-12');
  });

  it('does not toggle when disabled', async () => {
    const wrapper = mount(Toggle, {
      props: {
        modelValue: false,
        disabled: true,
      },
    });

    const button = wrapper.find('button[role="switch"]');
    expect(button.attributes('disabled')).toBeDefined();

    await button.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
