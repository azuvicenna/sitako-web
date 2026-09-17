import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getErrorMessage } from '@/utils/error';

describe('error utils', () => {
  it('mengekstrak pesan error dari respons Axios (error.response.data.message)', () => {
    const axiosError = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      {},
      {
        data: { message: 'NIP sudah terdaftar di database' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );

    const message = getErrorMessage(axiosError);
    expect(message).toBe('NIP sudah terdaftar di database');
  });

  it('menggunakan error.message jika respons data kosong pada AxiosError', () => {
    const axiosError = new AxiosError('Network Error', 'ERR_NETWORK');
    const message = getErrorMessage(axiosError);
    expect(message).toBe('Network Error');
  });

  it('mengekstrak pesan dari objek standar JavaScript Error', () => {
    const error = new Error('Terjadi kesalahan lokal');
    const message = getErrorMessage(error);
    expect(message).toBe('Terjadi kesalahan lokal');
  });

  it('mengembalikan string langsung jika error bertipe string', () => {
    const message = getErrorMessage('Pesan error dalam bentuk teks');
    expect(message).toBe('Pesan error dalam bentuk teks');
  });

  it('mengembalikan fallback saat error bernilai null, undefined, atau tipe tidak dikenal', () => {
    expect(getErrorMessage(null)).toBe('Terjadi kesalahan pada sistem');
    expect(getErrorMessage(undefined, 'Gagal memuat')).toBe('Gagal memuat');
    expect(getErrorMessage({ unknown: true })).toBe('Terjadi kesalahan pada sistem');
  });
});
