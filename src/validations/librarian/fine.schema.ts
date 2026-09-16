import { z } from 'zod';
import { CALCULATION_TYPES, FINE_TYPES } from '../constants';

export const createFineSchema = z.object({
  bukuId: z.string({ message: 'Buku wajib dipilih' }).trim().min(1, 'Buku tidak boleh kosong'),
  jenisDenda: z.enum(FINE_TYPES, { message: 'Jenis denda tidak valid' }).default('Terlambat'),
  hargaDenda: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z
      .number({ message: 'Harga denda wajib diisi angka' })
      .int('Harga denda harus angka bulat')
      .nonnegative('Harga denda tidak boleh minus'),
  ),
  metodePerhitungan: z
    .enum(CALCULATION_TYPES, {
      message: 'Metode perhitungan tidak valid',
    })
    .default('Akumulasi'),
});

export const updateFineSchema = createFineSchema.partial();

export type CreateFineInput = z.infer<typeof createFineSchema>;
export type UpdateFineInput = z.infer<typeof updateFineSchema>;
