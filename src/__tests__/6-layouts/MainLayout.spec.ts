import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MainLayout from '@/layouts/MainLayout.vue';
import { useToast } from '@/composables/useToast';

describe('MainLayout (Layer 6)', () => {
  beforeEach(() => {
    const { clearToast } = useToast();
    clearToast();
  });

  it('renders sidebar, header, and main router-view content area', () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          Sidebar: {
            name: 'Sidebar',
            template: '<aside class="stub-sidebar" :data-open="isOpen"></aside>',
            props: ['isOpen'],
          },
          Header: {
            name: 'Header',
            template: '<header class="stub-header"></header>',
          },
          RouterView: {
            template: '<div class="stub-router-view">Halaman Konten</div>',
          },
        },
      },
    });

    expect(wrapper.find('.stub-sidebar').exists()).toBe(true);
    expect(wrapper.find('.stub-header').exists()).toBe(true);
    expect(wrapper.find('.stub-router-view').exists()).toBe(true);
    expect(wrapper.find('.stub-sidebar').attributes('data-open')).toBe('true');
  });

  it('toggles sidebar open state when header emits toggleSidebar', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          Sidebar: {
            name: 'Sidebar',
            template: '<aside class="stub-sidebar" :data-open="isOpen"></aside>',
            props: ['isOpen'],
          },
          Header: {
            name: 'Header',
            template: '<header class="stub-header"></header>',
            emits: ['toggleSidebar'],
          },
          RouterView: true,
        },
      },
    });

    const header = wrapper.findComponent({ name: 'Header' });
    expect(wrapper.find('.stub-sidebar').attributes('data-open')).toBe('true');

    // First toggle: closes sidebar
    await header.vm.$emit('toggleSidebar');
    expect(wrapper.find('.stub-sidebar').attributes('data-open')).toBe('false');

    // Second toggle: re-opens sidebar
    await header.vm.$emit('toggleSidebar');
    expect(wrapper.find('.stub-sidebar').attributes('data-open')).toBe('true');
  });

  it('renders floating toast alert when toast state is set and dismisses on click', async () => {
    const { showToast, toast } = useToast();

    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          Sidebar: true,
          Header: true,
          RouterView: true,
          Transition: {
            template: '<slot />',
          },
        },
      },
    });

    // Initially no toast alert rendered
    expect(wrapper.text()).not.toContain('Notifikasi Sukses');

    // Trigger toast
    showToast('success', 'Notifikasi Sukses');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Notifikasi Sukses');

    // Click toast alert to dismiss
    const toastElement = wrapper.find('[title="Klik untuk menutup notifikasi"]');
    expect(toastElement.exists()).toBe(true);
    await toastElement.trigger('click');
    await wrapper.vm.$nextTick();

    expect(toast.value).toBeNull();
    expect(wrapper.find('[title="Klik untuk menutup notifikasi"]').exists()).toBe(false);
  });
});
