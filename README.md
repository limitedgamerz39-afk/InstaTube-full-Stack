# 🎨 InstaTube - Next-Gen Social Media Platform

<div align="center">

![InstaTube Logo](https://img.shields.io/badge/InstaTube-Ultimate-purple?style=for-the-badge&logo=instagram)
![Version](https://img.shields.io/badge/version-2.0.0-pink?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-amber?style=for-the-badge)

**A modern, feature-rich social media platform with unique Purple/Pink/Amber design and 15+ advanced features**

</div>

## ✨ Features

### Core Features
- 🔐 **Authentication** - JWT-based auth with bcrypt password hashing
- 👤 **User Profiles** - Customizable profiles with avatar, bio, followers/following
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
- 👥 **Close Friends** - Share content with select followers
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- ⚡ **Real-time Updates** - Live likes, comments, and notifications

### Admin Features (NEW! 🎉)
- 🔐 **Admin Panel** - Complete admin dashboard with statistics
- 👥 **User Management** - View, search, verify, ban/unban, delete users
- 📸 **Post Management** - View, search, and moderate posts
- 🛡️ **Role Management** - Assign user roles (user/creator/business/admin)
- 📊 **Dashboard Stats** - Monitor platform metrics and activity
- 🔍 **Search & Filter** - Advanced search for users and posts
- ⚡ **Quick Actions** - Perform bulk operations efficiently

**[📖 Admin Panel Setup Guide](ADMIN_SETUP.md)** | **[📘 Full Admin Documentation](ADMIN_PANEL_GUIDE.md)**

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT & bcrypt
- Socket.io
- Cloudinary
- Multer

### Frontend
- React.js (Vite)
- React Router DOM
- Tailwind CSS
- Axios
- Socket.io Client
- React Hot Toast
- React Icons

## 📁 Project Structure

```
instatube/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

### 1️⃣ Clone or Setup Project

```bash
# If you have the files, navigate to the project root
cd instatube
```

### 2️⃣ Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your credentials:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key_here
# CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
# CLOUDINARY_API_KEY=your_cloudinary_api_key
# CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Getting Cloudinary Credentials:**
1. Sign up at https://cloudinary.com (free tier)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret

### 3️⃣ Frontend Setup

```bash
# Navigate to frontend folder (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file if needed (default values work for local dev):
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
```

### 4️⃣ Running the Application

**Option 1: Run Both Servers Separately**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Backend will run on http://localhost:5000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Frontend will run on http://localhost:5173
```

**Option 2: Production Build**

```bash
# Build frontend
cd frontend
npm run build

# Serve frontend from backend (optional)
cd ../backend
npm start
```

### 5️⃣ Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔐 Admin Panel Setup

### Quick Start

**Make any user an admin:**
```bash
cd backend
node scripts/makeUserAdmin.js your-email@example.com
```

**Access admin panel:**
1. Login with admin account
2. Go to Settings → Click "Admin Panel" button
3. Or navigate to `/admin`

**Admin Features:**
- Dashboard with real-time statistics
- User management (verify, ban, delete)
- Post moderation and deletion
- Role-based access control
- Search and filter capabilities

For detailed setup instructions, see [ADMIN_SETUP.md](ADMIN_SETUP.md)

## 📝 Environment Variables

### Backend (.env)

```env
MONGO_URI=mongodb://localhost:27017/instatube
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🎯 API Endpoints

### Admin (Protected - Admin Only)
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users (paginated)
- `DELETE /api/admin/users/:userId` - Delete user
- `PUT /api/admin/users/:userId/ban` - Ban/unban user
- `PUT /api/admin/users/:userId/verify` - Verify/unverify user
- `PUT /api/admin/users/:userId/role` - Change user role
- `GET /api/admin/posts` - Get all posts (paginated)
- `DELETE /api/admin/posts/:postId` - Delete post
- `GET /api/admin/reports` - Get reported content
- `GET /api/admin/search` - Search users/posts

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/suggestions` - Get user suggestions

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get feed posts
- `GET /api/posts/:id` - Get single post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment
- `GET /api/posts/:id/comments` - Get post comments
- `DELETE /api/posts/:postId/comments/:commentId` - Delete comment

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Issues
- Ensure MongoDB is running locally or use MongoDB Atlas
- Check your connection string in .env
- Whitelist your IP in MongoDB Atlas

### Cloudinary Upload Issues
- Verify your Cloudinary credentials
- Check file size limits (max 5MB in current config)
- Ensure internet connection for uploads

### Socket.io Connection Issues
- Check if backend server is running
- Verify CORS settings in backend
- Check browser console for connection errors

## 📱 Usage Guide

1. **Sign Up** - Create a new account
2. **Complete Profile** - Go to Settings and update your profile
3. **Upload Post** - Click the + icon to create your first post
4. **Follow Users** - Search for users and follow them
5. **Interact** - Like and comment on posts
6. **Check Notifications** - View real-time notifications

## 🎨 Customization

### Change Theme Colors
Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  primary: '#0095f6', // Change this
  // ... other colors
}
```

### Modify Upload Limits
Edit `backend/config/cloudinary.js`:
```javascript
limits: {
  fileSize: 5 * 1024 * 1024, // Change this (in bytes)
}
```

## 🚀 Deployment

### Backend (Heroku/Railway/Render)
1. Push code to GitHub
2. Connect to your hosting platform
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 👨‍💻 Author

Built with ❤️ using MERN Stack

## 🙏 Acknowledgments

- Inspired by Instagram
- Built for learning purposes
- Community contributions welcome

---

**Happy Coding! 🎉**

For issues or questions, please create an issue in the repository.
