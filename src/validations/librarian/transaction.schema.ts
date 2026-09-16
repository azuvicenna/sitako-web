import { z } from 'zod';
import { TRANSACTION_STATUSES } from '../constants';

export const createTransactionSchema = z.object({
  bukuId: z.string({ message: 'Buku wajib dipilih' }).trim().min(1, 'Buku tidak boleh kosong'),
  pustakawanId: z
    .string({ message: 'Pustakawan pemberi izin wajib dipilih' })
    .trim()
    .min(1, 'Pustakawan pemberi izin tidak boleh kosong'),
  anggotaId: z
    .string({ message: 'Anggota yang meminjam wajib dipilih' })
    .trim()
    .min(1, 'Anggota yang meminjam tidak boleh kosong'),
  tglPinjam: z.coerce.date({ message: 'Format tanggal pinjam tidak valid' }).optional(),
  tglKembali: z.coerce.date({ message: 'Format tanggal kembali tidak valid' }).optional(),
  status: z
    .enum(TRANSACTION_STATUSES, {
      message: 'Status transaksi tidak valid',
    })
    .default('Menunggu Persetujuan'),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
