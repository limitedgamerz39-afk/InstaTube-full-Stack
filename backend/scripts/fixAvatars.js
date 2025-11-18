import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAvatars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Update all users with demo/placeholder avatars or old cloud storage URLs
    const result = await User.updateMany(
      {
        $or: [
          { avatar: /cloudinary\.com\/demo/ }, // Old Cloudinary demo URLs
          { avatar: /ui-avatars\.com/ },
          { avatar: { $exists: false } },
          { avatar: '' }
        ]
      },
      {
        $set: {
          avatar: `${frontendUrl}/default-avatar.png`
        }
      }
    );

    console.log(`✅ Fixed ${result.modifiedCount} user avatars`);
    
    // Also set cover image if missing
    const coverResult = await User.updateMany(
      {
        $or: [
          { coverImage: { $exists: false } },
          { coverImage: '' },
          { coverImage: null }
        ]
      },
      {
        $set: {
          coverImage: `${frontendUrl}/default-bg.jpg`
        }
      }
    );

    console.log(`✅ Set ${coverResult.modifiedCount} cover images`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAvatars();
