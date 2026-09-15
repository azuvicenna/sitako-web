import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/pustakawan',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'librarianDashboard',
          component: () => import('@/views/librarian/Dashboard.vue'),
        },
      ],
    },
    {
      path: '/anggota',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: 'dashboard',
          name: 'memberDashboard',
          component: () => import('@/views/member/MyDashboard.vue'),
        },
      ],
    },
  ],
});

export default router;
