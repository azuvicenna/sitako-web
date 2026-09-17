import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Badge from '@/components/common/Badge.vue';
import { CheckCircleIcon } from '@heroicons/vue/16/solid';

describe('Badge Component (Layer 7)', () => {
  it('renders default neutral badge with slot text', () => {
    const wrapper = mount(Badge, {
      slots: { default: 'Dipinjam' },
    });

    expect(wrapper.text()).toBe('Dipinjam');
    expect(wrapper.classes()).toContain('bg-gray-100');
    expect(wrapper.classes()).toContain('text-xs'); // md size default
  });

  it('renders different variants correctly', () => {
    const successWrapper = mount(Badge, {
      props: { variant: 'success' },
      slots: { default: 'Selesai' },
    });
    expect(successWrapper.classes()).toContain('bg-emerald-100');

    const dangerWrapper = mount(Badge, {
      props: { variant: 'danger' },
      slots: { default: 'Terlambat' },
    });
    expect(dangerWrapper.classes()).toContain('bg-rose-100');

    const warningWrapper = mount(Badge, {
      props: { variant: 'warning' },
      slots: { default: 'Perlu Konfirmasi' },
    });
    expect(warningWrapper.classes()).toContain('bg-amber-100');

    const infoWrapper = mount(Badge, {
      props: { variant: 'info' },
      slots: { default: 'Digital' },
    });
    expect(infoWrapper.classes()).toContain('bg-sky-100');
  });

  it('renders size variants (sm, lg)', () => {
    const smWrapper = mount(Badge, {
      props: { size: 'sm' },
      slots: { default: 'Kecil' },
    });
    expect(smWrapper.classes()).toContain('text-[11px]');

    const lgWrapper = mount(Badge, {
      props: { size: 'lg' },
      slots: { default: 'Besar' },
    });
    expect(lgWrapper.classes()).toContain('text-sm');
  });

  it('renders indicator dot when dot prop is true', () => {
    const wrapper = mount(Badge, {
      props: { dot: true, variant: 'success' },
      slots: { default: 'Aktif' },
    });

    const dot = wrapper.find('.rounded-full.shrink-0');
    expect(dot.exists()).toBe(true);
    expect(dot.classes()).toContain('bg-emerald-500');
  });

  it('renders icon when icon prop is passed', () => {
    const wrapper = mount(Badge, {
      props: { icon: CheckCircleIcon },
      slots: { default: 'Valid' },
    });

    expect(wrapper.findComponent(CheckCircleIcon).exists()).toBe(true);
  });
});
