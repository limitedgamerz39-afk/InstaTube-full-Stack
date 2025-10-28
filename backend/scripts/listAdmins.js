import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const listAdmins = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select(
      'fullName username email role createdAt'
    );

    if (admins.length === 0) {
      console.log('ℹ️  No admin users found');
      console.log('\nTo make a user admin, run:');
      console.log('node scripts/makeUserAdmin.js <email-or-username>');
      process.exit(0);
    }

    console.log(`🔐 Found ${admins.length} admin user(s):\n`);
    console.log('═'.repeat(80));

    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.fullName}`);
      console.log(`   Username: @${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Member Since: ${admin.createdAt.toLocaleDateString()}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Total Admins:', admins.length);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listAdmins();
