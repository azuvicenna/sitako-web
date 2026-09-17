export type UserRole = 'Pustakawan' | 'Anggota';

export interface BaseUser {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  foto: string | null;
  status_aktif: boolean;
  createdAt: string;
}

export interface UpdateProfilePayload {
  nama?: string;
  email?: string;
  telepon?: string;
  password?: string;
}

export interface LibrarianUser extends BaseUser {
  nip: string;
  role?: 'Pustakawan';
}

export interface MemberUser extends BaseUser {
  nis: string;
  role?: 'Anggota';
}

export type User = LibrarianUser | MemberUser;

export interface LoginPayload {
  identifier: string;
  password: string;
  captcha: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
}

export type ProfileResponse = {
  success: boolean;
  message?: string;
} & User;
