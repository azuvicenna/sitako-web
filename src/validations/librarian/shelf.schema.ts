import { z } from 'zod';

export const createShelfSchema = z.object({
  namaRak: z
    .string({ message: 'Nama rak wajib diisi' })
    .trim()
    .min(1, 'Nama rak tidak boleh kosong'),
});

export const updateShelfSchema = createShelfSchema.partial();

export type CreateShelfInput = z.infer<typeof createShelfSchema>;
export type UpdateShelfInput = z.infer<typeof updateShelfSchema>;
