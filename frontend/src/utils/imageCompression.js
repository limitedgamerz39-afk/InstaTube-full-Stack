import imageCompression from 'browser-image-compression';

/**
 * Compress image file before upload
 * @param {File} file - Image file to compress
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file) => {
  // Skip compression for small files (< 100KB)
  if (file.size < 100 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    maxIteration: 10,
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Compress multiple images
 * @param {FileList|File[]} files - Array of image files
 * @returns {Promise<File[]>} Array of compressed image files
 */
export const compressImages = async (files) => {
  const compressedFiles = [];
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file);
      compressedFiles.push(compressed);
    } else {
      // Non-image files are not compressed
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
};

export default { compressImage, compressImages };