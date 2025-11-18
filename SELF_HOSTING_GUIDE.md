# 🏠 InstaTube Self-Hosting Guide

Complete guide to self-host InstaTube on your own machine with MinIO storage and local MongoDB.

## 📋 Prerequisites

Before you begin, install these on your machine:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/

2. **MongoDB** (Community Edition)
   - Download: https://www.mongodb.com/try/download/community
   - Or use MongoDB Compass: https://www.mongodb.com/products/compass

3. **MinIO** (Already Running ✅)
   - You already have MinIO running on `127.0.0.1:9000`

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

#### Backend Configuration

Create a `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (Local)
MONGO_URI=mongodb://localhost:27017/instatube

# JWT Secret (Change this!)
JWT_SECRET=your_super_secret_jwt_key_12345

# MinIO Configuration
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=Abhinash
MINIO_SECRET_KEY=Abhinash1212
MINIO_BUCKET=instatube

# OpenAI (Optional - for AI features)
# OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your_session_secret_here_123
```

#### Frontend Configuration

Create a `.env` file in the `frontend` folder:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB

#### Option A: MongoDB as a Service (Recommended)
If you installed MongoDB, it should already be running as a service.

Verify it's running:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl status mongod
```

#### Option B: Start MongoDB Manually
```bash
# Windows
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"

# macOS/Linux
mongod --dbpath /data/db
```

### 4. Start MinIO

You already have MinIO running! ✅

Keep this terminal window open:
```
MinIO Object Storage Server
API: http://127.0.0.1:9000
WebUI: http://127.0.0.1:52037
RootUser: Abhinash
RootPass: Abhinash1212
```

**MinIO Web UI**: Open http://127.0.0.1:52037 in your browser to manage files and buckets.

### 5. Start the Application

#### Start Backend Server

Open a new terminal:
```bash
cd backend
npm start
```

You should see:
```
✅ MinIO configured successfully!
📦 Using bucket: instatube
✅ Bucket created: instatube
🔧 Attempting to connect to Local MongoDB...
✅ MongoDB Connected: localhost
📊 Database: instatube
🚀 Server running on port 5000
```

#### Start Frontend Server

Open another new terminal:
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 6. Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MinIO Web UI**: http://127.0.0.1:52037

## 📁 File Storage

All uploaded files (images, videos, avatars) are stored in MinIO:
- **Location**: `C:\minio\data\instatube\`
- **Access**: Through MinIO Web UI at http://127.0.0.1:52037

Folders in MinIO bucket:
- `instatube/posts` - Post images and videos
- `instatube/stories` - Story media
- `instatube/avatars` - Profile pictures
- `instatube/covers` - Cover images
- `instatube/messages` - Message attachments
- `instatube/community` - Community post media

### ⚠️ Known Limitations

**Video Duration Validation**:
- MinIO doesn't provide video metadata (duration) like cloud services
- Duration limits for Shorts (60s) and Long Videos (1hr) are NOT enforced automatically
- Users should manually ensure videos meet duration requirements
- Future enhancement: Can add ffmpeg/ffprobe for server-side duration extraction

## 💾 Database

All data (users, posts, messages) is stored in local MongoDB:
- **Database Name**: `instatube`
- **Connection**: `mongodb://localhost:27017/instatube`
- **Data Location**: Default MongoDB data directory

### View Database with MongoDB Compass

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `instatube`

## 🛠️ Troubleshooting

### MinIO Connection Issues

**Error**: "MinIO is not configured"
- Check if MinIO is running at http://127.0.0.1:9000
- Verify credentials in `backend/.env` match MinIO RootUser/RootPass

**Error**: "Bucket not found"
- The app automatically creates the bucket
- Or manually create it via MinIO Web UI

### MongoDB Connection Issues

**Error**: "Cannot reach MongoDB"
- Start MongoDB service: `net start MongoDB` (Windows)
- Check if MongoDB is running: `mongod --version`

**Error**: "Authentication failed"
- Local MongoDB doesn't require auth by default
- Use: `MONGO_URI=mongodb://localhost:27017/instatube`

### Port Already in Use

**Backend (Port 5000)**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**Frontend (Port 3000)**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

## 🔒 Security Notes

### For Production Deployment:

1. **Change JWT Secret**: Use a strong, random secret
   ```bash
   # Generate a random secret:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Enable MinIO SSL**: 
   - Set `MINIO_USE_SSL=true`
   - Configure SSL certificates in MinIO

3. **Secure MongoDB**:
   - Enable authentication
   - Create database user with limited permissions
   - Update MONGO_URI with credentials

4. **Environment Variables**:
   - Never commit `.env` files to Git
   - Use strong passwords for all services

## 📊 System Requirements

### Minimum:
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB free space
- Network: Local network access

### Recommended:
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Network: Stable broadband connection

## 🎯 Next Steps

### Optional Features:

1. **OpenAI Integration** (AI-powered features):
   - Get API key from: https://platform.openai.com/
   - Add to `backend/.env`: `OPENAI_API_KEY=sk-...`

2. **Production Deployment**:
   - Set `NODE_ENV=production`
   - Build frontend: `cd frontend && npm run build`
   - Use PM2 for process management
   - Configure reverse proxy (Nginx/Apache)

3. **Backup Strategy**:
   - MongoDB: Use `mongodump` for backups
   - MinIO: Copy `C:\minio\data` directory
   - Automate backups with scheduled tasks

## 📞 Support

If you face any issues:
1. Check the error messages in terminal
2. Verify all services are running (MongoDB, MinIO, Backend, Frontend)
3. Check environment variables are correctly set
4. Ensure ports 3000, 5000, 9000, 27017 are not blocked by firewall

## 🎉 Success!

If everything is working:
- ✅ MongoDB is storing all data locally
- ✅ MinIO is storing all files locally
- ✅ No cloud services or fees required
- ✅ Full control over your data

Enjoy your self-hosted InstaTube! 🚀
