import type { PaginationMeta } from '@/types/table';

export interface FineRule {
  id: string;
  bukuId: string;
  judulBuku?: string;
  jenisDenda: 'Terlambat' | 'Hilang';
  hargaDenda: number;
  metodePerhitungan: 'Akumulasi' | 'Flat';
  createdAt: string;
}

export interface FinePayment {
  id: string;
  pustakawanId?: string;
  anggotaId?: string;
  transaksiId?: string;
  hargaDenda: number;
  totalDenda: number;
  tglBayar?: string;
  metodePembayaran: 'Tunai' | 'Non-Tunai';
  paymentStatus?: 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED';
  namaPustakawan?: string;
  namaAnggota?: string;
  kdTransaksi?: string;
  judulBuku?: string;
  createdAt: string;
}

export interface FineRuleListResponse {
  success: boolean;
  message: string;
  data: FineRule[];
  meta: PaginationMeta;
}

export interface FinePaymentListResponse {
  success: boolean;
  message: string;
  data: FinePayment[];
  meta: PaginationMeta;
}
