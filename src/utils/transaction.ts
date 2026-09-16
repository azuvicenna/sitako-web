import type { BadgeVariant } from '@/components/common/Badge.vue';

export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'Dipinjam':
      return 'warning';
    case 'Dikembalikan':
      return 'success';
    case 'Terlambat':
    case 'Tidak Mengembalikan':
      return 'danger';
    case 'Menunggu Persetujuan':
    case 'Menunggu Diambil':
      return 'info';
    case 'Dibatalkan':
    default:
      return 'neutral';
  }
};
