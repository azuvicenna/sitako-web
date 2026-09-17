import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from '@/components/common/Modal.vue';

describe('Modal Component (Layer 7)', () => {
  const mountModal = (props = {}, slots = {}) => {
    return mount(Modal, {
      props: {
        modelValue: true,
        title: 'Judul Modal',
        description: 'Deskripsi modal informasi',
        ...props,
      },
      slots,
      global: {
        stubs: {
          Teleport: {
            props: ['to'],
            template: '<slot />',
          },
          Transition: {
            template: '<slot />',
          },
        },
      },
    });
  };

  it('does not render content when modelValue is false', () => {
    const wrapper = mountModal({ modelValue: false });
    expect(wrapper.find('div[role="dialog"]').exists()).toBe(false);
  });

  it('renders modal dialog with title and description when modelValue is true', () => {
    const wrapper = mountModal();
    expect(wrapper.find('div[role="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Judul Modal');
    expect(wrapper.text()).toContain('Deskripsi modal informasi');
  });

  it('emits update:modelValue false and close event when close button is clicked', async () => {
    const wrapper = mountModal();
    const closeBtn = wrapper.find('button');
    expect(closeBtn.exists()).toBe(true);

    await closeBtn.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('renders body slot and footer slot with close function', () => {
    const wrapper = mountModal(
      {},
      {
        default: '<p class="test-body">Isi Form</p>',
        footer: '<button class="test-footer-btn">Aksi</button>',
      },
    );

    expect(wrapper.find('.test-body').text()).toBe('Isi Form');
    expect(wrapper.find('.test-footer-btn').text()).toBe('Aksi');
  });

  it('hides close button when showCloseButton is false', () => {
    const wrapper = mountModal({ showCloseButton: false });
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
