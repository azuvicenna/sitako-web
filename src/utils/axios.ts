import axios, { type AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    const customMessage = error.response?.data?.message;
    if (customMessage) {
      error.message = customMessage;
    }
    return Promise.reject(error);
  },
);
