# 🚀 Performance Optimization Guide

## Current Performance Issues

### 1. **No Code Splitting**
All routes are loaded upfront. Implement lazy loading:

```jsx
// frontend/src/App.jsx
import { lazy, Suspense } from 'react';

const Feed = lazy(() => import('./pages/Feed'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
// ... other pages

// Wrap routes with Suspense
<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/" element={<Feed />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### 2. **Missing Database Indexes**
Add these indexes for better query performance:

```javascript
// User model
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

// Post model (already has some)
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 }); // Add this
postSchema.index({ 'likes': 1 }); // Add this
postSchema.index({ isArchived: 1 }); // Add this

// Message model
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: -1 });

// Story model
storySchema.index({ author: 1, expiresAt: -1 });
storySchema.index({ expiresAt: 1 }); // For auto-deletion
```

### 3. **No Caching Layer**
Implement Redis for caching:

```bash
npm install redis
```

```javascript
// backend/config/redis.js
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.connect();

export default redisClient;
```

**What to cache:**
- User profiles (5-10 minutes TTL)
- Post feed (1-2 minutes TTL)
- Trending hashtags (10 minutes TTL)
- User suggestions (30 minutes TTL)

### 4. **Inefficient Queries**
Use `.lean()` for read-only queries:

```javascript
// ❌ Slow
const posts = await Post.find({ author: userId });

// ✅ Faster (returns plain JS objects)
const posts = await Post.find({ author: userId }).lean();
```

### 5. **No Image Optimization**
Implement client-side image compression:

```bash
npm install browser-image-compression
```

```javascript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};

const compressedFile = await imageCompression(file, options);
```

### 6. **Missing Pagination Metadata**
Update API responses to include pagination:

```javascript
export const getFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Post.countDocuments({ /* filters */ });
  const posts = await Post.find({ /* filters */ })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    }
  });
};
```

### 7. **Bundle Size Optimization**

#### Frontend:
```bash
# Analyze bundle size
npm run build -- --analyze

# Tree-shake unused code
# Use dynamic imports for heavy libraries
```

#### Vite Config:
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-hot-toast', 'react-icons'],
        }
      }
    }
  }
}
```

### 8. **Enable Compression**
```bash
npm install compression
```

```javascript
// server.js
import compression from 'compression';

app.use(compression());
```

### 9. **Use CDN for Static Assets**
- Serve images via Cloudinary CDN
- Use different image sizes for different devices
- Implement responsive images

```jsx
<img
  srcSet={`
    ${cloudinaryUrl}/w_400/${image} 400w,
    ${cloudinaryUrl}/w_800/${image} 800w,
    ${cloudinaryUrl}/w_1200/${image} 1200w
  `}
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  src={`${cloudinaryUrl}/w_800/${image}`}
  alt="Post"
/>
```

### 10. **Database Connection Pooling**
Already handled by Mongoose, but ensure proper configuration:

```javascript
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
});
```

## Performance Monitoring

### Add Performance Metrics:
```javascript
// backend/middleware/performanceMiddleware.js
export const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};
```

## Recommended Tools

1. **Frontend Performance:**
   - Lighthouse CI
   - Web Vitals
   - React DevTools Profiler

2. **Backend Performance:**
   - MongoDB Compass (Query Profiler)
   - New Relic / DataDog
   - PM2 (Process monitoring)

3. **Load Testing:**
   - Apache JMeter
   - K6
   - Artillery

## Action Items Priority

### High Priority:
1. ✅ Add database indexes
2. ✅ Implement code splitting
3. ✅ Add compression middleware
4. ✅ Optimize images (Cloudinary transformations)

### Medium Priority:
5. ⏳ Implement Redis caching
6. ⏳ Add pagination metadata
7. ⏳ Use .lean() for read queries

### Low Priority:
8. 📝 Client-side image compression
9. 📝 Performance monitoring
10. 📝 CDN optimization

## Expected Improvements

With these optimizations:
- **Initial Load Time:** 40-60% faster
- **API Response Time:** 50-70% faster
- **Database Queries:** 3-5x faster
- **Bundle Size:** 30-40% smaller
