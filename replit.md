# InstaTube - Social Media Platform on Replit

## Overview
InstaTube is a full-stack MERN (MongoDB, Express, React, Node.js) social media platform inspired by Instagram. It features real-time messaging, posts, stories, notifications, and more.

**Current State:** Fully configured and running on Replit with all features operational.

## Project Architecture

### Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas
- **Real-time:** Socket.io
- **File Storage:** Cloudinary (images/videos)
- **Authentication:** JWT + bcrypt

### Port Configuration
- **Frontend (Vite):** Port 5000 (public-facing)
- **Backend (Express):** Port 3000 (internal)
- Frontend proxies API requests to backend at `localhost:3000`

### Workflows
1. **backend** - Runs backend server on port 3000
   - Command: `cd backend && npm start`
   - Serves API endpoints and Socket.io connections
   
2. **frontend** - Runs Vite dev server on port 5000
   - Command: `cd frontend && npm run dev`
   - Public-facing web application

## Recent Changes

**Date:** November 1, 2025
### Long-Form Video Support Added
1. **Videos Page (YouTube-like Experience)**
   - Dedicated `/videos` route for long-form content
   - Grid view of all long videos with thumbnails and duration badges
   - Full video player with controls
   - Comments section with real-time updates
   - Related videos sidebar
   - Video metadata display (views, likes, upload date)
   - Subscribe button for channel support

2. **Feed Integration**
   - "Long Videos" shelf added to home feed
   - Horizontal scrolling video thumbnails (200px wide)
   - Duration badges showing HH:MM:SS format for videos >1 hour
   - View count and upload date display
   - Click-through to dedicated watch page

3. **Navigation Updates**
   - Videos tab added to bottom navigation (mobile)
   - Purple theme color for Videos icon
   - Active state indicators

4. **Monetization Ready**
   - Pre-roll ads enabled (shown before video playback)
   - Mid-roll ads functional for videos >5 minutes
   - Ad interval: Every 5 minutes (configurable in `adConfig.js`)
   - Seamless ad integration with video playback

5. **Technical Improvements**
   - Safe array handling for comments and likes
   - Proper initialization of video data
   - Error handling for undefined data structures
   - Consistent with existing Reels ad system

### PWA & Monetization Features Added
1. **Progressive Web App (PWA)**
   - Fully installable on desktop and mobile devices
   - Offline support with service workers
   - Native app-like experience
   - All required PWA icons added (192x192, 512x512, maskable icons)
   - Configured via vite-plugin-pwa

2. **Monetization System**
   - Google AdSense integration ready
   - Feed ads (display between posts every 5th post)
   - Video ads for Reels (pre-roll, mid-roll, post-roll)
   - Reels ads (every 4th reel)
   - Configurable ad frequency and placement
   - Development mode with ad placeholders

3. **Vite HMR Fix**
   - Fixed WebSocket connection errors
   - Simplified HMR configuration for Replit compatibility
   - Hot Module Replacement now works properly

**Date:** October 30, 2025
### Configuration Updates
1. **Vite Configuration (frontend/vite.config.js)**
   - Configured to bind to `0.0.0.0:5000` for Replit proxy compatibility
   - HMR configured for Replit environment
   - Proxies `/api` and `/socket.io` to backend at `localhost:3000`

2. **Backend CORS (backend/server.js)**
   - Added Replit domains (*.replit.dev, *.repl.co) to allowed origins
   - Backend runs on port 3000 bound to localhost
   - Supports WebSocket connections for Socket.io

3. **Environment Variables**
   - All required secrets configured via Replit Secrets
   - `MONGO_URI` - MongoDB Atlas connection
   - `JWT_SECRET` - Authentication token encryption
   - `CLOUDINARY_*` - Image/video upload service

## Features

### Core Features
- 🔐 User authentication (signup/login with JWT)
- 👤 User profiles with avatars and bios
- 📸 Posts with image/video uploads
- ❤️ Likes and comments
- 🔔 Real-time notifications
- 💬 Direct messaging with Socket.io
- 📖 24-hour stories
- 🎬 Reels (short videos ≤60 seconds)
- 🎥 Long Videos (YouTube-like videos up to 1 hour) **NEW!**
- 🌍 Explore page with trending content
- 💾 Save posts and archive
- 📊 Analytics dashboard
- 👥 Groups and group messaging

