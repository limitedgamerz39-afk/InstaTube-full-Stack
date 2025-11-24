import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixAllImageUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Update all users with absolute URLs to use relative paths
    const result = await User.updateMany(
      {
        $or: [
          { avatar: { $regex: /^http:\/\/localhost:(3000|5173)/ } },
          { avatar: { $regex: /^http:\/\/192\.168\./ } },
          { coverImage: { $regex: /^http:\/\/localhost:(3000|5173)/ } },
          { coverImage: { $regex: /^http:\/\/192\.168\./ } }
        ]
      },
      [
        {
          $set: {
            avatar: {
              $cond: [
                { $regexMatch: { input: "$avatar", regex: /^http:\/\/localhost:(3000|5173)/ } },
                "/default-avatar.png",
                {
                  $cond: [
                    { $regexMatch: { input: "$avatar", regex: /^http:\/\/192\.168\./ } },
                    "/default-avatar.png",
                    "$avatar"
                  ]
                }
              ]
            },
            coverImage: {
              $cond: [
                { $regexMatch: { input: "$coverImage", regex: /^http:\/\/localhost:(3000|5173)/ } },
                "/default-bg.jpg",
                {
                  $cond: [
                    { $regexMatch: { input: "$coverImage", regex: /^http:\/\/192\.168\./ } },
                    "/default-bg.jpg",
                    "$coverImage"
                  ]
                }
              ]
            }
          }
        }
      ]
    );

    console.log(`✅ Fixed ${result.modifiedCount} users with absolute image URLs`);
    
    // Also check for users with missing avatar/coverImage fields
    const missingResult = await User.updateMany(
      {
        $or: [
          { avatar: { $exists: false } },
          { avatar: "" },
          { coverImage: { $exists: false } },
          { coverImage: "" }
        ]
      },
      {
        $set: {
          avatar: "/default-avatar.png",
          coverImage: "/default-bg.jpg"
        }
      }
    );

    console.log(`✅ Set default images for ${missingResult.modifiedCount} users with missing image fields`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAllImageUrls();