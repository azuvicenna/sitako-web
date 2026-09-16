import type { PaginationMeta } from '@/types/table';

export type TransactionStatus =
  | 'Menunggu Persetujuan'
  | 'Dibatalkan'
  | 'Menunggu Diambil'
  | 'Dipinjam'
  | 'Dikembalikan'
  | 'Terlambat'
  | 'Tidak Mengembalikan';

export interface Transaction {
  id: string;
  kdTransaksi: string;
  bukuId?: string;
  pustakawanId?: string;
  anggotaId?: string;
  tglPinjam: string;
  tglKembali: string;
  status: TransactionStatus;
  namaAnggota?: string;
  namaPustakawan?: string;
  judulBuku?: string;
  createdAt: string;
}

export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: Transaction[];
  meta: PaginationMeta;
}

export interface TransactionDetailResponse {
  success: boolean;
  message: string;
  data: Transaction;
}
