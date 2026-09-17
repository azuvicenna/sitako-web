import { z } from 'zod';
import { EMAIL_REGEX } from '../constants';

export const updateProfileSchema = z
  .object({
    nama: z
      .string({ message: 'Nama lengkap wajib diisi' })
      .trim()
      .min(1, 'Nama lengkap tidak boleh kosong'),
    email: z
      .string({ message: 'Email wajib diisi' })
      .trim()
      .regex(EMAIL_REGEX, 'Format email tidak valid'),
    telepon: z
      .string({ message: 'Nomor telepon wajib diisi' })
      .trim()
      .min(1, 'Nomor telepon tidak boleh kosong'),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 6, {
        message: 'Kata sandi minimal 6 karakter',
      }),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Konfirmasi kata sandi tidak cocok',
      path: ['confirmPassword'],
    },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
