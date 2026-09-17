import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Checkbox from '@/components/common/Checkbox.vue';

describe('Checkbox Component (Layer 7)', () => {
  it('renders unchecked boolean state by default', () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        label: 'Ingat Saya',
        description: 'Simpan sesi login Anda',
      },
    });

    const input = wrapper.find('input[type="checkbox"]');
    expect((input.element as HTMLInputElement).checked).toBe(false);
    expect(wrapper.text()).toContain('Ingat Saya');
    expect(wrapper.text()).toContain('Simpan sesi login Anda');
    expect(wrapper.find('svg').exists()).toBe(false);
  });

  it('toggles boolean modelValue on click', async () => {
    const wrapper = mount(Checkbox, {
      props: { modelValue: false },
    });

    const input = wrapper.find('input[type="checkbox"]');
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(wrapper.emitted('change')?.[0]).toEqual([true]);
  });

  it('renders CheckIcon when checked', () => {
    const wrapper = mount(Checkbox, {
      props: { modelValue: true },
    });

    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('handles array modelValue for multi-checkbox lists', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: ['buku-1'],
        value: 'buku-2',
      },
    });

    const input = wrapper.find('input[type="checkbox"]');
    expect((input.element as HTMLInputElement).checked).toBe(false);

    // Check buku-2
    await input.trigger('change');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['buku-1', 'buku-2']]);

    // Uncheck when already in array
    const wrapperAlreadyChecked = mount(Checkbox, {
      props: {
        modelValue: ['buku-1', 'buku-2'],
        value: 'buku-1',
      },
    });
    const inputAlreadyChecked = wrapperAlreadyChecked.find('input[type="checkbox"]');
    expect((inputAlreadyChecked.element as HTMLInputElement).checked).toBe(true);

    await inputAlreadyChecked.trigger('change');
    expect(wrapperAlreadyChecked.emitted('update:modelValue')?.[0]).toEqual([['buku-2']]);
  });

  it('prevents interaction when disabled', async () => {
    const wrapper = mount(Checkbox, {
      props: {
        modelValue: false,
        disabled: true,
      },
    });

    const input = wrapper.find('input[type="checkbox"]');
    expect(input.attributes('disabled')).toBeDefined();

    await input.trigger('change');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
