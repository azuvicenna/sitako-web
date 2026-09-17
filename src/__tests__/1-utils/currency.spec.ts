import { describe, it, expect } from 'vitest';
import { formatRupiah, parseRupiah } from '@/utils/currency';

describe('currency utils', () => {
  describe('formatRupiah', () => {
    it('memformat angka positif menjadi format mata uang Rupiah', () => {
      const result = formatRupiah(50000);
      // Intl.NumberFormat id-ID menghasilkan format seperti 'Rp 50.000' (bisa menggunakan non-breaking space)
      expect(result.replace(/\s/g, ' ')).toBe('Rp 50.000');
    });

    it('memformat angka 0 dengan benar', () => {
      const result = formatRupiah(0);
      expect(result.replace(/\s/g, ' ')).toBe('Rp 0');
    });

    it('memformat string angka menjadi format Rupiah', () => {
      const result = formatRupiah('125000');
      expect(result.replace(/\s/g, ' ')).toBe('Rp 125.000');
    });

    it('mengembalikan fallback saat nilai null atau undefined', () => {
      expect(formatRupiah(null)).toBe('Rp 0');
      expect(formatRupiah(undefined)).toBe('Rp 0');
      expect(formatRupiah(null, '-')).toBe('-');
    });

    it('mengembalikan fallback saat input bukan angka valid (NaN)', () => {
      expect(formatRupiah('bukan_angka')).toBe('Rp 0');
      expect(formatRupiah('abc', 'Tidak Valid')).toBe('Tidak Valid');
    });
  });

  describe('parseRupiah', () => {
    it('mengurai string format Rupiah menjadi angka murni', () => {
      expect(parseRupiah('Rp 50.000')).toBe(50000);
      expect(parseRupiah('Rp 1.500.000')).toBe(1500000);
    });

    it('mengurai angka dengan koma desimal jika ada', () => {
      expect(parseRupiah('Rp 25.000,50')).toBe(25000.5);
    });

    it('mengembalikan 0 jika string tidak mengandung digit angka', () => {
      expect(parseRupiah('Rp -')).toBe(0);
      expect(parseRupiah('abc')).toBe(0);
    });
  });
});
