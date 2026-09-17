import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress';
import type { UserRole } from '@/types/auth';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/composables/useAuth';

NProgress.configure({ showSpinner: false });

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: UserRole[];
    title?: string;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const authStore = useAuthStore();
        if (authStore.role === 'Anggota') return '/anggota/dashboard';
        return '/pustakawan/dashboard';
      },
    },
    {
      path: '/pustakawan',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: {
        requiresAuth: true,
        roles: ['Pustakawan'],
      },
      children: [
        {
          path: 'dashboard',
          name: 'librarianDashboard',
          component: () => import('@/views/librarian/Dashboard.vue'),
          meta: { title: 'Dashboard Pustakawan' },
        },
        {
          path: 'rak',
          name: 'librarianShelves',
          component: () => import('@/views/librarian/ShelfView.vue'),
          meta: { title: 'Kelola Rak Buku' },
        },
        {
          path: 'buku',
          name: 'librarianBooks',
          component: () => import('@/views/librarian/BookView.vue'),
          meta: { title: 'Kelola Buku Perpustakaan' },
        },
        {
          path: 'denda',
          name: 'librarianFines',
          component: () => import('@/views/librarian/FineView.vue'),
          meta: { title: 'Kelola Denda Buku' },
        },
        {
          path: 'anggota',
          name: 'librarianMembers',
          component: () => import('@/views/librarian/MemberView.vue'),
          meta: { title: 'Daftar Anggota' },
        },
        {
          path: 'pustakawan',
          name: 'librarianStaff',
          component: () => import('@/views/librarian/LibrarianView.vue'),
          meta: { title: 'Daftar Pustakawan' },
        },
        {
          path: 'peminjaman',
          name: 'librarianBorrowing',
          component: () => import('@/views/librarian/BorrowingView.vue'),
          meta: { title: 'Daftar Peminjaman' },
        },
        {
          path: 'pengembalian',
          name: 'librarianReturns',
          component: () => import('@/views/librarian/ReturningView.vue'),
          meta: { title: 'Daftar Pengembalian' },
        },
        {
          path: 'laporan',
          name: 'librarianReports',
          component: () => import('@/views/librarian/ReportView.vue'),
          meta: { title: 'Buat Laporan' },
        },
        {
          path: 'profil',
          name: 'librarianProfile',
          component: () => import('@/views/profile/ProfileView.vue'),
          meta: { title: 'Profil Pustakawan' },
        },
      ],
    },
    {
      path: '/anggota',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: {
        requiresAuth: true,
        roles: ['Anggota'],
      },
      children: [
        {
          path: 'dashboard',
          name: 'memberDashboard',
          component: () => import('@/views/member/MyDashboard.vue'),
          meta: { title: 'Dashboard Anggota' },
        },
        {
          path: 'katalog',
          name: 'memberCatalog',
          component: () => import('@/views/member/CatalogView.vue'),
          meta: { title: 'Katalog Buku' },
        },
        {
          path: 'bookmark',
          name: 'memberBookmarks',
          component: () => import('@/views/member/BookmarkView.vue'),
          meta: { title: 'Buku Tersimpan' },
        },
        {
          path: 'peminjaman',
          name: 'memberBorrowing',
          component: () => import('@/views/member/BorrowingView.vue'),
          meta: { title: 'Peminjaman Saya' },
        },
        {
          path: 'denda',
          name: 'memberFines',
          component: () => import('@/views/member/FineView.vue'),
          meta: { title: 'Riwayat & Tagihan Denda' },
        },
        {
          path: 'profil',
          name: 'memberProfile',
          component: () => import('@/views/profile/ProfileView.vue'),
          meta: { title: 'Profil Anggota' },
        },
      ],
    },
    {
      path: '/profil',
      redirect: () => {
        const authStore = useAuthStore();
        if (authStore.role === 'Anggota') return '/anggota/profil';
        return '/pustakawan/profil';
      },
    },
    // Rute Autentikasi
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { title: 'Masuk' },
    },
    // Rute Kesalahan (Error Pages)
    {
      path: '/404',
      name: 'error404',
      component: () => import('@/views/errors/NotFoundView.vue'),
      meta: { title: '404 - Halaman Tidak Ditemukan' },
    },
    {
      path: '/403',
      name: 'error403',
      component: () => import('@/views/errors/ForbiddenView.vue'),
      meta: { title: '403 - Akses Ditolak' },
    },
    {
      path: '/500',
      name: 'error500',
      component: () => import('@/views/errors/ServerErrorView.vue'),
      meta: { title: '500 - Kesalahan Server' },
    },
    // Redirects for flat / legacy paths to maintain backward compatibility
    { path: '/rak', redirect: '/pustakawan/rak' },
    { path: '/buku', redirect: '/pustakawan/buku' },
    { path: '/denda', redirect: '/pustakawan/denda' },
    { path: '/peminjaman', redirect: '/pustakawan/peminjaman' },
    { path: '/pengembalian', redirect: '/pustakawan/pengembalian' },
    { path: '/laporan', redirect: '/pustakawan/laporan' },
    // Catch-all route: arahkan URL yang tidak terdaftar ke 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
  ],
});

router.beforeEach(async (to) => {
  NProgress.start();

  // Atur judul dokumen jika tersedia di meta
  if (to.meta.title) {
    document.title = `${to.meta.title} | SITAKO`;
  }

  const authStore = useAuthStore();

  // Inisialisasi profil pengguna dari sesi cookie jika belum dilakukan
  if (!authStore.isInitialized) {
    try {
      const { fetchProfile } = useAuth();
      await fetchProfile();
    } catch {
      // Sesi belum ada atau API offline
    }
  }

  // Jika sudah login dan mencoba mengakses /login, arahkan ke dashboard
  if (to.name === 'login' || to.path === '/login') {
    if (authStore.isAuthenticated && authStore.role) {
      return authStore.role === 'Anggota' ? '/anggota/dashboard' : '/pustakawan/dashboard';
    }
    return;
  }

  const matchedAuth = to.matched.find((record) => record.meta.requiresAuth);
  const requiresAuth = !!matchedAuth;
  const allowedRoles =
    (to.meta.roles as UserRole[] | undefined) ||
    (matchedAuth?.meta.roles as UserRole[] | undefined);

  if (!requiresAuth) {
    return;
  }

  // Jika sudah terautentikasi dan memiliki role
  if (authStore.isAuthenticated && authStore.role) {
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(authStore.role)) {
      // Alihkan ke halaman 403 Akses Ditolak jika peran tidak diizinkan
      return '/403';
    }
    return;
  }

  // Jika belum terautentikasi dan rute memerlukan autentikasi
  return { name: 'login', query: { redirect: to.fullPath } };
});

router.afterEach(() => {
  NProgress.done();
});

router.onError(() => {
  NProgress.done();
});

export default router;
