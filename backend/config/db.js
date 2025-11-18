import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const isLocalMongo = process.env.MONGO_URI?.includes('localhost') || process.env.MONGO_URI?.includes('127.0.0.1');
    console.log(`🔧 Attempting to connect to ${isLocalMongo ? 'Local MongoDB' : 'MongoDB Atlas'}...`);
    console.log('📝 Connection string:', process.env.MONGO_URI?.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://username:password@'));
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
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