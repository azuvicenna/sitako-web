export interface MemberDashboardStatistics {
  bukuDipinjam: number;
  totalDenda: number;
  totalBookmark: number;
}

export interface MemberActiveTransaction {
  id: string;
  buku: {
    judul: string;
    cover: string;
  };
  tglKembali: string | null;
  status: string;
}

export interface MemberFineBill {
  id: string;
  totalDenda: number;
  checkoutUrl: string | null;
}

export interface MemberRecentBookmark {
  id: string;
  buku: {
    judul: string;
    penulis: string;
    cover: string;
  };
}

export interface MemberDashboardResponse {
  success: boolean;
  message: string;
  statistik: MemberDashboardStatistics;
  transaksiAktif: MemberActiveTransaction[];
  tagihanDenda: MemberFineBill[];
  bookmarkTerbaru: MemberRecentBookmark[];
}
