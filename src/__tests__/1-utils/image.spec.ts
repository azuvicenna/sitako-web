import { describe, it, expect } from 'vitest';
import { getInitialsAvatar, getBookCoverPlaceholder } from '@/utils/image';

describe('image utils', () => {
  describe('getInitialsAvatar', () => {
    it('menghasilkan data URI SVG dengan 2 inisial nama', () => {
      const dataUri = getInitialsAvatar('Ahmad Fauzi');
      expect(dataUri).toMatch(/^data:image\/svg\+xml;utf8,/);
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('AF');
      expect(decodedSvg).toContain('#eab308');
    });

    it('menangani nama tunggal 1 kata dengan mengambil huruf awal', () => {
      const dataUri = getInitialsAvatar('Suharto');
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('S');
    });

    it('menggunakan warna latar kustom jika diberikan', () => {
      const dataUri = getInitialsAvatar('Budi Santoso', '#3b82f6', '#ffffff');
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('#3b82f6');
      expect(decodedSvg).toContain('#ffffff');
      expect(decodedSvg).toContain('BS');
    });

    it('menggunakan inisial default U saat nama kosong', () => {
      const dataUri = getInitialsAvatar('');
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('U');
    });
  });

  describe('getBookCoverPlaceholder', () => {
    it('menghasilkan data URI SVG cover buku dengan judul', () => {
      const dataUri = getBookCoverPlaceholder('Laskar Pelangi');
      expect(dataUri).toMatch(/^data:image\/svg\+xml;utf8,/);
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('Laskar Pelangi');
      expect(decodedSvg).toContain('viewBox="0 0 200 300"');
    });

    it('memotong judul yang terlalu panjang agar rapi di SVG', () => {
      const longTitle = 'Sistem Informasi Perpustakaan Berbasis Komputer Modern Terpadu';
      const dataUri = getBookCoverPlaceholder(longTitle);
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain(longTitle.slice(0, 24));
    });

    it('menggunakan judul default Buku saat input kosong', () => {
      const dataUri = getBookCoverPlaceholder('');
      const decodedSvg = decodeURIComponent(dataUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('Buku');
    });
  });
});
