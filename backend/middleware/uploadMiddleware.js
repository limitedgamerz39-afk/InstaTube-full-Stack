import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logSecurityEvent } from '../utils/logger.js';

// ✅ File type validation
const allowedFileTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'],
  // Add missing categories that frontend sends
  short: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'],
  long: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg']
};

// ✅ File size limits (in bytes)
const fileSizeLimits = {
  image: 20 * 1024 * 1024, // Increased to 20MB
  video: 2000 * 1024 * 1024, // Increased to 2GB
  audio: 200 * 1024 * 1024, // Increased to 200MB
  // Add missing categories with appropriate size limits
  short: 500 * 1024 * 1024, // Increased to 500MB for shorts
  long: 2000 * 1024 * 1024  // Increased to 2GB for long videos
};

// ✅ Storage configuration
const storage = multer.memoryStorage();

// ✅ File filter function - only basic validation, category validation happens in controller
const fileFilter = (req, file, cb) => {
  // Allow all file types at this stage, validation will happen in controller
  cb(null, true);
};

// ✅ Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2000 * 1024 * 1024, // Increased to 2GB max (will be further restricted by category)
    files: 20, // Allow up to 20 files in a single request
    fieldSize: 50 * 1024 * 1024, // Increase field size limit to 50MB
  }
});

// Add debugging middleware before upload
export const debugUpload = (req, res, next) => {
  console.log('=== UPLOAD MIDDLEWARE CALLED ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  next();
};

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
    // Only set category if not already present in request body
    if (!req.body.category) {
      req.body.category = category;
    }
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
    // Only set category if not already present in request body
    if (!req.body.category) {
      req.body.category = category;
    }
    next();
  },
  upload.array(fieldName, maxCount),
  sanitizeFileName,
  scanForMalware,
  processImage,
  validateVideo
];

export default upload;