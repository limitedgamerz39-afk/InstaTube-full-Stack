import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('🔧 Attempting to connect to MongoDB Atlas...');
    console.log('📝 Connection string:', process.env.MONGO_URI?.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://username:password@'));
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Add these options for better Atlas compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Verify we can actually query the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // More specific error handling
    if (error.name === 'MongoServerError') {
      if (error.code === 8000) {
        console.log('🔐 Authentication failed - check username/password in connection string');
      } else if (error.code === 13) {
        console.log('🚫 Permission denied - check Atlas user privileges');
      }
    } else if (error.name === 'MongoNetworkError') {
      console.log('🌐 Network error - check your IP whitelist in Atlas');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.log('🔌 Cannot reach Atlas cluster - check network connection');
    }
    
    process.exit(1);
  }
};

export default connectDB;