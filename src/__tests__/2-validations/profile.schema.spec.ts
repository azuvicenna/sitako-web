import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '@/validations/profile/profile.schema';

describe('profile.schema', () => {
  it('berhasil memvalidasi update profil dasar tanpa ganti kata sandi', () => {
    const validData = {
      nama: 'Budi Santoso',
      email: 'budi.santoso@sekolah.sch.id',
      telepon: '081234567890',
    };

    const parsed = updateProfileSchema.parse(validData);
    expect(parsed.nama).toBe('Budi Santoso');
    expect(parsed.email).toBe('budi.santoso@sekolah.sch.id');
    expect(parsed.telepon).toBe('081234567890');
  });

  it('berhasil memvalidasi update profil ketika kata sandi baru dan konfirmasi cocok', () => {
    const validData = {
      nama: 'Budi Santoso',
      email: 'budi.santoso@sekolah.sch.id',
      telepon: '081234567890',
      password: 'passwordBaru123',
      confirmPassword: 'passwordBaru123',
    };

    const parsed = updateProfileSchema.parse(validData);
    expect(parsed.password).toBe('passwordBaru123');
    expect(parsed.confirmPassword).toBe('passwordBaru123');
  });

  it('gagal jika format email tidak valid', () => {
    const invalidData = {
      nama: 'Budi Santoso',
      email: 'email_bukan_format_valid',
      telepon: '081234567890',
    };

    const result = updateProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it('gagal jika password baru kurang dari 6 karakter', () => {
    const invalidData = {
      nama: 'Budi Santoso',
      email: 'budi@sekolah.sch.id',
      telepon: '081234567890',
      password: '123',
      confirmPassword: '123',
    };

    const result = updateProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });

  it('gagal jika password baru tidak cocok dengan confirmPassword', () => {
    const invalidData = {
      nama: 'Budi Santoso',
      email: 'budi@sekolah.sch.id',
      telepon: '081234567890',
      password: 'passwordBaru123',
      confirmPassword: 'passwordSalah456',
    };

    const result = updateProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.confirmPassword).toBeDefined();
  });
});
