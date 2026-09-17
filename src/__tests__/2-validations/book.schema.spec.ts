import { describe, it, expect } from 'vitest';
import { createBookSchema, updateBookSchema } from '@/validations/librarian/book.schema';

describe('book.schema', () => {
  it('berhasil memvalidasi buku fisik baru dengan data lengkap', () => {
    const validBook = {
      judul: 'Clean Code',
      penulis: 'Robert C. Martin',
      isbn: '978-0132350884',
      penerbit: 'Prentice Hall',
      genre: ['Software Engineering', 'Programming'],
      tipeBuku: 'Fisik',
      tahunTerbit: 2008,
      jumlahStok: 5,
    };

    const parsed = createBookSchema.parse(validBook);
    expect(parsed.judul).toBe('Clean Code');
    expect(parsed.jumlahStok).toBe(5);
    expect(parsed.tipeBuku).toBe('Fisik');
  });

  it('berhasil mengurai genre dalam format string JSON array', () => {
    const bookWithJsonGenre = {
      judul: 'Clean Architecture',
      penulis: 'Robert C. Martin',
      isbn: '978-0134494166',
      penerbit: 'Prentice Hall',
      genre: JSON.stringify(['Software', 'Architecture']),
      tipeBuku: 'Digital',
      tahunTerbit: 2017,
      jumlahStok: 0,
    };

    const parsed = createBookSchema.parse(bookWithJsonGenre);
    expect(parsed.genre).toEqual(['Software', 'Architecture']);
  });

  it('gagal jika judul, penulis, atau penerbit kosong', () => {
    const invalidBook = {
      judul: '',
      penulis: '   ',
      isbn: '123',
      penerbit: '',
      genre: ['Fiction'],
      tahunTerbit: 2020,
      jumlahStok: 1,
    };

    const result = createBookSchema.safeParse(invalidBook);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.judul).toBeDefined();
    expect(result.error?.flatten().fieldErrors.penulis).toBeDefined();
    expect(result.error?.flatten().fieldErrors.penerbit).toBeDefined();
  });

  it('gagal jika jumlah stok bernilai negatif', () => {
    const invalidBook = {
      judul: 'Buku Negatif',
      penulis: 'Penulis A',
      isbn: '123456',
      penerbit: 'Penerbit A',
      genre: ['Technology'],
      tahunTerbit: 2022,
      jumlahStok: -2,
    };

    const result = createBookSchema.safeParse(invalidBook);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.jumlahStok).toBeDefined();
  });

  it('mendukung update parsial dengan updateBookSchema', () => {
    const partialUpdate = {
      jumlahStok: 10,
    };

    const parsed = updateBookSchema.parse(partialUpdate);
    expect(parsed.jumlahStok).toBe(10);
  });
});
