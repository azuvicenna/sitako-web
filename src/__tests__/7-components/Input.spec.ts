import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Input from '@/components/common/Input.vue';
import { MagnifyingGlassIcon, EyeIcon } from '@heroicons/vue/24/outline';

describe('Input Component (Layer 7)', () => {
  it('renders input with default attributes and modelValue', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: 'Nilai Awal',
        placeholder: 'Masukkan nama...',
      },
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('Nilai Awal');
    expect(input.attributes('placeholder')).toBe('Masukkan nama...');
    expect(input.attributes('type')).toBe('text');
  });

  it('emits update:modelValue on text input', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: '' },
    });

    const input = wrapper.find('input');
    await input.setValue('Kata Kunci Baru');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Kata Kunci Baru']);
  });

  it('emits keydown, focus, and blur events', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: 'test' },
    });

    const input = wrapper.find('input');

    await input.trigger('focus');
    expect(wrapper.emitted('focus')).toBeTruthy();

    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('keydown')).toBeTruthy();

    await input.trigger('blur');
    expect(wrapper.emitted('blur')).toBeTruthy();
  });

  it('renders left and right icons with adjusted padding', () => {
    const wrapper = mount(Input, {
      props: {
        icon: MagnifyingGlassIcon,
        iconRight: EyeIcon,
      },
    });

    expect(wrapper.findComponent(MagnifyingGlassIcon).exists()).toBe(true);
    expect(wrapper.findComponent(EyeIcon).exists()).toBe(true);

    const input = wrapper.find('input');
    expect(input.classes()).toContain('pl-10');
    expect(input.classes()).toContain('pr-10');
  });

  it('disables input when disabled prop is true', () => {
    const wrapper = mount(Input, {
      props: { disabled: true },
    });

    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    expect(input.classes()).toContain('disabled:opacity-50');
  });
});
