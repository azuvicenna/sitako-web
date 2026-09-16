export const formatRupiah = (value?: number | string | null, fallback = 'Rp 0'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;

  if (Number.isNaN(numericValue)) {
    return fallback;
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
};

export const parseRupiah = (formatted: string): number => {
  const cleanNumber = formatted.replace(/[^0-9,-]/g, '').replace(',', '.');
  const result = Number(cleanNumber);
  return Number.isNaN(result) ? 0 : result;
};
