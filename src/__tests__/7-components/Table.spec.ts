import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Table from '@/components/tables/Table.vue';
import type { TableColumn, PaginationMeta } from '@/types/table';

interface SampleItem {
  id: string;
  judul: string;
  penulis: string;
  stok: number;
}

describe('Table Component (Layer 7)', () => {
  const columns: TableColumn<SampleItem>[] = [
    { key: 'judul', label: 'Judul Buku' },
    { key: 'penulis', label: 'Penulis' },
    { key: 'stok', label: 'Jumlah Stok', align: 'center' },
  ];

  const sampleItems: SampleItem[] = [
    { id: '1', judul: 'Laskar Pelangi', penulis: 'Andrea Hirata', stok: 12 },
    { id: '2', judul: 'Bumi Manusia', penulis: 'Pramoedya A. T.', stok: 8 },
  ];

  const sampleMeta: PaginationMeta = {
    page: 1,
    limit: 10,
    totalRows: 25,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: false,
  };

  it('renders table columns and rows correctly', () => {
    const wrapper = mount(Table, {
      props: {
        columns,
        items: sampleItems,
      },
    });

    const headers = wrapper.findAll('th');
    expect(headers.length).toBe(3);
    expect(headers[0].text()).toBe('Judul Buku');
    expect(headers[1].text()).toBe('Penulis');
    expect(headers[2].text()).toBe('Jumlah Stok');

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].text()).toContain('Laskar Pelangi');
    expect(rows[0].text()).toContain('Andrea Hirata');
    expect(rows[1].text()).toContain('Bumi Manusia');
  });

  it('renders custom cell slots', () => {
    const wrapper = mount(Table, {
      props: {
        columns,
        items: sampleItems,
      },
      slots: {
        'cell-stok': `<template #cell-stok="{ value }"><span class="badge-stock">{{ value }} pcs</span></template>`,
      },
    });

    const stockBadges = wrapper.findAll('.badge-stock');
    expect(stockBadges.length).toBe(2);
    expect(stockBadges[0].text()).toBe('12 pcs');
    expect(stockBadges[1].text()).toBe('8 pcs');
  });

  it('renders empty message when items array is empty', () => {
    const wrapper = mount(Table, {
      props: {
        columns,
        items: [],
        emptyMessage: 'Belum ada data buku tersimpan',
      },
    });

    expect(wrapper.text()).toContain('Belum ada data buku tersimpan');
  });

  it('renders loading skeleton rows when loading: true', () => {
    const wrapper = mount(Table, {
      props: {
        columns,
        items: sampleItems,
        loading: true,
      },
    });

    const pulseRows = wrapper.findAll('tbody tr.animate-pulse');
    expect(pulseRows.length).toBe(5);
  });

  it('renders pagination bar and emits change-page event', async () => {
    const wrapper = mount(Table, {
      props: {
        columns,
        items: sampleItems,
        meta: sampleMeta,
      },
    });

    expect(wrapper.text()).toContain('Menampilkan 1 - 10 dari 25 entri');

    // Page numbers rendered: 1, 2, 3
    const pageButtons = wrapper.findAll('button').filter((b) => /^\d+$/.test(b.text().trim()));
    expect(pageButtons.length).toBe(3);

    // Click page 2
    await pageButtons[1].trigger('click');
    expect(wrapper.emitted('change-page')?.[0]).toEqual([2]);

    // Next page button
    const nextBtn = wrapper.find('button[title="Halaman Selanjutnya"]');
    expect(nextBtn.attributes('disabled')).toBeUndefined();
    await nextBtn.trigger('click');
    expect(wrapper.emitted('change-page')?.[1]).toEqual([2]);

    // Prev page button is disabled on page 1
    const prevBtn = wrapper.find('button[title="Halaman Sebelumnya"]');
    expect(prevBtn.attributes('disabled')).toBeDefined();
  });
});
