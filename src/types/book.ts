import type { PaginationMeta } from '@/types/table';

export interface Book {
  id: string;
  judul: string;
  penulis: string;
  isbn: string;
  penerbit: string;
  genre: string[];
  tipeBuku: 'Fisik' | 'Digital';
  tahunTerbit: number;
  jumlahStok: number;
  cover: string;
  file?: string | null;
  createdAt: string;
}

export interface BookListResponse {
  success: boolean;
  message: string;
  data: Book[];
  meta: PaginationMeta;
}

export interface BookDetailResponse {
  success: boolean;
  message: string;
  data: Book;
}
