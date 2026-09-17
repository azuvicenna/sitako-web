import dayjs from 'dayjs';
import 'dayjs/locale/id';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('id');

export const formatDate = (
  date?: string | Date | null,
  format = 'DD/MM/YYYY',
  fallback = '-',
): string => {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.format(format) : fallback;
};

export const formatDateTime = (
  date?: string | Date | null,
  format = 'DD/MM/YYYY HH:mm',
  fallback = '-',
): string => {
  return formatDate(date, format, fallback);
};

export const formatRelativeTime = (date?: string | Date | null, fallback = '-'): string => {
  if (!date) return fallback;
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : fallback;
};
