import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/date';

describe('Utils: date', () => {
  it('formats valid date correctly', () => {
    const formatted = formatDate('2026-09-16T00:00:00.000Z', 'DD/MM/YYYY');
    expect(formatted).toBe('16/09/2026');
  });

  it('handles null and undefined safely with fallback', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate(null, 'DD/MM/YYYY', 'Tidak ada')).toBe('Tidak ada');
    expect(formatDate('invalid-date')).toBe('-');
  });

  it('formats datetime correctly', () => {
    const formatted = formatDateTime('2026-09-16T10:30:00.000Z', 'DD/MM/YYYY HH:mm');
    expect(formatted).toContain('16/09/2026');
  });

  it('handles relative time safely', () => {
    expect(formatRelativeTime(null)).toBe('-');
    expect(formatRelativeTime('2026-09-16')).toBeDefined();
  });
});
