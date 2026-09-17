import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

describe('ConfirmModal Component (Layer 7)', () => {
  const mountConfirmModal = (props = {}, slots = {}) => {
    return mount(ConfirmModal, {
      props: {
        modelValue: true,
        title: 'Konfirmasi Hapus Buku',
        description: 'Buku ini akan dihapus permanen.',
        ...props,
      },
      slots,
      global: {
        stubs: {
          Modal: {
            name: 'Modal',
            props: ['modelValue', 'title', 'description'],
            template: `
              <div v-if="modelValue" class="stub-modal">
                <h3>{{ title }}</h3>
                <p>{{ description }}</p>
                <div class="modal-body"><slot /></div>
                <div class="modal-footer"><slot name="footer" /></div>
              </div>
            `,
          },
        },
      },
    });
  };

  it('renders title and description inside modal', () => {
    const wrapper = mountConfirmModal();
    expect(wrapper.text()).toContain('Konfirmasi Hapus Buku');
    expect(wrapper.text()).toContain('Buku ini akan dihapus permanen.');
    expect(wrapper.text()).toContain('Batal');
    expect(wrapper.text()).toContain('Ya, Hapus');
  });

  it('emits confirm when confirmation button is clicked', async () => {
    const wrapper = mountConfirmModal({
      confirmText: 'Lanjutkan',
    });

    const buttons = wrapper.findAll('button');
    const confirmBtn = buttons.find((b) => b.text().includes('Lanjutkan'));
    expect(confirmBtn).toBeDefined();

    await confirmBtn?.trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel and updates modelValue to false when cancel button is clicked', async () => {
    const wrapper = mountConfirmModal();

    const buttons = wrapper.findAll('button');
    const cancelBtn = buttons.find((b) => b.text().includes('Batal'));
    expect(cancelBtn).toBeDefined();

    await cancelBtn?.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('disables buttons and displays loading text when loading is true', () => {
    const wrapper = mountConfirmModal({
      loading: true,
    });

    const buttons = wrapper.findAll('button');
    expect(wrapper.text()).toContain('Memproses...');
    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeDefined();
    });
  });
});
