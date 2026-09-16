import type { PaginationMeta } from './table';

export interface DashboardSummaryResponse {
  success: boolean;
  message: string;
  buku: {
    fisik: number;
    digital: number;
  };
  anggotaAktif: number;
  bukuDipinjam: number;
  jatuhTempo: number;
}

export interface TodayTransactionItem {
  id: string;
  bukuId: string;
  pustakawanId: string;
  anggotaId: string;
  kdTransaksi: string;
  tglPinjam: string;
  tglKembali: string;
  status: string;
  createdAt: string;
  namaAnggota?: string;
  judulBuku?: string;
}

export interface TodayTransactionSummary {
  semua: number;
  menungguPersetujuan: number;
  dibatalkan: number;
  menungguDiambil: number;
  dipinjam: number;
  dikembalikan: number;
  terlambat: number;
  tidakMengembalikan: number;
}

export interface TodayTransactionResponse {
  success: boolean;
  message: string;
  data: TodayTransactionItem[];
  meta: PaginationMeta;
  summary: TodayTransactionSummary;
}

export interface WeeklyStatItem {
  tanggal: string;
  hari: string;
  total: number;
}

export interface WeeklyStatisticsResponse {
  success: boolean;
  message: string;
  statistik: WeeklyStatItem[];
  rataRata: number;
}
