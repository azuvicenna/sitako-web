import { z } from 'zod';

export const createStackSchema = z.object({
  rakId: z.string({ message: 'Rak wajib dipilih' }).trim().min(1, 'Rak tidak boleh kosong'),
  bukuId: z.string({ message: 'Buku wajib dipilih' }).trim().min(1, 'Buku tidak boleh kosong'),
  kdSusunan: z
    .string({ message: 'Kode susunan wajib diisi' })
    .trim()
    .min(1, 'Kode susunan tidak boleh kosong'),
  nomorSusunan: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z
      .number({ message: 'Nomor susunan wajib diisi angka' })
      .int('Nomor susunan harus angka bulat')
      .nonnegative('Nomor susunan tidak boleh minus'),
  ),
});

export const updateStackSchema = createStackSchema.partial();

export type CreateStackInput = z.infer<typeof createStackSchema>;
export type UpdateStackInput = z.infer<typeof updateStackSchema>;
