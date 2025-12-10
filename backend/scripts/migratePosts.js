import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Post from '../models/Post.js';
import Short from '../models/Short.js';
import LongVideo from '../models/LongVideo.js';

dotenv.config();

// Connect to database
connectDB();

const migratePosts = async () => {
  try {
    console.log('Starting post migration...');
    
    // Find all posts with category 'short'
    const shortPosts = await Post.find({ category: 'short' });
    console.log(`Found ${shortPosts.length} short posts to migrate`);
    
    // Move short posts to Short collection
    for (const post of shortPosts) {
      try {
        // Create new short document
        await Short.create({
          ...post.toObject(),
          _id: post._id,
          category: 'short'
        });
        
        // Remove from Post collection
        await Post.findByIdAndDelete(post._id);
        console.log(`Migrated short post ${post._id}`);
      } catch (error) {
        console.error(`Error migrating short post ${post._id}:`, error.message);
      }
    }
    
    // Find all posts with category 'long'
    const longPosts = await Post.find({ category: 'long' });
    console.log(`Found ${longPosts.length} long posts to migrate`);
    
    // Move long posts to LongVideo collection
    for (const post of longPosts) {
      try {
        // Create new long video document
        await LongVideo.create({
          ...post.toObject(),
          _id: post._id,
          category: 'long'
        });
        
        // Remove from Post collection
        await Post.findByIdAndDelete(post._id);
        console.log(`Migrated long post ${post._id}`);
      } catch (error) {
        console.error(`Error migrating long post ${post._id}:`, error.message);
      }
    }
    
    console.log('Post migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migratePosts();