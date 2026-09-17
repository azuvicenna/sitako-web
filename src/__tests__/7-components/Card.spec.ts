import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '@/components/common/Card.vue';
import AccentCard from '@/components/common/AccentCard.vue';

describe('Card & AccentCard Components (Layer 7)', () => {
  it('Card renders header, body, and footer slots', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<div class="test-header">Judul Kartu</div>',
        default: '<div class="test-body">Konten Kartu</div>',
        footer: '<div class="test-footer">Footer Kartu</div>',
      },
    });

    expect(wrapper.find('.test-header').text()).toBe('Judul Kartu');
    expect(wrapper.find('.test-body').text()).toBe('Konten Kartu');
    expect(wrapper.find('.test-footer').text()).toBe('Footer Kartu');
    expect(wrapper.classes()).toContain('bg-white');
    expect(wrapper.classes()).toContain('rounded-xl');
  });

  it('AccentCard renders with default mustard top border', () => {
    const wrapper = mount(AccentCard, {
      slots: {
        default: 'Statistik Buku',
      },
    });

    expect(wrapper.text()).toBe('Statistik Buku');
    expect(wrapper.classes()).toContain('border-t-4');
    expect(wrapper.classes()).toContain('border-t-mustard');
  });

  it('AccentCard applies custom accent color', () => {
    const wrapper = mount(AccentCard, {
      props: {
        accentColor: 'border-t-emerald-500',
      },
      slots: {
        default: 'Statistik Anggota',
      },
    });

    expect(wrapper.classes()).toContain('border-t-emerald-500');
  });
});
