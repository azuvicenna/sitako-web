import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormField from '@/components/common/FormField.vue';

describe('FormField Component (Layer 7)', () => {
  it('renders label with required asterisk when required: true', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Nama Lengkap',
        required: true,
      },
      slots: {
        default: '<input class="test-input" />',
      },
    });

    expect(wrapper.find('label').text()).toContain('Nama Lengkap');
    expect(wrapper.find('label span').text()).toBe('*');
    expect(wrapper.find('.test-input').exists()).toBe(true);
  });

  it('renders hint when no error is present', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'ISBN',
        hint: '10 atau 13 digit angka standar',
      },
    });

    expect(wrapper.text()).toContain('10 atau 13 digit angka standar');
  });

  it('displays error message and hides hint when error is present', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Email',
        hint: 'Gunakan email sekolah',
        error: 'Format email tidak valid',
      },
    });

    expect(wrapper.text()).toContain('Format email tidak valid');
    expect(wrapper.text()).not.toContain('Gunakan email sekolah');
    expect(wrapper.find('.text-red-500.font-medium').exists()).toBe(true);
  });
});
