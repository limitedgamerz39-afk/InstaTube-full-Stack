import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const users = await User.find({}).limit(5);
    
    console.log('\n📋 Current Users:');
    users.forEach(user => {
      console.log(`\n👤 ${user.username}`);
      console.log(`   Avatar: ${user.avatar}`);
      console.log(`   Cover: ${user.coverImage || 'Not set'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();
