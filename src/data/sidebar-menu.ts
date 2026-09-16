import {
  Squares2X2Icon,
  ArchiveBoxIcon,
  BookOpenIcon,
  BanknotesIcon,
  UsersIcon,
  UserGroupIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  DocumentTextIcon,
  BookmarkIcon,
} from '@heroicons/vue/24/outline';
import type { SidebarMenuGroup } from '@/types/navigation';

export const sidebarMenuGroups: SidebarMenuGroup[] = [
  // --- ROLE PUSTAKAWAN ---
  {
    title: 'Ringkasan',
    roles: ['Pustakawan'],
    items: [
      {
        title: 'Dashboard Pustakawan',
        path: '/pustakawan/dashboard',
        icon: Squares2X2Icon,
        roles: ['Pustakawan'],
      },
    ],
  },
  {
    title: 'Master Data',
    roles: ['Pustakawan'],
    items: [
      {
        title: 'Kelola Rak Buku',
        path: '/pustakawan/rak',
        icon: ArchiveBoxIcon,
        roles: ['Pustakawan'],
      },
      {
        title: 'Kelola Buku Perpustakaan',
        path: '/pustakawan/buku',
        icon: BookOpenIcon,
        roles: ['Pustakawan'],
      },
      {
        title: 'Kelola Denda Buku',
        path: '/pustakawan/denda',
        icon: BanknotesIcon,
        roles: ['Pustakawan'],
      },
      {
        title: 'Daftar Anggota',
        path: '/pustakawan/anggota',
        icon: UsersIcon,
        roles: ['Pustakawan'],
      },
      {
        title: 'Daftar Pustakawan',
        path: '/pustakawan/pustakawan',
        icon: UserGroupIcon,
        roles: ['Pustakawan'],
      },
    ],
  },
  {
    title: 'Layanan Sirkulasi',
    roles: ['Pustakawan'],
    items: [
      {
        title: 'Daftar Peminjaman',
        path: '/pustakawan/peminjaman',
        icon: ArrowUpCircleIcon,
        roles: ['Pustakawan'],
      },
      {
        title: 'Daftar Pengembalian',
        path: '/pustakawan/pengembalian',
        icon: ArrowDownCircleIcon,
        roles: ['Pustakawan'],
      },
    ],
  },
  {
    title: 'Cetak Laporan',
    roles: ['Pustakawan'],
    items: [
      {
        title: 'Buat Laporan',
        path: '/pustakawan/laporan',
        icon: DocumentTextIcon,
        roles: ['Pustakawan'],
      },
    ],
  },

  // --- ROLE ANGGOTA ---
  {
    title: 'Ringkasan',
    roles: ['Anggota'],
    items: [
      {
        title: 'Dashboard Anggota',
        path: '/anggota/dashboard',
        icon: Squares2X2Icon,
        roles: ['Anggota'],
      },
    ],
  },
  {
    title: 'Katalog & Koleksi',
    roles: ['Anggota'],
    items: [
      {
        title: 'Katalog Buku',
        path: '/anggota/katalog',
        icon: BookOpenIcon,
        roles: ['Anggota'],
      },
      {
        title: 'Buku Tersimpan',
        path: '/anggota/bookmark',
        icon: BookmarkIcon,
        roles: ['Anggota'],
      },
    ],
  },
  {
    title: 'Layanan Sirkulasi',
    roles: ['Anggota'],
    items: [
      {
        title: 'Peminjaman Saya',
        path: '/anggota/peminjaman',
        icon: ArrowUpCircleIcon,
        roles: ['Anggota'],
      },
      {
        title: 'Riwayat & Denda',
        path: '/anggota/denda',
        icon: BanknotesIcon,
        roles: ['Anggota'],
      },
    ],
  },
];
