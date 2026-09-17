import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToast } from '@/composables/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const { clearToast } = useToast();
    clearToast();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with null toast state', () => {
    const { toast } = useToast();
    expect(toast.value).toBeNull();
  });

  it('displays a toast message with specified type', () => {
    const { toast, showToast } = useToast();

    showToast('success', 'Data buku berhasil disimpan');

    expect(toast.value).toEqual({
      type: 'success',
      message: 'Data buku berhasil disimpan',
    });
  });

  it('auto-dismisses toast after default 3500ms', () => {
    const { toast, showToast } = useToast();

    showToast('danger', 'Terjadi kesalahan sistem');
    expect(toast.value).not.toBeNull();

    // Just before 3500ms
    vi.advanceTimersByTime(3499);
    expect(toast.value).not.toBeNull();

    // At 3500ms
    vi.advanceTimersByTime(1);
    expect(toast.value).toBeNull();
  });

  it('respects custom duration', () => {
    const { toast, showToast } = useToast();

    showToast('success', 'Pesan singkat', 1000);

    vi.advanceTimersByTime(999);
    expect(toast.value).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(toast.value).toBeNull();
  });

  it('resets timer when a new toast is shown consecutively', () => {
    const { toast, showToast } = useToast();

    showToast('danger', 'Pesan pertama', 2000);
    vi.advanceTimersByTime(1500);

    // Trigger second toast before first one expires
    showToast('success', 'Pesan kedua', 2000);
    expect(toast.value).toEqual({
      type: 'success',
      message: 'Pesan kedua',
    });

    // Advance by 1000ms: first toast would have expired here, but second should still be alive
    vi.advanceTimersByTime(1000);
    expect(toast.value).toEqual({
      type: 'success',
      message: 'Pesan kedua',
    });

    // Advance remaining 1000ms: second toast now expires
    vi.advanceTimersByTime(1000);
    expect(toast.value).toBeNull();
  });

  it('immediately removes toast when clearToast is called', () => {
    const { toast, showToast, clearToast } = useToast();

    showToast('success', 'Akan segera ditutup');
    expect(toast.value).not.toBeNull();

    clearToast();
    expect(toast.value).toBeNull();
  });
});
