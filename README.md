# SITAKO Web

## Deskripsi Proyek

SITAKO (Sistem Informasi Perpustakaan Sekolah) Web adalah aplikasi antarmuka pengguna berbasis web (*Single Page Application* - SPA) untuk sistem manajemen perpustakaan sekolah. Proyek ini dibangun menggunakan Vue 3, TypeScript, dan Tailwind CSS v4, serta dirancang untuk memberikan pengalaman pengguna yang cepat, intuitif, dan responsif bagi staf perpustakaan maupun anggota (siswa dan guru).

Aplikasi ini terhubung secara langsung dengan [SITAKO Server](https://github.com/azuvicenna/sitako-server) melalui RESTful API dan mendukung sistem otentikasi berbasis peran (*Role-Based Access Control* - RBAC) dengan dua portal utama:

1. **Portal Pustakawan**:
   - **Dashboard Analitik**: Ringkasan statistik operasional harian (peminjaman aktif, buku terlambat, denda tertunda, dan statistik buku terpopuler).
   - **Manajemen Katalog & Buku**: Pencatatan data buku, penomoran ISBN, pengelolaan stok, lokasi rak, serta unggah cover buku dengan kompresi otomatis.
   - **Manajemen Rak**: Pengelompokan dan pengorganisasian lokasi fisik buku di perpustakaan.
   - **Sirkulasi Peminjaman & Pengembalian**: Pencatatan transaksi peminjaman buku, verifikasi pengembalian, dan penghitungan denda otomatis jika melewati batas waktu.
   - **Pengelolaan Denda**: Aturan tarif denda harian, pemantauan tagihan, dan konfirmasi pelunasan denda.
   - **Manajemen Pengguna**: Pengelolaan data anggota perpustakaan (NIS) dan staf pustakawan (NIP).
   - **Laporan & Rekapitulasi**: Pembuatan laporan sirkulasi dan denda dengan dukungan cetak dan ekspor dokumen.

2. **Portal Anggota (Siswa & Guru)**:
   - **Dashboard Anggota**: Pemantauan status peminjaman buku aktif, pengingat tanggal jatuh tempo, dan informasi tagihan denda.
   - **Katalog & Pencarian Buku**: Eksplorasi koleksi buku digital dan fisik dengan fitur pencarian dan filter kategori.
   - **Daftar Tersimpan (Bookmark)**: Fitur penandaan buku favorit untuk memudahkan peminjaman berikutnya.
   - **Riwayat Sirkulasi**: Rekam jejak peminjaman dan pengembalian buku yang pernah dilakukan.
   - **Riwayat & Pembayaran Denda**: Tinjauan rincian denda keterlambatan serta alur pembayaran digital melalui integrasi Payment Gateway Tripay.
   - **Profil Pengguna**: Pengaturan profil pribadi dan pembaruan kata sandi akun.

---

## Teknologi Utama

Berikut adalah teknologi inti yang digunakan pada proyek frontend ini beserta fungsinya:

- **Vue 3 & TypeScript**: Framework JavaScript progresif berbasis Composition API (`<script setup>`) dan TypeScript yang menjamin penulisan kode terstruktur, modular, dan type-safe.
- **Vite**: Build tool dan development server generasi terbaru dengan *Instant Hot Module Replacement* (HMR) serta optimasi bundling produksi menggunakan minifikasi Terser.
- **Tailwind CSS v4**: Framework styling *utility-first* versi terbaru yang diintegrasikan langsung melalui `@tailwindcss/vite` untuk membangun desain antarmuka modern yang konsisten dan responsif.
- **Pinia**: Library manajemen state resmi Vue yang ringan, modular, dan type-safe untuk mengelola sesi otentikasi serta state global aplikasi.
- **Vue Router**: Client-side router resmi Vue 3 dengan dukungan nested routes, dynamic redirection, role-based navigation guards (RBAC), dan transisi indikator loading (NProgress).
- **TanStack Vue Query**: Library penanganan *server state*, otomatisasi caching, sinkronisasi data API secara real-time, serta eliminasi over-fetching data.
- **VeeValidate & Zod**: Solusi manajemen formulir reaktif yang dipadukan dengan validasi skema tipe data Zod yang ketat dan deklaratif.
- **Axios**: HTTP client berbasis Promise dengan konfigurasi otomatis kredensial sesi cookie (JWT) dan mekanisme penanganan error terpusat.
- **Vitest & Vue Test Utils**: Framework pengujian unit berkecepatan tinggi yang terintegrasi dengan ekosistem Vite untuk pengujian modul fungsi utils, stores, composables, guards, dan komponen UI.
- **Cypress**: Framework *End-to-End* (E2E) testing untuk simulasi pengujian otomatis alur interaksi pengguna nyata di browser.
- **Oxlint & ESLint & Prettier**: Toolchain kualitas kode modern yang menggabungkan linter berbasis Rust super cepat (Oxlint), ESLint dengan aturan Vue/TypeScript, serta Prettier untuk pemformatan kode otomatis.
- **Docker & Nginx**: Multi-stage Docker container yang mengkompilasi aset Vue 3 dan menyajikannya lewat Nginx 1.27 Alpine berkinerja tinggi dengan kompresi Gzip, caching aset statis, dan fallback routing SPA.
- **Kubernetes (Minikube & K3s)**: Konfigurasi orkestrasi container menggunakan Kubernetes Deployment, Service (ClusterIP), dan Ingress terpadu (NGINX Ingress di Minikube atau Traefik di K3s) berdampingan dengan SITAKO Server.
- **Progressive Web App (PWA) & Workbox**: Dukungan instalasi langsung (*installable*) di perangkat seluler dan desktop, Service Worker otomatis (`sw.js`), precaching aset statis dengan Workbox, dan pembaruan aplikasi instan (*auto-update*).

---

## Daftar Library Dependencies

Berikut adalah rincian fungsi dari masing-masing dependencies utama yang terdaftar di `package.json`:

- **`@heroicons/vue`**: Kumpulan ikon SVG resmi dari Heroicons untuk mempercantik elemen antarmuka pengguna.
- **`@tanstack/vue-query`**: Manajemen status data server (server-state), caching otomatis, re-fetching saat window focus, dan mutasi data API.
- **`@vee-validate/zod`**: Adapter jembatan untuk menghubungkan validasi skema Zod ke dalam sistem penanganan form VeeValidate.
- **`@vueuse/core`**: Koleksi utilitas reaktif Composition API untuk memudahkan interaksi DOM, viewport, local storage, dan event browser.
- **`axios`**: Client HTTP untuk pengiriman request API ke backend dengan dukungan kredensial cookie sesi dan interceptor.
- **`browser-image-compression`**: Utilitas untuk mengompresi ukuran gambar (seperti cover buku atau foto profil) di sisi browser sebelum diunggah ke server.
- **`dayjs`**: Library manipulasi dan pemformatan tanggal/waktu yang ringan untuk kalkulasi tenggat waktu pengembalian buku dan riwayat transaksi.
- **`nprogress`**: Indikator progress bar ramping di bagian atas layar saat navigasi antar rute router sedang berlangsung.
- **`pinia`**: Penyimpanan state aplikasi global yang reaktif untuk menyimpan status login dan data identitas pengguna yang sedang aktif.
- **`vee-validate`**: Library penanganan form reaktif, pelacakan state validitas input (*dirty*, *touched*, *errors*), dan alur submission form.
- **`vite-plugin-pwa`**: Plugin Vite untuk mengaktifkan kapabilitas Progressive Web App (PWA), pembuatan Service Worker otomatis (`sw.js`), injeksi Web App Manifest (`manifest.webmanifest`), konfigurasi ikon maskable, dan precaching aset statis Workbox.
- **`vue`**: Framework antarmuka pengguna utama berbasis reaktif dan modular.
- **`vue-router`**: Router resmi untuk navigasi halaman SPA, nested view layout, dan proteksi rute berbasis izin akses.
- **`zod`**: Deklarasi dan validasi skema data berbasis TypeScript untuk memastikan setiap input form memenuhi format yang valid.

---

## Perintah Terminal & Cara Menjalankan

### Persiapan Awal

Langkah pertama sebelum menjalankan aplikasi secara lokal:

1. Salin template file environment:
   ```bash
   cp .env.example .env
   ```
2. Sesuaikan nilai di dalam `.env`:
   ```env
   VITE_API_BASE_URL=/api
   ```
   > **Catatan:** Pada mode pengembangan lokal, Vite Development Server telah dikonfigurasi untuk meneruskan (*reverse proxy*) setiap request dengan prefix `/api` langsung ke backend di `http://localhost:8080`.

3. Pasang semua dependencies:
   ```bash
   npm install
   ```

---

### Mode Development

Gunakan perintah berikut untuk pengembangan lokal:

- Menjalankan development server lokal (dengan Hot Module Replacement / HMR):
  ```bash
  npm run dev
  ```
  Aplikasi web dapat diakses melalui peramban di: **`http://localhost:5173`**.

> **Kredensial Akun Pengujian Default:**
> - **Pustakawan (Hasil Seeder Backend):** NIP `198001012005011001` | Password: `admin123`
> - **Pustakawan (Mock Fixture Cypress):** NIP `198501012010012001` | Password: `password123`
> - **Anggota (Mock Fixture Cypress):** NIS `20251001` | Password: `password123`

---

### Type Checking, Linting, & Code Formatting

Gunakan perintah berikut untuk memeriksa kesehatan dan kerapian kode sumber:

- **Type Checking (TypeScript & SFC Vue):**
  ```bash
  npm run type-check
  ```
  Menjalankan `vue-tsc` untuk mendeteksi potensi kesalahan pengetikan tipe data pada berkas TypeScript maupun komponen `.vue`.

- **Linting Kode:**
  ```bash
  npm run lint
  ```
  Menjalankan rangkaian linting menyeluruh menggunakan Oxlint dan ESLint secara berurutan dengan opsi auto-fix:
  - `npm run lint:oxlint` : Menjalankan Oxlint (linter berbasis Rust berkecepatan tinggi).
  - `npm run lint:eslint` : Menjalankan ESLint khusus aturan Vue 3 dan TypeScript.

- **Formatting Kode (Prettier):**
  ```bash
  npm run format
  ```
  Memformat seluruh berkas `.vue`, `.ts`, `.js`, `.json`, dan `.css` di dalam folder `src/`.
  - `npm run format:check` : Memeriksa kesesuaian format kode tanpa mengubah berkas.

---

### Kompilasi & Build Production

Gunakan perintah berikut untuk mempersiapkan aplikasi ke tahap rilis/produksi:

- **Build Lengkap (Type-Check + Kompilasi):**
  ```bash
  npm run build
  ```
  Menjalankan validasi tipe data (`type-check`) terlebih dahulu, kemudian melakukan kompilasi dan minifikasi aset ke direktori `dist/`.

- **Build Cepat (Hanya Kompilasi):**
  ```bash
  npm run build-only
  ```

- **Preview Hasil Build:**
  ```bash
  npm run preview
  ```
  Menjalankan server statis lokal untuk menguji hasil build produksi pada port `4173`.

---

### Dukungan Progressive Web App (PWA)

Aplikasi ini telah mendukung standar modern **Progressive Web App (PWA)** menggunakan `@vite-plugin-pwa` dan Workbox:

- **Instalasi Mandiri (*Installable*)**: Pengguna dapat memasang aplikasi langsung ke layar utama (*Add to Home Screen*) pada perangkat mobile (Android/iOS) maupun desktop (Chrome, Edge, Brave) sebagai aplikasi mandiri (*standalone window*).
- **Service Worker Pre-caching**: Seluruh aset statis inti (HTML, CSS, JS, font Poppins, dan icon) di-cache secara otomatis oleh Service Worker (`sw.js`) untuk mempercepat waktu pemuatan halaman.
- **Auto-Update**: Dikonfigurasi dengan `registerType: 'autoUpdate'` sehingga klien otomatis menyinkronkan aset terbaru saat rilis baru diterapkan.
- **Pengecualian API**: Rute request backend (`/api/*`) dikecualikan dari Service Worker cache agar seluruh transaksi sirkulasi dan autentikasi selalu terhubung *live* secara real-time.
- **Aset & Identitas PWA**:
  - Web App Manifest: `dist/manifest.webmanifest`
  - Ikon Aplikasi: `pwa-192x192.png`, `pwa-512x512.png` (maskable), dan `apple-touch-icon.png` (180x180)
  - Favicon Multi-format: `favicon.ico` dan `favicon.svg`
  - Theme Color: `#eab308` (Mustard gold)

---

### Automated Testing

#### 1. Unit Testing (Vitest & Vue Test Utils)
Rangkaian unit test mencakup pengujian modul utilitas, skema validasi Zod, Pinia store, composable hooks, navigasi guard router, layout, dan komponen antarmuka bersama:

- Menjalankan unit tests dalam mode interaktif:
  ```bash
  npm run test:unit
  ```

Cakupan modul pengujian unit (`src/__tests__/`):
- `1-utils` : Pengujian helper Axios, format mata uang (Rupiah), manipulasi tanggal, dan kompresi gambar.
- `2-validations` : Pengujian skema validasi formulir login, pustakawan, dan anggota.
- `3-stores` : Pengujian state management otentikasi Pinia.
- `4-composables` : Pengujian hook fungsional (`useAuth`, `useToast`).
- `5-router` : Pengujian route guards, proteksi hak akses peran, dan redirection rute.
- `6-layouts` : Pengujian integritas tata letak `MainLayout`.
- `7-components` : Pengujian fungsionalitas komponen UI atomik (Card, Modal, Alert, FormField, dll).

#### 2. End-to-End Testing (Cypress)
Pengujian E2E mensimulasikan skenario penggunaan langsung di browser:

- Menyiapkan binary Cypress (dijalankan otomatis setelah instalasi):
  ```bash
  npm run prepare
  ```

- Menjalankan E2E testing secara *headless* pada hasil build produksi:
  ```bash
  npm run test:e2e
  ```
  *(Perintah ini otomatis menjalankan server preview di port 4173 dan mengeksekusi Cypress CLI)*.

- Membuka antarmuka interaktif Cypress GUI pada mode dev server:
  ```bash
  npm run test:e2e:dev
  ```

Skenario E2E yang tersedia (`cypress/e2e/`):
- `01-auth-and-errors.cy.ts` : Alur otentikasi login, validasi CAPTCHA, proteksi rute, dan tampilan halaman error (404, 403, 500).
- `02-librarian-views.cy.ts` : Pengujian seluruh fitur portal pustakawan (dashboard, kelola rak, katalog buku, denda, transaksi peminjaman/pengembalian, dan laporan).
- `03-member-views.cy.ts` : Pengujian portal anggota (dashboard siswa, katalog & pencarian buku, bookmark koleksi, riwayat pinjam, dan tagihan denda).
- `04-profile-view.cy.ts` : Pengujian pembaruan profil pengguna dan mekanisme perubahan password.

---

### Menggunakan Docker

Proyek ini menyediakan konfigurasi multi-stage build container menggunakan Docker dan web server Nginx:

- **Stage 1 (Builder)**: Mengunduh dependencies dan mengompilasi kode sumber Vue 3 ke folder `dist/` menggunakan Node.js 22 Alpine.
- **Stage 2 (Production)**: Menyajikan aset statis dari `dist/` menggunakan Nginx 1.27 Alpine yang dikonfigurasi dengan:
  - Kompresi Gzip untuk mempercepat pengiriman file.
  - Penambahan security headers dasar (`X-Frame-Options`, `X-XSS-Protection`, `nosniff`, `Referrer-Policy`).
  - Fallback routing SPA ke `index.html` untuk mendukung HTML5 History Mode.
  - Endpoint pemeriksaan kesehatan sistem di `/health`.
  - Caching aset statis (CSS, JS, gambar, font) selama 1 tahun (*immutable*).

#### Menjalankan Container dengan Docker Compose:

1. Jalankan container di background:
   ```bash
   docker compose up -d
   ```
2. Melihat log dari container web:
   ```bash
   docker compose logs -f web
   ```
3. Menghentikan container:
   ```bash
   docker compose down
   ```

Aplikasi web dapat diakses di: **`http://localhost:3000`** *(atau sesuai port yang didefinisikan di `.env`)*.  
Endpoint pemeriksaan kesehatan container: **`http://localhost:3000/health`**.

---

### Deployment ke Kubernetes (Minikube & K3s)

Folder `k8s/` menyediakan manifest Kubernetes untuk menjalankan frontend berdampingan dengan backend SITAKO dalam satu cluster:
- `k8s/01-web.yaml` : Deployment dan Service (ClusterIP port 80) untuk frontend `sitako-web`.
- `k8s/02-ingress.yaml` : Unified Ingress controller (Path `/` ke frontend, `/api` ke backend). *Default aktif saat ini: K3s (Traefik). Tersedia opsi Minikube (NGINX Ingress).*

---

#### 1. Panduan Deployment ke Minikube (Lokal di Laptop)

> **Catatan Beralih ke Minikube:** Jika ingin menjalankan di Minikube, ubah terlebih dahulu:
> 1. Di `k8s/02-ingress.yaml`: Komentari `ingressClassName: traefik` & anotasi Traefik, lalu uncomment `ingressClassName: nginx`.
> 2. Di backend (`sitako/k8s/`): Ubah `storageClassName` di `01-postgres.yaml` dan `02-redis.yaml` menjadi `standard`.

Gunakan perintah-perintah berikut untuk menjalankan seluruh stack di laptop via Minikube:

##### A. Jalankan Minikube & Aktifkan Addon Ingress
```powershell
# Jalankan cluster Minikube (disarankan 2 CPU & 4GB RAM)
minikube start --cpus 2 --memory 4096

# Aktifkan addon NGINX Ingress Controller bawaan Minikube
minikube addons enable ingress
```

##### B. Build & Load Docker Image ke Minikube
```powershell
# 1. Build dan load image backend (dari direktori sitako)
docker build -t sitako-server:latest .
minikube image load sitako-server:latest

# 2. Build dan load image frontend (dari direktori sitako-web)
docker build -t sitako-web:latest .
minikube image load sitako-web:latest
```

##### C. Terapkan Manifest Kubernetes
```powershell
# 1. Terapkan backend (namespace, config, database, redis, app)
kubectl apply -f k8s/00-namespace-and-config.yaml
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-redis.yaml
kubectl apply -f k8s/03-app.yaml

# 2. Terapkan frontend & Ingress terpadu
kubectl apply -f k8s/01-web.yaml
kubectl apply -f k8s/02-ingress.yaml
```

##### D. Periksa Status Pod, Service, & Ingress
```powershell
kubectl get pods -n sitako
kubectl get svc -n sitako
kubectl get ingress -n sitako
```

##### E. Akses Aplikasi di Browser (Khusus Windows)
Buka satu terminal PowerShell baru dengan hak administrator dan biarkan tetap berjalan:
```powershell
minikube tunnel
```
Setelah tunnel aktif, buka browser Anda di:
- **`http://localhost/`** $\rightarrow$ Frontend SITAKO Web
- **`http://localhost/api`** $\rightarrow$ Backend API SITAKO

---

#### 2. Panduan Deployment ke K3s (VM / Multipass / Server)

*Catatan: Konfigurasi manifest saat ini sudah diset aktif untuk K3s secara default.*

1. **Build Docker Image & Ekspor ke File `.tar`:**
   ```bash
   docker build -t sitako-web:latest .
   docker save sitako-web:latest -o sitako-web.tar
   ```
3. **Transfer & Import ke K3s Containerd (Multipass VM):**
   ```bash
   multipass transfer sitako-web.tar sitako-vm:/home/ubuntu/sitako-web.tar
   multipass exec sitako-vm -- sudo k3s ctr -n k8s.io images import /home/ubuntu/sitako-web.tar
   multipass exec sitako-vm -- rm /home/ubuntu/sitako-web.tar
   ```
4. **Terapkan Manifest & Akses:**
   ```bash
   kubectl apply -f k8s/01-web.yaml
   kubectl apply -f k8s/02-ingress.yaml
   ```
   Buka `http://<IP-VM>/` di browser.
