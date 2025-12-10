import { Client } from 'minio';
import multer from 'multer';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

// Log environment variables for debugging
console.log('MinIO Environment Variables:', {
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_PORT: process.env.MINIO_PORT,
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ? 'SET' : 'NOT SET',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ? 'SET' : 'NOT SET',
  MINIO_BUCKET: process.env.MINIO_BUCKET,
  MINIO_USE_SSL: process.env.MINIO_USE_SSL
});

const isMinIOConfigured = 
  process.env.MINIO_ENDPOINT &&
  process.env.MINIO_PORT &&
  process.env.MINIO_ACCESS_KEY &&
  process.env.MINIO_SECRET_KEY &&
  process.env.MINIO_BUCKET;

console.log('Is MinIO Configured:', isMinIOConfigured);

// Configure MinIO client with larger part size for big files
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  partSize: 100 * 1024 * 1024, // Increase part size to 100MB for better large file handling
});

if (isMinIOConfigured) {
  try {
    console.log('✅ MinIO configured successfully!');
    console.log(`📦 Using bucket: ${process.env.MINIO_BUCKET}`);
    
    const bucketName = process.env.MINIO_BUCKET;
    minioClient.bucketExists(bucketName, (err, exists) => {
      if (err) {
        console.error('❌ Error checking bucket:', err);
        return;
      }
      if (!exists) {
        console.log(`📦 Creating bucket: ${bucketName}`);
        minioClient.makeBucket(bucketName, 'us-east-1', (err) => {
          if (err) {
            console.error('❌ Error creating bucket:', err);
          } else {
            console.log(`✅ Bucket created: ${bucketName}`);
            
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
              ],
            };
            minioClient.setBucketPolicy(bucketName, JSON.stringify(policy), (err) => {
              if (err) {
                console.error('❌ Error setting bucket policy:', err);
              } else {
                console.log('✅ Bucket policy set to public read');
              }
            });
          }
        });
      } else {
        console.log(`✅ Bucket exists: ${bucketName}`);
      }
    });
  } catch (error) {
    console.error('❌ Error initializing MinIO client:', error);
  }
} else {
  console.warn('⚠️  MinIO not configured - file uploads will be disabled');
  console.warn('Set MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET');
}

export { isMinIOConfigured as isStorageConfigured };

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 1500 * 1024 * 1024, // 1500MB
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

export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 1500 * 1024 * 1024, // 1500MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  },
}).array('media', 10);

export const uploadToStorage = (fileBuffer, folder = 'd4dhub', originalName = 'file') => {
  if (!isMinIOConfigured) {
    return Promise.reject(new Error('MinIO is not configured. Please set up your credentials.'));
  }
  
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${originalName}`;
    const bucketName = process.env.MINIO_BUCKET;
    
    const stream = Readable.from(fileBuffer);
    
    console.log('Uploading to MinIO:', {
      bucketName,
      fileName,
      fileSize: fileBuffer.length
    });
    
    // Use multipart upload for large files
    const uploadOptions = {
      partSize: 100 * 1024 * 1024, // 100MB parts
      metaData: {
        'Content-Type': 'application/octet-stream'
      }
    };
    
    minioClient.putObject(bucketName, fileName, stream, fileBuffer.length, uploadOptions, (err, etag) => {
      if (err) {
        console.error('❌ MinIO upload error:', err);
        return reject(err);
      }
      
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const protocol = useSSL ? 'https' : 'http';
      const endpoint = process.env.MINIO_ENDPOINT;
      const port = process.env.MINIO_PORT;
      const portSuffix = (port === '80' && !useSSL) || (port === '443' && useSSL) ? '' : `:${port}`;
      
      const publicUrl = `${protocol}://${endpoint}${portSuffix}/${bucketName}/${fileName}`;
      
      // Return object compatible with controllers
      // Note: MinIO doesn't provide video/audio duration metadata like Cloudinary
      // Duration must be extracted separately if needed
      resolve({
        secure_url: publicUrl,
        public_id: fileName,
        etag: etag,
        resource_type: 'auto',
        duration: undefined, // MinIO doesn't provide this - can be added via ffprobe/metadata extraction
      });
    });
  });
};

export const deleteFromStorage = (publicId) => {
  if (!isMinIOConfigured) {
    return Promise.reject(new Error('MinIO is not configured'));
  }
  
  return new Promise((resolve, reject) => {
    const bucketName = process.env.MINIO_BUCKET;
    minioClient.removeObject(bucketName, publicId, (err) => {
      if (err) {
        console.error('❌ MinIO delete error:', err);
        return reject(err);
      }
      resolve({ result: 'ok' });
    });
  });
};

export default minioClient;