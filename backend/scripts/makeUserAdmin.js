import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const makeUserAdmin = async (emailOrUsername) => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      console.log('❌ User not found with email/username:', emailOrUsername);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin');
      console.log('👤 User Details:');
      console.log('   Name:', user.fullName);
      console.log('   Username:', user.username);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      process.exit(0);
    }

    // Update user role to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ User successfully made admin!');
    console.log('👤 User Details:');
    console.log('   Name:', user.fullName);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Previous Role:', user.role === 'admin' ? 'user' : user.role);
    console.log('   New Role:', user.role);
    console.log('\n🔐 User can now access admin panel at: /admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email/username from command line arguments
const emailOrUsername = process.argv[2];

if (!emailOrUsername) {
  console.log('❌ Please provide email or username');
  console.log('Usage: node makeUserAdmin.js <email-or-username>');
  console.log('Example: node makeUserAdmin.js user@example.com');
  console.log('Example: node makeUserAdmin.js johndoe');
  process.exit(1);
}

makeUserAdmin(emailOrUsername);