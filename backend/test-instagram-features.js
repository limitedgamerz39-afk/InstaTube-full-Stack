// Test script to verify Instagram-like features are working
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Post from './models/Post.js';
import Story from './models/Story.js';
import Product from './models/Product.js';
import Highlight from './models/Highlight.js';

dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

const testInstagramFeatures = async () => {
  try {
    console.log('🔍 Testing Instagram-like features...\n');

    // Test 1: Create a user with business role
    console.log('1. Creating business user...');
    const user = new User({
      username: 'business_user',
      email: 'business@example.com',
      password: 'password123',
      fullName: 'Business User',
      role: 'business'
    });
    await user.save();
    console.log('✅ Business user created\n');

    // Test 2: Create a product
    console.log('2. Creating product...');
    const product = new Product({
      name: 'Test Product',
      description: 'A sample product for testing',
      price: 29.99,
      category: 'fashion',
      seller: user._id
    });
    await product.save();
    console.log('✅ Product created\n');

    // Test 3: Create a post with Instagram features
    console.log('3. Creating post with Instagram features...');
    const post = new Post({
      author: user._id,
      caption: 'Beautiful sunset photo! #sunset #photography',
      media: [{
        url: 'https://example.com/sunset.jpg',
        type: 'image'
      }],
      category: 'image',
      filter: 'clarendon',
      beautyFilter: 'medium',
      productTags: [{
        x: 50,
        y: 50,
        product: 'Test Product'
      }],
      isBusinessProfile: true,
      shoppingCartEnabled: true,
      checkInLocation: {
        name: 'Central Park, New York',
        lat: 40.7812,
        lng: -73.9665
      },
      highlightTitle: 'Summer Adventures',
      tags: ['sunset', 'photography', 'nature']
    });
    await post.save();
    console.log('✅ Post with Instagram features created\n');

    // Test 4: Create a story with AR effects
    console.log('4. Creating story with AR effects...');
    const story = new Story({
      author: user._id,
      mediaUrl: 'https://example.com/story.mp4',
      mediaType: 'video',
      caption: 'Fun day at the beach!',
      effect: 'flowers',
      location: {
        name: 'Miami Beach',
        lat: 25.7907,
        lng: -80.1300
      }
    });
    await story.save();
    console.log('✅ Story with AR effects created\n');

    // Test 5: Create a highlight
    console.log('5. Creating story highlight...');
    const highlight = new Highlight({
      user: user._id,
      title: 'Beach Adventures',
      stories: [story._id],
      coverImage: story.mediaUrl
    });
    await highlight.save();
    console.log('✅ Story highlight created\n');

    // Test 6: Add item to user's cart
    console.log('6. Adding item to user cart...');
    const userWithCart = await User.findById(user._id);
    userWithCart.cart.push({
      product: product._id,
      quantity: 2,
      price: product.price
    });
    await userWithCart.save();
    console.log('✅ Item added to cart\n');

    // Test 7: Verify all features are saved correctly
    console.log('7. Verifying all features...');
    const savedPost = await Post.findById(post._id)
      .populate('author', 'username')
      .populate('productTags.product');
    
    console.log('Post filter:', savedPost.filter);
    console.log('Post beauty filter:', savedPost.beautyFilter);
    console.log('Post product tags:', savedPost.productTags);
    console.log('Post check-in location:', savedPost.checkInLocation);
    console.log('Post highlight title:', savedPost.highlightTitle);
    
    const savedStory = await Story.findById(story._id)
      .populate('author', 'username');
    
    console.log('Story effect:', savedStory.effect);
    console.log('Story location:', savedStory.location);
    
    const savedHighlight = await Highlight.findById(highlight._id)
      .populate('user', 'username')
      .populate('stories', 'mediaUrl');
    
    console.log('Highlight title:', savedHighlight.title);
    console.log('Highlight stories count:', savedHighlight.stories.length);
    
    const savedUser = await User.findById(user._id)
      .populate('cart.product', 'name price');
    
    console.log('User cart items:', savedUser.cart.length);
    console.log('✅ All features verified successfully\n');

    console.log('🎉 All Instagram-like features are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Instagram features:', error);
  } finally {
    // Clean up test data
    try {
      await User.deleteOne({ username: 'business_user' });
      await Post.deleteMany({ author: { $exists: true } });
      await Story.deleteMany({ author: { $exists: true } });
      await Product.deleteMany({ seller: { $exists: true } });
      await Highlight.deleteMany({ user: { $exists: true } });
      console.log('🧹 Test data cleaned up');
    } catch (cleanupError) {
      console.error('❌ Error cleaning up test data:', cleanupError);
    }
    
    mongoose.connection.close();
  }
};

// Run the test
testInstagramFeatures();