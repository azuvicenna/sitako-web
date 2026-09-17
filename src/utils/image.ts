import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
};

/**
 * Menghasilkan avatar SVG data URI berdasarkan inisial nama secara lokal (offline-proof)
 */
export const getInitialsAvatar = (name: string, bg = '#eab308', fg = '#1f2937'): string => {
  const initials =
    (name || '')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${bg}"/><text x="50" y="55" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="700" fill="${fg}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Menghasilkan placeholder cover buku SVG data URI secara lokal (offline-proof)
 */
export const getBookCoverPlaceholder = (title = 'Buku'): string => {
  const shortTitle = (title || 'Buku').slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="200" height="300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs><rect width="200" height="300" rx="8" fill="url(#g)"/><rect x="10" y="10" width="180" height="280" rx="6" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/><g fill="rgba(255,255,255,0.85)" transform="translate(80, 105)"><path d="M20 0C9 0 0 9 0 20v20c0 2 2 4 4 4h32c2 0 4-2 4-4V20C40 9 31 0 20 0zm-2 34H8v-6h10v6zm0-10H8v-6h10v6zm14 10H22v-6h10v6zm0-10H22v-6h10v6z"/></g><text x="100" y="180" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#ffffff">${shortTitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
