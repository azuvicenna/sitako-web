import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Select, { type SelectOption } from '@/components/common/Select.vue';

describe('Select Component (Layer 7)', () => {
  const sampleOptions: SelectOption[] = [
    { label: 'Fisik', value: 'Fisik' },
    { label: 'Digital', value: 'Digital' },
    { label: 'Tidak Aktif', value: 'Nonaktif', disabled: true },
  ];

  it('renders select with options and handles value change', async () => {
    const wrapper = mount(Select, {
      props: {
        modelValue: 'Fisik',
        options: sampleOptions,
        placeholder: 'Pilih Tipe Buku',
      },
    });

    const select = wrapper.find('select');
    expect((select.element as HTMLSelectElement).value).toBe('Fisik');

    const options = wrapper.findAll('option');
    // Placeholder + 3 options = 4 total
    expect(options.length).toBe(4);
    expect(options[0].text()).toBe('Pilih Tipe Buku');
    expect(options[0].attributes('disabled')).toBeDefined();

    await select.setValue('Digital');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Digital']);
  });

  it('respects disabled option attribute', () => {
    const wrapper = mount(Select, {
      props: {
        options: sampleOptions,
      },
    });

    const disabledOption = wrapper.findAll('option').find((o) => o.text() === 'Tidak Aktif');
    expect(disabledOption?.attributes('disabled')).toBeDefined();
  });

  it('disables the entire select when disabled prop is true', () => {
    const wrapper = mount(Select, {
      props: {
        disabled: true,
        options: sampleOptions,
      },
    });

    const select = wrapper.find('select');
    expect(select.attributes('disabled')).toBeDefined();
    expect(select.classes()).toContain('disabled:opacity-50');
  });
});
