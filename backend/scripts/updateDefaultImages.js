import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const updateDefaultImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Update users with missing or placeholder avatars
    const result = await User.updateMany(
      {
        $or: [
          { avatar: { $exists: false } },
          { avatar: '' },
          { avatar: /^\/default-avatar/ },
          { avatar: /ui-avatars\.com/ }
        ]
      },
      {
        $set: {
          avatar: '/default-avatar.png',
          coverImage: '/default-bg.jpg'
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with default images`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateDefaultImages();
