import { describe, it, expect } from 'vitest';
import { formatRupiah, parseRupiah } from '@/utils/currency';

describe('Utils: currency', () => {
  it('formats integer to rupiah format', () => {
    const result = formatRupiah(15000);
    // Intl format contains non-breaking space or standard space
    expect(result.replace(/\s/g, ' ')).toBe('Rp 15.000');
  });

  it('handles 0, null, and undefined values', () => {
    expect(formatRupiah(0).replace(/\s/g, ' ')).toBe('Rp 0');
    expect(formatRupiah(null)).toBe('Rp 0');
    expect(formatRupiah(undefined)).toBe('Rp 0');
    expect(formatRupiah(null, '-')).toBe('-');
  });

  it('parses formatted rupiah back to number', () => {
    expect(parseRupiah('Rp 15.000')).toBe(15000);
    expect(parseRupiah('15000')).toBe(15000);
    expect(parseRupiah('')).toBe(0);
  });
});
