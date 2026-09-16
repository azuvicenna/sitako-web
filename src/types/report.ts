export interface CirculationReportItem {
  kdTransaksi: string;
  namaPeminjam: string;
  judulBuku: string;
  tglPinjam: string;
  tglKembali: string;
  status: string;
}

export interface FineReportItem {
  namaPeminjam: string;
  judulBuku: string;
  totalDenda: number;
  metodePembayaran: string;
  paymentStatus: string;
  tglBayar: string;
}

export interface CirculationReportResponse {
  success: boolean;
  message: string;
  data: CirculationReportItem[];
}

export interface FineReportResponse {
  success: boolean;
  message: string;
  data: FineReportItem[];
}
