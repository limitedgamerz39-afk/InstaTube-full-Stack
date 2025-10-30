# InstaTube Deployment Guide

## Recommended: Render (Backend) + Netlify (Frontend)

This guide covers deploying your InstaTube app with Socket.io support.

---

## 🚀 Part 1: Deploy Backend to Render

### Why Render?
- ✅ Free tier available
- ✅ Full WebSocket/Socket.io support
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS

### Steps:

1. **Push Your Code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your InstaTube repo

4. **Configure Build Settings**
   - **Name**: `instatube-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variables**
   Click "Environment" and add:
   ```
   NODE_ENV=production
   MONGO_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<your-jwt-secret>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Note your backend URL: `https://instatube-backend.onrender.com`

---

## 🎨 Part 2: Deploy Frontend to Netlify

### Steps:

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your InstaTube repository

3. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

4. **Add Environment Variables**
   Go to "Site configuration" → "Environment variables":
   ```
   VITE_API_URL=https://instatube-backend.onrender.com/api
   VITE_SOCKET_URL=https://instatube-backend.onrender.com
   ```
   ⚠️ **Important**: Replace with your actual Render backend URL from Part 1

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at: `https://your-site-name.netlify.app`

---

## 🔧 Update Backend CORS

After deploying frontend, update your backend CORS to allow the Netlify domain:

1. Go to your Render dashboard
2. Open your backend service
3. Go to "Environment" tab
4. Add environment variable:
   ```
   FRONTEND_URL=https://your-site-name.netlify.app
   ```

Or manually update `backend/server.js` to include your Netlify URL in the `allowedOrigins` array.

---

## 📱 Custom Domain (Optional)

### For Netlify Frontend:
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration steps

### For Render Backend:
1. Go to "Settings" → "Custom Domain"
2. Add your domain
3. Configure DNS records

---

## ✅ Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is deployed on Netlify
- [ ] Environment variables are set correctly
- [ ] CORS allows Netlify domain
- [ ] Test user registration
- [ ] Test login
- [ ] Test post creation
- [ ] Test real-time features (messages, notifications)
- [ ] Test Socket.io connection (check browser console)

---

## 🐛 Troubleshooting

### Socket.io Not Connecting
- Check backend URL in `VITE_SOCKET_URL`
- Verify CORS settings include your Netlify domain
- Check browser console for connection errors
- Ensure Render service is running (free tier may sleep after inactivity)

### Images Not Uploading
- Verify Cloudinary credentials in Render environment variables
- Check file size limits (max 10MB configured)

### 404 Errors on Frontend Routes
- Ensure `netlify.toml` redirects are configured
- Redeploy if needed

### Database Connection Issues
- Whitelist Render's IP in MongoDB Atlas (or use 0.0.0.0/0)
- Verify MONGO_URI is correct

---

## 💰 Free Tier Limitations

### Render Free Tier:
- Services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month (enough for one service)

**Solution**: Use a free uptime monitoring service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 10 minutes to keep it awake.

### Netlify Free Tier:
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites

---

## 🚀 Alternative: Deploy to Railway

If you prefer Railway over Render:

1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Set root directory to `backend`
5. Add same environment variables
6. Railway auto-detects Node.js and deploys

Railway provides $5 free credit monthly.

---

## 📝 Notes

- **MongoDB Atlas**: Make sure to whitelist `0.0.0.0/0` (all IPs) in Network Access for cloud deployments
- **Cloudinary**: Free tier: 25GB storage, 25GB bandwidth/month
- **Auto-deploy**: Both Render and Netlify support auto-deploy on git push

---

## 🎯 Quick Deploy Summary

```bash
# 1. Deploy Backend to Render
# - Connect GitHub repo
# - Set root directory: backend
# - Add environment variables
# - Deploy

# 2. Deploy Frontend to Netlify
# - Connect GitHub repo
# - Set base directory: frontend
# - Add VITE_API_URL and VITE_SOCKET_URL
# - Deploy

# 3. Update backend CORS with Netlify URL
# 4. Test all features
# 5. Done! 🎉
```

Your InstaTube app is now live with full Socket.io support!
