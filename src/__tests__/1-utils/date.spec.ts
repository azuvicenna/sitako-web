import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/date';

describe('date utils', () => {
  describe('formatDate', () => {
    it('memformat tanggal string ISO ke format default DD/MM/YYYY', () => {
      const result = formatDate('2026-09-17T08:30:00.000Z');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('memformat tanggal dengan format kustom', () => {
      const result = formatDate('2026-09-17', 'DD MMMM YYYY');
      expect(result).toBe('17 September 2026');
    });

    it('mengembalikan fallback jika tanggal null atau undefined', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined, 'YYYY-MM-DD', 'Kosong')).toBe('Kosong');
    });

    it('mengembalikan fallback jika string tanggal tidak valid', () => {
      expect(formatDate('tanggal_ngawur')).toBe('-');
    });
  });

  describe('formatDateTime', () => {
    it('memformat tanggal beserta jam dan menit', () => {
      const result = formatDateTime('2026-09-17T14:30:00.000Z');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    });

    it('mengembalikan fallback saat tanggal null', () => {
      expect(formatDateTime(null)).toBe('-');
    });
  });

  describe('formatRelativeTime', () => {
    it('mengembalikan waktu relatif lokal bahasa Indonesia', () => {
      // Menguji tanggal lampau
      const pastDate = new Date(Date.now() - 3600 * 1000); // 1 jam yang lalu
      const result = formatRelativeTime(pastDate);
      expect(result).toContain('yang lalu');
    });

    it('mengembalikan fallback saat tanggal tidak valid', () => {
      expect(formatRelativeTime(null)).toBe('-');
      expect(formatRelativeTime('invalid-date')).toBe('-');
    });
  });
});
