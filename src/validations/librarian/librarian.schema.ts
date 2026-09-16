import { z } from 'zod';
import { EMAIL_REGEX } from '../constants';

export const createLibrarianSchema = z.object({
  nama: z
    .string({ message: 'Nama pustakawan wajib diisi' })
    .trim()
    .min(1, 'Nama pustakawan tidak boleh kosong'),
  nip: z.string({ message: 'NIP wajib diisi' }).trim().min(1, 'NIP tidak boleh kosong'),
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .regex(EMAIL_REGEX, 'Format email tidak valid'),
  password: z.string({ message: 'Password wajib diisi' }).min(1, 'Password tidak boleh kosong'),
  telepon: z
    .string({ message: 'Nomor telepon wajib diisi' })
    .trim()
    .min(1, 'Nomor telepon tidak boleh kosong'),
  status_aktif: z
    .union([z.boolean(), z.string()])
    .default(true)
    .transform((val) => val === true || val === 'true'),
});

export const updateLibrarianSchema = createLibrarianSchema.partial().extend({
  status_aktif: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? val === true || val === 'true' : undefined)),
});

export type CreateLibrarianInput = z.infer<typeof createLibrarianSchema>;
export type UpdateLibrarianInput = z.infer<typeof updateLibrarianSchema>;
