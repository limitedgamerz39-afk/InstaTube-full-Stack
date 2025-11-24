# D4D HUB - Social Media Platform on Replit

D4D HUB is a full-stack MERN (MongoDB, Express, React, Node.js) social media platform inspired by Instagram and TikTok. It features a hybrid of social media functionalities including real-time messaging, posts, stories, notifications, playlists, video chapters, a community tab, notes, collab posts, and a trending page. The platform also incorporates advanced monetization features such as YouTube Premium-style subscriptions, a creator monetization system with a dashboard, Super Chat for live streaming, and a Shorts Fund. It is designed to be a Progressive Web App (PWA) with integrated ad monetization.

## Features

### Core Features
- 🔐 **Authentication** - JWT-based auth with bcrypt password hashing
- 👤 **User Profiles** - Customizable profiles with avatar, bio, subscriber/subscribed
- 📸 **Posts** - Create posts with image/video uploads via Cloudinary
- ❤️ **Interactions** - Like and comment on posts in real-time
- 🔔 **Notifications** - Real-time notifications via Socket.io
- 🔍 **Search** - Find users by username or name
- 💾 **Save & Archive** - Save favorite posts and archive your own
- 📖 **Stories** - Create and view 24-hour stories
- 🎬 **Reels** - Short-form video content
- 💬 **Messages** - Real-time direct messaging
- 🌍 **Explore** - Discover trending content and hashtags
- 📊 **Analytics** - View your content performance
- 📅 **Schedule Posts** - Plan your content in advance
- 👥 **Close Friends** - Share content with select subscriber
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- ⚡ **Real-time Updates** - Live likes, comments, and notifications

### Advanced Features
- 🏆 **Achievements System** - Gamified user engagement with badges
- 🎵 **Audio Extraction** - Extract audio from videos for music sharing
- 🧠 **AI Integration** - AI-powered caption generation and hashtag suggestions
- 📺 **Live Streaming** - Real-time video broadcasting with Super Chat
- 🛒 **Shopping** - Integrated e-commerce with product listings
- 💰 **Monetization** - Creator revenue sharing and premium subscriptions
- 📈 **Creator Dashboard** - Analytics and monetization tools for creators
- 🏢 **Business Profiles** - Enhanced profiles for businesses with contact options
- 🎯 **Targeted Advertising** - Ad placement system for revenue generation
- 📚 **Notes** - Blog-style long-form content
- 🎙️ **Audio/Video Calls** - Direct communication between users
- 👥 **Groups** - Community building with group chats
- 📋 **Playlists** - Curated collections of videos
- 🔖 **Watch Later** - Save content for later viewing
- 📈 **Trending** - Algorithmic content discovery
- 🌟 **Highlights** - Permanent story collections
- 🤝 **Collab Posts** - Joint content creation between users

## Tech Stack

- **Frontend**: React, Tailwind CSS, Socket.IO Client, Framer Motion
- **Backend**: Node.js, Express, MongoDB, Mongoose, Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT, OAuth, 2FA
- **Storage**: Cloudinary
- **Deployment**: Replit (for demo), with options for production deployment
- **AI Services**: DeepSeek API for caption generation and hashtag suggestions

## Getting Started

### Prerequisites

1. A Replit account (free tier works)
2. MongoDB Atlas account for database
3. Cloudinary account for media storage

### Setup Instructions

1. Fork this Replit project
2. Set up your environment variables in the `.env` files:
   - Backend `.env`:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key_here
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     ```
   - Frontend `.env`:
     ```
     VITE_API_URL=https://your-replit-backend-url
     VITE_SOCKET_URL=https://your-replit-backend-url
     ```

3. Install dependencies in both frontend and backend directories:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Run the development servers:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

## Deployment

This project is configured to run on Replit, but can be deployed to other platforms:

- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Backend**: Render, Heroku, or any Node.js hosting platform
- **Database**: MongoDB Atlas (recommended) or self-hosted MongoDB
- **Media Storage**: Cloudinary (configured) or AWS S3

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on this Replit project or contact the maintainer.