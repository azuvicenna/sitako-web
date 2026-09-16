import type { PaginationMeta } from './table';

export interface MemberTransactionItem {
  id: string;
  kdTransaksi: string;
  tglPinjam: string;
  tglKembali: string;
  status: string;
  namaAnggota: string;
  namaPustakawan: string;
  judulBuku: string;
  bukuId?: string;
  pustakawanId?: string;
}

export interface MemberTransactionListResponse {
  success: boolean;
  message: string;
  data: MemberTransactionItem[];
  meta: PaginationMeta;
}

export interface MemberTransactionDetail {
  id: string;
  kdTransaksi: string;
  tglPinjam: string;
  tglKembali: string;
  status: string;
  namaAnggota: string;
  emailAnggota?: string;
  namaPustakawan: string;
  judulBuku: string;
  bukuId: string;
  pustakawanId: string;
  anggotaId: string;
}

export interface MemberTransactionDetailResponse {
  success: boolean;
  message: string;
  id: string;
  kdTransaksi: string;
  tglPinjam: string;
  tglKembali: string;
  status: string;
  namaAnggota: string;
  namaPustakawan: string;
  judulBuku: string;
  bukuId: string;
  pustakawanId: string;
  anggotaId: string;
}

export interface ReturnFineDetails {
  jenisDenda: string;
  hargaDenda: number;
  metodePerhitungan: string;
  hariTerlambat: number;
  totalDenda: number;
}

export interface ReturnTransactionResponse {
  success: boolean;
  message: string;
  status: string;
  isTerlambat: boolean;
  isBukuHilang: boolean;
  denda: ReturnFineDetails | null;
  pesan: string;
}
