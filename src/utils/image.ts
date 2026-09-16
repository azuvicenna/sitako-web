import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
};
