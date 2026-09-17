# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### [2026-09-18]

#### Added

- Menambahkan halaman landing page (`src/views/Index.vue`) berbasis TypeScript dan Tailwind CSS responsif
- Menambahkan modul data informasi landing page di `src/data/landing.ts` (layanan, fasilitas, panduan, jadwal operasional, kontak)
- Menambahkan rute `/` ke landing page dengan pengawal navigasi role-based redirect bagi pengguna yang sudah login
- Menambahkan unit test untuk pengalihan dan akses rute landing page pada pengunjung tamu / belum login

### [2026-09-17]

#### Added

- Menambahkan unit test dengan vitest
- Menambahkan e2e test dengan cypress
- Menambahkan halaman login, profile, dan error (404, 403, 500)
- Menambahkan dukungan PWA (Progressive Web Application) dan service worker caching
- Optimasi antarmuka responsif mobile drawer dan backdrop navigasi
- Pembaruan dokumentasi README.md sesuai standar arsitektur SITAKO

### [2026-09-16]

#### Added

- Menambahkan utils axios, date, currency (formatRupiah), dan image compression
- Menambahkan Pinia store auth dan composables useAuth tersinkronisasi backend
- Menambahkan skema validasi form (Zod) untuk modul auth, librarian, dan member
- Menambahkan konfigurasi server proxy Vite ke backend port 8080
- Menambahkan halaman untuk pustakawan
- Menambahkan halaman untuk anggota

### [2026-09-15]

#### Added

- Slicing common components
