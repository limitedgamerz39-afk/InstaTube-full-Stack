# InstaTube API Documentation

## Overview

This document provides documentation for the InstaTube API endpoints.

## Authentication

Most API endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health Check

- `GET /health` - Get detailed health status
- `GET /health/liveness` - Liveness check
- `GET /health/readiness` - Readiness check

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email

### Users

- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:id/subscribe` - Subscribe/unsubscribe user
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get user suggestions
- `POST /api/users/role/request` - Request role upgrade

### Posts

- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get feed posts
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment
- `GET /api/posts/:id/comments` - Get post comments
- `DELETE /api/posts/:postId/comments/:commentId` - Delete comment
- `POST /api/posts/:id/save` - Save/unsave post
- `POST /api/posts/:id/report` - Report post

### Notifications

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Messages

- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:conversationId` - Get messages in conversation
- `POST /api/messages` - Send new message
- `POST /api/messages/:conversationId/read` - Mark conversation as read

### Stories

- `POST /api/stories` - Create story
- `GET /api/stories/subscribed` - Get subscribed users' stories
- `GET /api/stories/:userId` - Get user's stories
- `DELETE /api/stories/:id` - Delete story

### Explore

- `GET /api/explore/posts` - Get explore posts
- `GET /api/explore/hashtags` - Get trending hashtags
- `GET /api/explore/users` - Get suggested users

### Admin

- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:userId` - Delete user
- `PUT /api/admin/users/:userId/ban` - Ban/unban user
- `PUT /api/admin/users/:userId/verify` - Verify/unverify user
- `PUT /api/admin/users/:userId/role` - Change user role
- `GET /api/admin/posts` - Get all posts
- `DELETE /api/admin/posts/:postId` - Delete post
- `GET /api/admin/reports` - Get reported content
- `GET /api/admin/search` - Search users/posts
- `GET /api/admin/security` - Get security dashboard data

### Groups

- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `POST /api/groups/:id/messages` - Send group message

### Creator

- `GET /api/creator/dashboard` - Get creator dashboard
- `GET /api/creator/analytics` - Get creator analytics
- `POST /api/creator/schedule` - Schedule post

### Super Chat

- `POST /api/superchat` - Send super chat
- `GET /api/superchat/:userId` - Get user's super chats

### Playlists

- `POST /api/playlists` - Create playlist
- `GET /api/playlists` - Get user's playlists
- `GET /api/playlists/:id` - Get playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/add` - Add post to playlist
- `POST /api/playlists/:id/remove` - Remove post from playlist

### Watch Later

- `GET /api/watchlater` - Get watch later list
- `POST /api/watchlater/:postId` - Add/remove from watch later
- `DELETE /api/watchlater/:postId` - Remove from watch later

### Community

- `POST /api/community` - Create community post
- `GET /api/community` - Get community posts
- `GET /api/community/:id` - Get community post
- `PUT /api/community/:id` - Update community post
- `DELETE /api/community/:id` - Delete community post

### Notes

- `POST /api/notes` - Create note
- `GET /api/notes` - Get user's notes
- `GET /api/notes/:id` - Get note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Trending

- `GET /api/trending/posts` - Get trending posts
- `GET /api/trending/hashtags` - Get trending hashtags

### Highlights

- `POST /api/highlights` - Create highlight
- `GET /api/highlights/:userId` - Get user's highlights
- `DELETE /api/highlights/:id` - Delete highlight

### Shopping

- `POST /api/shopping/cart` - Add to cart
- `GET /api/shopping/cart` - Get cart
- `DELETE /api/shopping/cart/:productId` - Remove from cart
- `POST /api/shopping/checkout` - Checkout

### Business

- `POST /api/business/profile` - Create/update business profile
- `GET /api/business/profile` - Get business profile
- `GET /api/business/analytics` - Get business analytics

### Audio

- `POST /api/audio` - Upload audio
- `GET /api/audio/:id` - Get audio
- `DELETE /api/audio/:id` - Delete audio

### Live Stream

- `POST /api/livestream` - Start live stream
- `GET /api/livestream/:id` - Get live stream
- `POST /api/livestream/:id/stop` - Stop live stream
- `POST /api/livestream/:id/chat` - Send chat message

### Video Call

- `POST /api/videocall` - Initiate video call
- `POST /api/videocall/:roomId/join` - Join video call
- `POST /api/videocall/:roomId/leave` - Leave video call

### Audio Call

- `POST /api/audiocall` - Initiate audio call
- `POST /api/audiocall/:roomId/join` - Join audio call
- `POST /api/audiocall/:roomId/leave` - Leave audio call

### Monetization

- `GET /api/monetization/earnings` - Get earnings
- `POST /api/monetization/payout` - Request payout
- `GET /api/monetization/analytics` - Get monetization analytics

### Achievements

- `GET /api/achievements` - Get user's achievements
- `GET /api/achievements/all` - Get all achievements