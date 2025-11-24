import sharp from 'sharp';
import crypto from 'crypto';

// Strip EXIF data from images
export const stripExifData = async (buffer) => {
  try {
    // Use sharp to process the image and remove metadata
    const processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .toBuffer();
    
    return processedBuffer;
  } catch (error) {
    console.error('Error stripping EXIF data:', error);
    // Return original buffer if processing fails
    return buffer;
  }
};

// Generate a safe filename
export const generateSafeFilename = (originalName) => {
  // Remove special characters and replace spaces with hyphens
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Add timestamp and random string to prevent conflicts
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString('hex');
  
  // Extract extension
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? '.' + parts.pop() : '';
  
  return `${safeName || 'file'}-${timestamp}-${randomString}${extension}`;
};

// Validate file content type (basic check)
export const validateFileType = (buffer, mimeType) => {
  // This is a simplified validation - in production, you might want to use
  // a library like 'file-type' for more accurate detection
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
  
  if (imageTypes.includes(mimeType)) {
    // Basic JPEG header check
    if (mimeType === 'image/jpeg' && buffer.length > 2) {
      return buffer[0] === 0xFF && buffer[1] === 0xD8;
    }
    // Basic PNG header check
    if (mimeType === 'image/png' && buffer.length > 8) {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    }
  }
  
  // For other types, we'll trust the MIME type for now
  return true;
};

// Scan for potential malicious content (basic implementation)
export const scanForMaliciousContent = (buffer) => {
  // This is a very basic implementation - in production, you would use
  // a proper antivirus service or library
  
  // Check for common malicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ];
  
  const content = buffer.toString('utf8');
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return {
        isSafe: false,
        reason: 'Suspicious content detected'
      };
    }
  }
  
  return {
    isSafe: true,
    reason: 'No suspicious content found'
  };
};

export default {
  stripExifData,
  generateSafeFilename,
  validateFileType,
  scanForMaliciousContent
};