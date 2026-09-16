import type { PaginationMeta } from './table';

export interface MemberFinePaymentItem {
  id: string;
  hargaDenda: number;
  totalDenda: number;
  tglBayar: string | null;
  metodePembayaran: string;
  createdAt: string;
  namaPustakawan: string | null;
  kdTransaksi: string;
  judulBuku: string;
}

export interface MemberFinePaymentListResponse {
  success: boolean;
  message: string;
  data: MemberFinePaymentItem[];
  meta: PaginationMeta;
}

export interface MemberFinePaymentDetail {
  id: string;
  hargaDenda: number;
  totalDenda: number;
  tglBayar: string | null;
  metodePembayaran: string;
  createdAt: string;
  namaPustakawan: string | null;
  kdTransaksi: string;
  judulBuku: string;
  tglPinjam: string;
  tglKembali: string;
  statusTransaksi: string;
}

export interface MemberFinePaymentDetailResponse {
  success: boolean;
  message: string;
  id: string;
  hargaDenda: number;
  totalDenda: number;
  tglBayar: string | null;
  metodePembayaran: string;
  createdAt: string;
  namaPustakawan: string | null;
  kdTransaksi: string;
  judulBuku: string;
  tglPinjam: string;
  tglKembali: string;
  statusTransaksi: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  id: string;
  anggotaId: string;
  transaksiId: string;
  hargaDenda: number;
  totalDenda: number;
  metodePembayaran: string;
  paymentStatus: string;
  tripayReference?: string;
  paymentMethodCode: string;
  checkoutUrl: string;
  createdAt: string;
}
