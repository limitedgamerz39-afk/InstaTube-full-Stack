# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with two apps:
  - backend: Node.js/Express + MongoDB (Mongoose), Socket.io, Cloudinary, JWT auth, optional DeepSeek AI integration
  - frontend: React (Vite), React Router, Tailwind, Axios, Socket.io client
- Backend exposes REST APIs under /api/* and a Socket.io server; frontend consumes via Axios and a Vite dev proxy.

Core commands
- Install
  - Backend: cd backend && npm install
  - Frontend: cd frontend && npm install
- Develop
  - Backend API (nodemon): cd backend && npm run dev
  - Frontend (Vite): cd frontend && npm run dev
- Build/Run
  - Frontend build: cd frontend && npm run build
  - Frontend preview (serves dist): cd frontend && npm run preview
  - Backend start (no build step): cd backend && npm start
- Health checks (no formal test suite configured)
  - MongoDB connectivity: node backend/test-db.js
  - Cloudinary connectivity: node backend/test-cloudinary.js
- Admin utilities
  - Make a user admin: node backend/scripts/makeUserAdmin.js <email-or-username>
  - List admins: node backend/scripts/listAdmins.js
  - Inspect a few users: node backend/scripts/checkUsers.js
  - Fix default avatars/covers: node backend/scripts/fixAvatars.js
  - Update default images in bulk: node backend/scripts/updateDefaultImages.js

Environment and configuration
- Backend .env (create in backend/)
  - MONGO_URI=mongodb://localhost:27017/instatube
  - JWT_SECRET=... (required)
  - PORT=5000
  - CLOUDINARY_CLOUD_NAME=...
  - CLOUDINARY_API_KEY=...
  - CLOUDINARY_API_SECRET=...
  - FRONTEND_URL=http://localhost:5173
  - NODE_ENV=development
  - Optional: DEEPSEEK_API_KEY=... (for AI features)
- Frontend .env (create in frontend/)
  - VITE_API_URL=http://localhost:5000/api
  - VITE_SOCKET_URL=http://localhost:5000
- Notes
  - Vite dev server proxies /api to http://localhost:5000 (vite.config.js).
  - README references .env.example files; they are not present—manually create .env files with the keys above.

High-level architecture
- Backend (Express + Mongoose)
  - server.js bootstraps: loads env, connects Mongo (config/db.js), creates HTTP server, attaches Socket.io (socket/socket.js), registers middleware, and mounts routes:
    - /api/auth, /api/users, /api/posts, /api/notifications, /api/messages, /api/stories, /api/explore, /api/admin, /api/ai
  - Middleware
    - authMiddleware.protect verifies JWT and populates req.user
    - adminMiddleware enforces admin/creator access
    - errorMiddleware provides notFound and errorHandler
  - Models (MongoDB): User, Post, Comment, Story, Message, Notification, Highlight, LiveStream, VideoCall
  - File uploads: config/cloudinary.js uses multer memory storage + Cloudinary uploader with basic transformations
  - Realtime: socket/socket.js sets up JWT-authenticated Socket.io, tracks online users, and emits typing/online/offline events
  - AI integration: services/deepseekService.js wraps DeepSeek Chat Completions via OpenAI SDK (requires DEEPSEEK_API_KEY)
- Frontend (React + Vite)
  - Routing and pages in src/App.jsx; most routes are wrapped in <ProtectedRoute/>
  - State/contexts: src/context/AuthContext.jsx (auth, token persistence, and socket connect), ThemeContext.jsx
  - API layer: src/services/api.js (Axios instance with auth header + 401 handler), feature-specific client modules (authAPI, userAPI, postAPI, notificationAPI, messageAPI, exploreAPI, storyAPI)
  - Realtime: src/services/socket.js manages the Socket.io client session; AuthContext connects using the JWT token
  - UI: TailwindCSS, component library under src/components/*

Development workflow notes
- Start backend and frontend in two terminals during development; the frontend proxies API calls.
- Socket.io requires a valid JWT in the auth handshake (frontend passes the token from localStorage).
- The backend prints an environment-variable readiness check on startup and logs Cloudinary config presence.

Gotchas for agents
- The AI routes import '../middleware/auth.js' but the actual auth middleware is exported from middleware/authMiddleware.js as protect. If AI endpoints fail authorization, check/align the import and usage.
- The backend does not serve the frontend build by default; for production, deploy the frontend dist/ separately (or add Express static serving if desired).

Key references from README.md
- Prereqs: Node 16+, MongoDB (local or Atlas), Cloudinary account
- Local dev URLs: Frontend http://localhost:5173, Backend http://localhost:5000
- Admin panel usage: create an admin via the makeUserAdmin.js script; then access /admin after login






3d47e0EauZL78cxh  pass cluster


alokawashti86_db_user user name 