### PWA Features (NEW!)
- 📱 Installable on desktop (Windows, Mac, Linux)
- 📲 Installable on mobile (Android, iOS)
- ⚡ Offline support
- 🔔 Push notifications ready
- 🚀 Native app experience

### Monetization Features (NEW!)
- 💰 Google AdSense integration
- 📺 Feed ads (between posts every 5th post)
- 🎬 Video ads:
  - ✅ Pre-roll ads (active on Reels & Long Videos)
  - ✅ Mid-roll ads (active for long videos >5 minutes)
  - Post-roll ads (disabled by default)
- 📱 Reels ads (every 4th reel)
- ⚙️ Configurable ad placement and frequency

**Note**: Mid-roll ads are now fully functional with the new long-form video feature!

### Admin Features
- Complete admin panel at `/admin`
- User management (verify, ban, delete)
- Post moderation
- Role-based access control
- Platform statistics dashboard

## User Preferences

### Development Workflow
- Uses existing project structure and conventions
- Backend and frontend run as separate workflows
- MongoDB Atlas for database (not local MongoDB)
- Cloudinary for media storage

## How to Use

### First Time Setup
All setup is complete! The app is ready to use.

### Accessing the Application
1. The frontend is accessible via the Replit webview
2. Click the webview/browser button to see the running app
3. Create an account to start using the platform

### Making an Admin
To grant admin access to a user:
```bash
cd backend
node scripts/makeUserAdmin.js user@email.com
```

### Testing Different Features
- **Posts:** Click the + icon to upload images/videos
- **Stories:** Click "Your Story" to create a 24h story
- **Messages:** Click the message icon to chat with users
- **Admin Panel:** Login as admin, go to Settings → Admin Panel

## Development Notes

### Adding New Features
- Backend routes go in `backend/routes/`
- Frontend pages go in `frontend/src/pages/`
- Components in `frontend/src/components/`

### Database Schema
Models are in `backend/models/`:
- User, Post, Comment, Story, Message
- Notification, Conversation, Group
- All using Mongoose ODM

### Socket.io Events
Real-time events configured in `backend/socket/socket.js`:
- Notifications
- Messages
- Typing indicators
- Online status

## Troubleshooting

### If the app isn't loading
1. Check both workflows are running (backend + frontend)
2. Verify environment secrets are set
3. Check MongoDB Atlas connection (IP whitelist)
4. Review workflow logs for errors

### Common Issues
- **Port conflicts:** Backend uses 3000, frontend uses 5000
- **CORS errors:** Should be resolved with Replit domain allowlist
- **Upload errors:** Verify Cloudinary credentials
- **Database errors:** Check MongoDB Atlas connection string

## Dependencies

### Backend
- express, mongoose, socket.io
- jsonwebtoken, bcryptjs
- cloudinary, multer
- cors, helmet, morgan

### Frontend  
- react, react-router-dom
- axios, socket.io-client
- tailwindcss
- react-hot-toast, react-icons

## Additional Documentation
- `README.md` - Full project documentation
- `ADMIN_SETUP.md` - Admin panel setup guide
- `ADMIN_PANEL_GUIDE.md` - Complete admin documentation
- `CLOUDINARY_SETUP.md` - Cloudinary configuration
- `GROUP_MESSAGING_GUIDE.md` - Group chat features
- `MONETIZATION_SETUP.md` - **NEW!** Complete guide for PWA installation & monetization

## Monetization Setup

To enable ads and start earning:
1. Read `MONETIZATION_SETUP.md` for complete setup guide
2. Create Google AdSense account
3. Update `frontend/src/utils/adConfig.js` with your AdSense IDs
4. Deploy to production
5. Wait for AdSense approval

### PWA Installation
Users can install InstaTube as a native app:
- **Desktop**: Click install icon in browser address bar
- **Android**: Menu → Add to Home Screen
- **iOS**: Share → Add to Home Screen
