import { z } from 'zod';
import { TRANSACTION_STATUSES } from '../constants';

export const createTransactionSchema = z.object({
  bukuId: z.string({ message: 'Buku wajib dipilih' }).trim().min(1, 'Buku tidak boleh kosong'),
  pustakawanId: z
    .string({ message: 'Pustakawan wajib dipilih' })
    .trim()
    .min(1, 'Pustakawan tidak boleh kosong'),
  tglPinjam: z.coerce.date({ message: 'Format tanggal pinjam tidak valid' }).optional(),
  tglKembali: z.coerce.date({ message: 'Format tanggal kembali tidak valid' }).optional(),
  status: z
    .enum(TRANSACTION_STATUSES, {
      message: 'Status transaksi tidak valid',
    })
    .default('Menunggu Persetujuan'),
});

export const returnTransactionSchema = z.object({
  isBukuHilang: z
    .boolean({ message: 'Status kehilangan buku wajib diisi (true/false)' })
    .default(false),
});

export type CreateMemberTransactionInput = z.infer<typeof createTransactionSchema>;
export type ReturnTransactionInput = z.infer<typeof returnTransactionSchema>;
