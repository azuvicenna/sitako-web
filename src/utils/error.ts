import { isAxiosError } from 'axios';

/**
 * Safely extract an error message from an unknown error without using `any`.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan pada sistem',
): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}
