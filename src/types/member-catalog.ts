export interface CatalogPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CatalogBookItem {
  id: string;
  judul: string;
  penulis: string;
  penerbit: string;
  isbn: string;
  genre: string[];
  tipeBuku: 'Fisik' | 'Digital';
  tahunTerbit: number;
  jumlahStok: number;
  cover: string | null;
  file?: string | null;
}

export interface CatalogListResponse {
  success: boolean;
  message: string;
  data: CatalogBookItem[];
  pagination: CatalogPagination;
}

export interface BookDetailResponse {
  success: boolean;
  message: string;
  id: string;
  judul: string;
  penulis: string;
  penerbit: string;
  isbn: string;
  genre: string[];
  tipeBuku: 'Fisik' | 'Digital';
  tahunTerbit: number;
  jumlahStok: number;
  cover: string | null;
  file?: string | null;
  createdAt: string;
}

export interface DigitalBookReadResponse {
  success: boolean;
  message: string;
  id: string;
  cover: string;
  file: string;
  createdAt: string;
}

export interface BookmarkBookDetail {
  id: string;
  judul: string;
  penulis: string;
  cover: string | null;
  tipeBuku: 'Fisik' | 'Digital';
  genre: string[];
}

export interface MemberBookmarkItem {
  id: string;
  buku: BookmarkBookDetail;
  createdAt: string;
}

export interface BookmarkListResponse {
  success: boolean;
  message: string;
  data: MemberBookmarkItem[];
  pagination: CatalogPagination;
}
