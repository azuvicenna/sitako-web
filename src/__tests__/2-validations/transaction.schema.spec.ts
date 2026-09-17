import { describe, it, expect } from 'vitest';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '@/validations/librarian/transaction.schema';

describe('transaction.schema', () => {
  it('berhasil memvalidasi pembuatan transaksi peminjaman baru', () => {
    const validTransaction = {
      bukuId: '01JMB23490ABC',
      pustakawanId: '01JMBLIB01DEF',
      anggotaId: '01JMBMEM01GHI',
      tglPinjam: '2026-09-17',
      tglKembali: '2026-09-24',
      status: 'Dipinjam',
    };

    const parsed = createTransactionSchema.parse(validTransaction);
    expect(parsed.bukuId).toBe('01JMB23490ABC');
    expect(parsed.status).toBe('Dipinjam');
  });

  it('gagal jika bukuId, pustakawanId, atau anggotaId kosong', () => {
    const invalidTransaction = {
      bukuId: '',
      pustakawanId: '   ',
      anggotaId: '',
    };

    const result = createTransactionSchema.safeParse(invalidTransaction);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.bukuId).toBeDefined();
    expect(result.error?.flatten().fieldErrors.pustakawanId).toBeDefined();
    expect(result.error?.flatten().fieldErrors.anggotaId).toBeDefined();
  });

  it('gagal jika status transaksi bukan dari enum yang valid', () => {
    const invalidStatus = {
      bukuId: '01JMB23490ABC',
      pustakawanId: '01JMBLIB01DEF',
      anggotaId: '01JMBMEM01GHI',
      status: 'Status_Ngawur',
    };

    const result = createTransactionSchema.safeParse(invalidStatus);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.status).toBeDefined();
  });

  it('mendukung pembaruan status transaksi parsial dengan updateTransactionSchema', () => {
    const partialUpdate = {
      status: 'Dikembalikan',
      tglKembali: new Date('2026-09-24'),
    };

    const parsed = updateTransactionSchema.parse(partialUpdate);
    expect(parsed.status).toBe('Dikembalikan');
  });
});
