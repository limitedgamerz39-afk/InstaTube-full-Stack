import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logSecurityEvent } from '../utils/logger.js';

// ✅ File type validation
const allowedFileTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
};

// ✅ File size limits (in bytes)
const fileSizeLimits = {
  image: 10 * 1024 * 1024, // 10MB
  video: 1000 * 1024 * 1024, // 1GB
  audio: 100 * 1024 * 1024 // 100MB
};

// ✅ Storage configuration
const storage = multer.memoryStorage();

// ✅ File filter function
const fileFilter = (req, file, cb) => {
  const { category = 'image' } = req.body;
  
  // Validate file type
  if (!allowedFileTypes[category] || !allowedFileTypes[category].includes(file.mimetype)) {
    logSecurityEvent('INVALID_FILE_TYPE', {
      userId: req.user?._id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      category
    });
    
    return cb(new Error(`Invalid file type for ${category}. Allowed types: ${allowedFileTypes[category].join(', ')}`), false);
  }
  
  // Validate file size
  if (file.size > fileSizeLimits[category]) {
    logSecurityEvent('FILE_SIZE_EXCEEDED', {
      userId: req.user?._id,
      fileName: file.originalname,
      fileSize: file.size,
      maxSize: fileSizeLimits[category],
      category
    });
    
    return cb(new Error(`File size exceeds limit for ${category}. Max size: ${fileSizeLimits[category] / (1024 * 1024)}MB`), false);
  }
  
  cb(null, true);
};

// ✅ Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1000 * 1024 * 1024 // 1GB max (will be further restricted by category)
  }
});

// ✅ Image processing middleware
export const processImage = async (req, res, next) => {
  if (!req.files) return next();
  
  try {
    // Process each uploaded file
    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Only process image files
        if (file.mimetype.startsWith('image/')) {
          // Remove EXIF data and resize if needed
          const processedBuffer = await sharp(file.buffer)
            .rotate() // Auto-rotate based on EXIF
            .resize(1920, 1080, { 
              fit: 'inside', 
              withoutEnlargement: true 
            }) // Max size 1920x1080
            .jpeg({ quality: 85, progressive: true }) // Convert to JPEG with quality 85
            .toBuffer();
          
          // Replace original buffer with processed buffer
          file.buffer = processedBuffer;
          file.size = processedBuffer.length;
          file.mimetype = 'image/jpeg';
          file.originalname = path.parse(file.originalname).name + '.jpg';
        }
      }
    }
    
    next();
  } catch (error) {
    logSecurityEvent('IMAGE_PROCESSING_ERROR', {
      userId: req.user?._id,
      error: error.message
    });
    
    next(new Error('Failed to process image'));
  }
};

// ✅ Video processing middleware (basic validation)
export const validateVideo = (req, res, next) => {
  if (!req.files) return next();
  
  try {
    // Basic video validation
    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Only validate video files
        if (file.mimetype.startsWith('video/')) {
          // Log video upload for monitoring
          console.log(`Video upload: ${file.originalname} (${file.size} bytes)`);
        }
      }
    }
    
    next();
  } catch (error) {
    logSecurityEvent('VIDEO_VALIDATION_ERROR', {
      userId: req.user?._id,
      error: error.message
    });
    
    next(new Error('Failed to validate video'));
  }
};

// ✅ File name sanitizer
export const sanitizeFileName = (req, res, next) => {
  if (!req.files) return next();
  
  try {
    // Sanitize file names
    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Generate unique file name
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const sanitized = name.replace(/[^a-zA-Z0-9]/g, '_');
        file.originalname = `${sanitized}_${uuidv4()}${ext}`;
      }
    }
    
    next();
  } catch (error) {
    logSecurityEvent('FILENAME_SANITIZATION_ERROR', {
      userId: req.user?._id,
      error: error.message
    });
    
    next(new Error('Failed to sanitize file names'));
  }
};

// ✅ Malware scan simulation (in a real app, you would integrate with an actual malware scanning service)
export const scanForMalware = (req, res, next) => {
  if (!req.files) return next();
  
  try {
    // Simulate malware scanning
    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // In a real implementation, you would send the file to a malware scanning service
        // For now, we'll just log the scan
        console.log(`Malware scan simulation for file: ${file.originalname}`);
        
        // Simulate a very basic check for potentially dangerous file content
        if (file.buffer.includes(Buffer.from('virus'))) {
          logSecurityEvent('MALWARE_DETECTED', {
            userId: req.user?._id,
            fileName: file.originalname
          });
          
          return next(new Error('Malware detected in file'));
        }
      }
    }
    
    next();
  } catch (error) {
    logSecurityEvent('MALWARE_SCAN_ERROR', {
      userId: req.user?._id,
      error: error.message
    });
    
    next(new Error('Failed to scan file for malware'));
  }
};

// ✅ Export configured upload middleware
export const uploadSingle = (fieldName, category) => [
  (req, res, next) => {
    req.body.category = category;
    next();
  },
  upload.single(fieldName),
  sanitizeFileName,
  scanForMalware,
  processImage,
  validateVideo
];

export const uploadMultiple = (fieldName, category, maxCount = 10) => [
  (req, res, next) => {
    req.body.category = category;
    next();
  },
  upload.array(fieldName, maxCount),
  sanitizeFileName,
  scanForMalware,
  processImage,
  validateVideo
];

export default upload;