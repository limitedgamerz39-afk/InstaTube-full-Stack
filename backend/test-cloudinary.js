import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Cloudinary Configuration...\n');

console.log('Environment Variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || '❌ Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Present' : '❌ Missing');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('\n✅ Cloudinary configured successfully!');
console.log('Cloud Name:', cloudinary.config().cloud_name);
console.log('API Key:', cloudinary.config().api_key);

// Test API connection
console.log('\nTesting API connection...');

cloudinary.api.ping()
  .then((result) => {
    console.log('✅ Cloudinary API Connection Successful!');
    console.log('Response:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cloudinary API Connection Failed!');
    console.error('Error:', error.message);
    console.error('Details:', error.error);
    process.exit(1);
  });
