import { describe, it, expect } from 'vitest';
import { createFineSchema, updateFineSchema } from '@/validations/librarian/fine.schema';

describe('fine.schema', () => {
  it('berhasil memvalidasi aturan denda baru dengan data lengkap', () => {
    const validFine = {
      bukuId: '01JMB23490ABC',
      jenisDenda: 'Terlambat',
      hargaDenda: 1000,
      metodePerhitungan: 'Akumulasi',
    };

    const parsed = createFineSchema.parse(validFine);
    expect(parsed.hargaDenda).toBe(1000);
    expect(parsed.metodePerhitungan).toBe('Akumulasi');
    expect(parsed.jenisDenda).toBe('Terlambat');
  });

  it('mengonversi string angka pada hargaDenda menjadi number', () => {
    const fineWithStringPrice = {
      bukuId: '01JMB23490ABC',
      hargaDenda: '5000',
    };

    const parsed = createFineSchema.parse(fineWithStringPrice);
    expect(parsed.hargaDenda).toBe(5000);
    expect(parsed.jenisDenda).toBe('Terlambat'); // default
    expect(parsed.metodePerhitungan).toBe('Akumulasi'); // default
  });

  it('gagal jika bukuId kosong', () => {
    const invalidFine = {
      bukuId: '',
      hargaDenda: 2000,
    };

    const result = createFineSchema.safeParse(invalidFine);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.bukuId).toBeDefined();
  });

  it('gagal jika harga denda bernilai negatif', () => {
    const invalidFine = {
      bukuId: '01JMB23490ABC',
      hargaDenda: -500,
    };

    const result = createFineSchema.safeParse(invalidFine);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.hargaDenda).toBeDefined();
  });

  it('mendukung update parsial dengan updateFineSchema', () => {
    const partialUpdate = {
      hargaDenda: 2500,
      metodePerhitungan: 'Flat',
    };

    const parsed = updateFineSchema.parse(partialUpdate);
    expect(parsed.hargaDenda).toBe(2500);
    expect(parsed.metodePerhitungan).toBe('Flat');
  });
});
