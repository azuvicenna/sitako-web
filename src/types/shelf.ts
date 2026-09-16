import type { PaginationMeta } from '@/types/table';

export interface Shelf {
  id: string;
  namaRak: string;
  createdAt: string;
  totalSusunan?: number;
}

export interface ShelfStack {
  id: string;
  rakId: string;
  bukuId: string;
  kdSusunan: string;
  nomorSusunan: number;
  judulBuku?: string;
  createdAt: string;
}

export interface ShelfListResponse {
  success: boolean;
  message: string;
  data: Shelf[];
  meta: PaginationMeta;
}

export interface ShelfStackListResponse {
  success: boolean;
  message: string;
  data: ShelfStack[];
  meta: PaginationMeta;
}
