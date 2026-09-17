import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/validations/auth/auth.schema';

describe('auth.schema', () => {
  it('berhasil memvalidasi input login yang lengkap dan benar', () => {
    const validData = {
      identifier: '198501012010011001',
      password: 'password123',
      captcha: '4k9z',
    };

    const parsed = loginSchema.parse(validData);
    expect(parsed.identifier).toBe('198501012010011001');
    expect(parsed.password).toBe('password123');
    expect(parsed.captcha).toBe('4k9z');
  });

  it('gagal validasi jika identifier (NIP/NIS) kosong atau hanya spasi', () => {
    const invalidData = {
      identifier: '   ',
      password: 'password123',
      captcha: '4k9z',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.identifier).toBeDefined();
  });

  it('gagal validasi jika password kosong', () => {
    const invalidData = {
      identifier: '198501012010011001',
      password: '',
      captcha: '4k9z',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });

  it('gagal validasi jika captcha kosong', () => {
    const invalidData = {
      identifier: '198501012010011001',
      password: 'password123',
      captcha: '',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.captcha).toBeDefined();
  });
});
