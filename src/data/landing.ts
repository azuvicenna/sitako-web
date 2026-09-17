export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface HeroData {
  badge: string;
  title: string;
  description: string;
  ctaText: string;
  bgImage: string;
}

export interface AboutValue {
  title: string;
  description: string;
}

export interface AboutData {
  badge: string;
  title: string;
  description: string;
  image: string;
  vision: AboutValue;
  mission: AboutValue;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
}

export interface FacilityItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  isSpecialCard?: boolean;
}

export interface GuideStep {
  step: number;
  title: string;
  description: string;
}

export interface DownloadSectionData {
  title: string;
  description: string;
  image: string;
  appStoreText: string;
  playStoreText: string;
}

export interface ScheduleItem {
  day: string;
  time: string;
}

export interface ContactData {
  badge: string;
  title: string;
  description: string;
  location: {
    title: string;
    building: string;
    address: string;
  };
  operationalHours: {
    title: string;
    schedules: ScheduleItem[];
  };
  helpdesk: {
    title: string;
    phone: string;
    email: string;
  };
  mapEmbedUrl: string;
  ctaText: string;
}

export interface FooterLink {
  label: string;
  href: string;
  isInternalRoute?: boolean;
}

export interface FooterData {
  brandName: string;
  brandDescription: string;
  quickLinks: FooterLink[];
  academicInfo: FooterLink[];
  copyrightText: string;
  tagline: string;
}

export const navLinks: NavLink[] = [
  { id: 'beranda', label: 'Beranda', href: '#beranda' },
  { id: 'tentang', label: 'Tentang', href: '#tentang' },
  { id: 'layanan', label: 'Layanan', href: '#layanan' },
  { id: 'fasilitas', label: 'Fasilitas', href: '#fasilitas' },
  { id: 'panduan', label: 'Panduan', href: '#panduan' },
  { id: 'kontak', label: 'Kontak', href: '#kontak' },
];

export const heroData: HeroData = {
  badge: 'Sistem Informasi Perpustakaan Sekolah',
  title: 'Pusat Pengetahuan & Literasi Siswa',
  description:
    'Mendukung proses belajar mengajar di sekolah dengan menyediakan akses ke literatur terbaik untuk seluruh siswa dan tenaga pendidik.',
  ctaText: 'Login ke SITAKO',
  bgImage:
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop',
};

export const aboutData: AboutData = {
  badge: 'Profil Perpustakaan Sekolah',
  title: 'Jantung Edukasi Generasi Berprestasi',
  description:
    'SITAKO hadir terintegrasi dengan ekosistem sekolah untuk memudahkan siswa dan guru dalam mengakses bahan ajar, literatur pendukung, serta menciptakan ruang belajar kolaboratif yang inspiratif.',
  image:
    'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=2030&auto=format&fit=crop',
  vision: {
    title: 'Visi Edukasi',
    description:
      'Menjadi pusat sumber belajar terpadu yang membudayakan literasi dan menunjang tercapainya prestasi akademik siswa secara optimal.',
  },
  mission: {
    title: 'Misi Pelayanan',
    description:
      'Menyediakan koleksi buku cetak maupun e-book yang relevan dengan kurikulum, serta menciptakan lingkungan belajar sekolah yang interaktif.',
  },
};

export const servicesData: {
  badge: string;
  title: string;
  items: ServiceItem[];
} = {
  badge: 'Layanan Akademik',
  title: 'Fasilitas Penunjang Pembelajaran',
  items: [
    {
      id: 'paket',
      title: 'Peminjaman Buku Paket',
      description:
        'Siswa dapat meminjam buku paket kurikulum dan pengayaan untuk menunjang tugas harian dengan menggunakan sistem sirkulasi digital SITAKO.',
    },
    {
      id: 'repositori',
      title: 'Akses Repositori Sekolah',
      description:
        'Akses modul pembelajaran elektronik, kumpulan soal, dan karya tulis siswa terbaik melalui platform terpusat kami.',
    },
    {
      id: 'konsultasi',
      title: 'Konsultasi Referensi',
      description:
        'Guru pustakawan sekolah siap membantu para siswa dalam menemukan literatur yang tepat untuk kelengkapan tugas harian.',
    },
  ],
};

