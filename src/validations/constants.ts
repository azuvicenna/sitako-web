import { z } from 'zod';

export const BOOK_TYPES = ['Fisik', 'Digital'] as const;
export const FINE_TYPES = ['Terlambat', 'Hilang'] as const;
export const CALCULATION_TYPES = ['Akumulasi', 'Flat'] as const;
export const TRANSACTION_STATUSES = [
  'Menunggu Persetujuan',
  'Dibatalkan',
  'Menunggu Diambil',
  'Dipinjam',
  'Dikembalikan',
  'Terlambat',
  'Tidak Mengembalikan',
] as const;
export const PAYMENT_METHODS = ['Tunai', 'Non-Tunai'] as const;
export const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'EXPIRED', 'FAILED'] as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export const imageFileSchema = z
  .custom<File>((file) => typeof window !== 'undefined' && file instanceof File, {
    message: 'Foto wajib diunggah',
  })
  .refine((file) => file.size <= MAX_PHOTO_SIZE, 'Ukuran foto maksimal 2MB')
  .refine(
    (file) => ALLOWED_PHOTO_MIME.includes(file.type),
    'Format foto harus JPG, PNG, atau WEBP',
  );

export const bookCoverSchema = z
  .custom<File>((file) => typeof window !== 'undefined' && file instanceof File, {
    message: 'Cover buku wajib diunggah',
  })
  .refine((file) => file.size <= MAX_COVER_SIZE, 'Ukuran cover maksimal 5MB')
  .refine(
    (file) => ALLOWED_PHOTO_MIME.includes(file.type),
    'Format cover harus JPG, PNG, atau WEBP',
  );

export const bookPdfSchema = z
  .custom<File>((file) => typeof window !== 'undefined' && file instanceof File)
  .optional()
  .refine((file) => !file || file.size <= MAX_PDF_SIZE, 'Ukuran file maksimal 20MB')
  .refine((file) => !file || file.type === 'application/pdf', 'Format file harus PDF');
