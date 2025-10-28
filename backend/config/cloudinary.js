import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully!');
} else {
  console.warn('⚠️  Cloudinary not configured - file uploads will be disabled');
  console.warn('Get free credentials at: https://cloudinary.com/users/register_free');
}

export { isCloudinaryConfigured };

// Multer memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('application/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, audio and document files are allowed!'), false);
    }
  },
});

// Multiple file upload (max 10 files)
export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  },
}).array('media', 10); // Max 10 files

// Upload to Cloudinary
export const uploadToCloudinary = (fileBuffer, folder = 'instatube') => {
  if (!isCloudinaryConfigured) {
    return Promise.reject(new Error('Cloudinary is not configured. Please set up your credentials.'));
  }
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 1080, height: 1080, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
