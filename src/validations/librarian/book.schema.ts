import { z } from 'zod';
import { BOOK_TYPES } from '../constants';

export const createBookSchema = z.object({
  judul: z
    .string({ message: 'Judul buku wajib diisi' })
    .trim()
    .min(1, 'Judul buku tidak boleh kosong'),
  penulis: z
    .string({ message: 'Nama penulis wajib diisi' })
    .trim()
    .min(1, 'Nama penulis tidak boleh kosong'),
  isbn: z.string({ message: 'ISBN wajib diisi' }).trim().min(1, 'ISBN tidak boleh kosong'),
  penerbit: z
    .string({ message: 'Penerbit wajib diisi' })
    .trim()
    .min(1, 'Penerbit tidak boleh kosong'),
  genre: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [val];
        }
      }
      return val;
    },
    z
      .array(z.string().trim().min(1, 'Genre tidak boleh kosong'))
      .min(1, 'Minimal pilih satu genre'),
  ),
  tipeBuku: z.enum(BOOK_TYPES, { message: 'Tipe buku tidak valid' }).default('Fisik'),
  tahunTerbit: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number({ message: 'Tahun terbit wajib diisi angka' }).int('Tahun terbit harus angka bulat'),
  ),
  jumlahStok: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z
      .number({ message: 'Jumlah stok wajib diisi angka' })
      .int('Jumlah stok harus angka bulat')
      .nonnegative('Jumlah stok tidak boleh minus')
      .default(0),
  ),
});

export const updateBookSchema = createBookSchema.partial();

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
