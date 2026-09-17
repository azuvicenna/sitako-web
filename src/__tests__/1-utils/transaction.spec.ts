import { describe, it, expect } from 'vitest';
import { getStatusBadgeVariant } from '@/utils/transaction';

describe('transaction utils', () => {
  it('memetakan status Dipinjam ke varian warning', () => {
    expect(getStatusBadgeVariant('Dipinjam')).toBe('warning');
  });

  it('memetakan status Dikembalikan ke varian success', () => {
    expect(getStatusBadgeVariant('Dikembalikan')).toBe('success');
  });

  it('memetakan status Terlambat dan Tidak Mengembalikan ke varian danger', () => {
    expect(getStatusBadgeVariant('Terlambat')).toBe('danger');
    expect(getStatusBadgeVariant('Tidak Mengembalikan')).toBe('danger');
  });

  it('memetakan status Menunggu Persetujuan dan Menunggu Diambil ke varian info', () => {
    expect(getStatusBadgeVariant('Menunggu Persetujuan')).toBe('info');
    expect(getStatusBadgeVariant('Menunggu Diambil')).toBe('info');
  });

  it('memetakan status Dibatalkan atau status lain yang tidak dikenal ke varian neutral', () => {
    expect(getStatusBadgeVariant('Dibatalkan')).toBe('neutral');
    expect(getStatusBadgeVariant('Status_Asing')).toBe('neutral');
  });
});