export const facilitiesData: {
  badge: string;
  title: string;
  description: string;
  items: FacilityItem[];
} = {
  badge: 'Lingkungan Belajar',
  title: 'Fasilitas Ruang',
  description:
    'Didukung dengan tata letak yang dirancang khusus untuk kenyamanan siswa saat belajar di sekolah.',
  items: [
    {
      id: 'hening',
      title: 'Area Baca Hening',
      description:
        'Ruang tenang yang didedikasikan agar siswa bisa fokus belajar di sela istirahat.',
      image:
        'https://images.unsplash.com/photo-1549675584-91f19337af3d?q=80&w=2072&auto=format&fit=crop',
    },
    {
      id: 'diskusi',
      title: 'Ruang Diskusi',
      description:
        'Area khusus bagi siswa yang mengerjakan proyek atau tugas kelompok bersama.',
      image:
        'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop',
    },
    {
      id: 'komputer',
      title: 'Akses PC Interaktif',
      description:
        'Fasilitas pencarian buku dan akses e-learning yang terintegrasi di perpus.',
      image:
        'https://images.unsplash.com/photo-1531297172864-459c7accc8e6?q=80&w=2070&auto=format&fit=crop',
    },
    {
      id: 'wifi',
      title: 'Wi-Fi Edukasi',
      description:
        'Koneksi internet sekolah yang difilter dengan aman untuk mendukung aktivitas pencarian informasi siswa.',
      isSpecialCard: true,
    },
  ],
};

export const guideData: {
  title: string;
  description: string;
  steps: GuideStep[];
} = {
  title: 'Alur Peminjaman Buku',
  description:
    'Proses peminjaman buku kini sepenuhnya digital untuk seluruh siswa terdaftar.',
  steps: [
    {
      step: 1,
      title: '1. Minta Akun',
      description:
        'Datang ke meja pustakawan untuk mendaftarkan data siswa agar dibuatkan akses akun SITAKO.',
    },
    {
      step: 2,
      title: '2. Login Aplikasi',
      description:
        'Masuk ke sistem menggunakan Nomor Induk Siswa (NIS) dan password yang telah didaftarkan.',
    },
    {
      step: 3,
      title: '3. Pinjam Buku',
      description:
        'Cari judul buku yang diinginkan melalui aplikasi lalu ajukan peminjaman secara digital.',
    },
    {
      step: 4,
      title: '4. Ambil Buku',
      description:
        'Tunggu notifikasi disetujui, dan silakan bawa fisik buku dari perpustakaan sekolah.',
    },
  ],
};

export const downloadData: DownloadSectionData = {
  title: 'Akses SITAKO dalam Genggaman',
  description:
    'Kini SITAKO hadir dalam versi mobile khusus untuk siswa. Proses pencarian buku, notifikasi peminjaman, dan riwayat membaca jadi lebih praktis lewat smartphone Anda.',
  image:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2070&auto=format&fit=crop',
  appStoreText: 'App Store',
  playStoreText: 'Google Play',
};

export const contactData: ContactData = {
  badge: 'Kontak Sekolah',
  title: 'Pusat Layanan Perpustakaan',
  description:
    'Jika siswa mengalami kendala akses sistem atau lupa password NIS, silakan menghubungi petugas kami pada jam kerja sekolah.',
  location: {
    title: 'Lokasi Ruang',
    building: 'Gedung B, Lantai 1, SMA Negeri Nusantara',
    address: 'Jl. Pendidikan No. 45, Kota Pelajar 12345',
  },
  operationalHours: {
    title: 'Jam Operasional',
    schedules: [
      { day: 'Senin - Kamis', time: '07:00 - 15:30 WIB' },
      { day: 'Jumat', time: '07:00 - 11:30 WIB' },
    ],
  },
  helpdesk: {
    title: 'Bantuan IT / Akun',
    phone: '+62 21 5555 1234',
    email: 'perpus@smanusantara.sch.id',
  },
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126907.01454157147!2d106.74567220551061!3d-6.229413284534725!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e34b9d%3A0x100c5e82dd4b820!2sJakarta%20Selatan%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid',
  ctaText: 'Login ke Akun Anda Sekarang',
};

export const footerData: FooterData = {
  brandName: 'SITAKO',
  brandDescription:
    'Sistem Informasi Perpustakaan Sekolah. Platform digital yang mempermudah sirkulasi dan pencarian literatur untuk kemajuan pendidikan siswa-siswi.',
  quickLinks: [
    { label: 'Halaman Utama', href: '#beranda' },
    { label: 'Profil Perpustakaan', href: '#tentang' },
    { label: 'Layanan Siswa', href: '#layanan' },
    { label: 'Portal Login', href: '/login', isInternalRoute: true },
  ],
  academicInfo: [
    { label: 'Tata Tertib Perpustakaan', href: '/login', isInternalRoute: true },
    { label: 'Prosedur Peminjaman', href: '#panduan' },
    { label: 'Bebas Pustaka Alumni', href: '/login', isInternalRoute: true },
  ],
  copyrightText: '© 2026 SITAKO - SMA Negeri Nusantara. Hak Cipta Dilindungi.',
  tagline: 'Membangun generasi cerdas berkarakter.',
};
