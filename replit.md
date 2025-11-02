# InstaTube - Social Media Platform on Replit

## Overview
InstaTube is a full-stack MERN (MongoDB, Express, React, Node.js) social media platform inspired by Instagram and YouTube. It features a hybrid of social media functionalities including real-time messaging, posts, stories, notifications, playlists, video chapters, a community tab, notes, collab posts, and a trending page. The platform also incorporates advanced monetization features such as YouTube Premium-style subscriptions, a creator monetization system with a dashboard, Super Chat for live streaming, and a Shorts Fund. It is designed to be a Progressive Web App (PWA) with integrated ad monetization.

## User Preferences
### Development Workflow
- Uses existing project structure and conventions
- Backend and frontend run as separate workflows
- MongoDB Atlas for database (not local MongoDB)
- Cloudinary for media storage

## System Architecture

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
2. **frontend** - Runs Vite dev server on port 5000

### UI/UX Decisions
- Dedicated `/videos` route for long-form content with grid view, player, comments, and related videos.
- "Long Videos" shelf on the home feed with horizontal scrolling.
- Bottom navigation with a purple-themed Videos tab.
- PWA icons (192x192, 512x512, maskable) for native app experience.
- Creator Dashboard at `/creator` with comprehensive analytics.
- Admin panel at `/admin` for user management, post moderation, and platform statistics.

### Technical Implementations
- **Hybrid Features:**
    - Playlists system with a `Playlist` model.
    - "Watch Later" queue with a `WatchLater` model.
    - Video chapters and timestamps integrated into the `Post` model.
    - Community tab with `CommunityPost` model.
    - Notes feature with an auto-expiring `Note` model.
    - Collab Posts with a `collaborators` array in the `Post` model.
    - Trending page with `/api/trending` endpoint and custom algorithm.
- **Monetization & Premium Features:**
    - `Subscription` model for premium plans.
    - `Revenue` model for creator earnings tracking.
    - Super Chat integration for live streams.
    - Shorts Fund for viral content rewards.
    - Middleware for premium access control.
- **PWA:** Fully installable with offline support and push notification readiness via `vite-plugin-pwa`.
- **Ad Monetization:** Google AdSense integration for feed ads, pre-roll, mid-roll (for videos >5 mins), and Reels ads. Configurable ad frequency.
- **Vite Configuration:** Bound to `0.0.0.0:5000` with HMR configured for Replit. Proxies `/api` and `/socket.io` to backend.
- **Backend CORS:** Allowed Replit domains (`*.replit.dev`, `*.repl.co`).
- **Database Schema:** Models for User, Post, Comment, Story, Message, Notification, Conversation, Group, Playlist, WatchLater, CommunityPost, Note, Subscription, Revenue.
- **Socket.io Events:** Real-time notifications, messages, typing indicators, and online status.

### Feature Specifications
- **Core:** User authentication, profiles, posts (image/video), likes, comments, real-time notifications, DM, 24-hour stories, Reels, Long Videos, Explore page, save posts, analytics, groups.
- **Monetization:** Ad-free viewing, background play, offline downloads for premium users. Creator eligibility based on followers and watch time. 70/30 revenue split for Super Chat.
- **Admin:** User verification/banning/deletion, post moderation, role-based access control, platform statistics.

## External Dependencies

- **MongoDB Atlas:** Cloud-hosted NoSQL database.
- **Cloudinary:** Cloud-based media management for images and videos.
- **Socket.io:** Library for real-time, bidirectional, event-based communication.
- **Google AdSense:** Advertising placement service for monetization.
- **JWT (JSON Web Tokens):** For secure authentication.
- **bcrypt:** For password hashing.