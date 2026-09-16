import { createRouter, createWebHistory } from 'vue-router';
import type { UserRole } from '@/types/auth';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/composables/useAuth';

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
      ],
    },
    // Redirects for flat / legacy paths to maintain backward compatibility
    { path: '/rak', redirect: '/pustakawan/rak' },
    { path: '/buku', redirect: '/pustakawan/buku' },
    { path: '/denda', redirect: '/pustakawan/denda' },
    { path: '/peminjaman', redirect: '/pustakawan/peminjaman' },
    { path: '/pengembalian', redirect: '/pustakawan/pengembalian' },
    { path: '/laporan', redirect: '/pustakawan/laporan' },
  ],
});

router.beforeEach(async (to, _from, next) => {
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

  const matchedAuth = to.matched.find((record) => record.meta.requiresAuth);
  const requiresAuth = !!matchedAuth;
  const allowedRoles =
    (to.meta.roles as UserRole[] | undefined) ||
    (matchedAuth?.meta.roles as UserRole[] | undefined);

  if (!requiresAuth) {
    return next();
  }

  // Jika sudah terautentikasi dan memiliki role
  if (authStore.isAuthenticated && authStore.role) {
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(authStore.role)) {
      // Redirect ke dashboard yang sesuai dengan rolenya
      if (authStore.role === 'Pustakawan') {
        return next('/pustakawan/dashboard');
      } else {
        return next('/anggota/dashboard');
      }
    }
    return next();
  }

  // Jika belum terautentikasi
  if (to.name === 'login' || to.path === '/login') {
    return next();
  }

  if (router.hasRoute('login')) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  // Fallback pengembangan
  next();
});

export default router;
