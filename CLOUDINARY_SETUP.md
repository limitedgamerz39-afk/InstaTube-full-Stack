# ☁️ Cloudinary Setup Guide

## Why Do You Need Cloudinary?

Cloudinary is a cloud-based service for storing and serving images/videos. InstaTube uses it to:
- Store user profile pictures
- Store post images and videos
- Store story media
- Optimize images automatically
- Serve media via CDN (fast loading)

---

## 🆓 Getting Free Cloudinary Account

### Step 1: Sign Up
1. Go to: **https://cloudinary.com/users/register_free**
2. Fill in your details:
   - Email
   - Password
   - Choose "Developer" as your role
3. Verify your email

### Step 2: Get Your Credentials
After signing up, you'll be taken to the **Dashboard**:

1. You'll see a section called **"Account Details"** or **"Product Environment Credentials"**
2. Copy these three values:
   - **Cloud Name** (e.g., `dxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

**Screenshot locations:**
```
Dashboard → Account Details
├── Cloud Name: dxxxxxx
├── API Key: 123456789012345
└── API Secret: [Show/Hide] abcdefghijklmnopqrstuvwxyz
```

### Step 3: Add to Your .env File

Open `backend/.env` and add:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dgl9hs1lj
CLOUDINARY_API_KEY=959923823129428
CLOUDINARY_API_SECRET=TzGdBpCzrAbzG0KfppOLEBVtNaQ
```

### Step 4: Restart Your Server

```bash
cd backend
npm start
```

You should see:
```
✅ Cloudinary configured successfully!
```

---

## 🚀 Alternative: Run Without Cloudinary (Testing Only)

If you want to test the app without file uploads:

1. Make sure you have at least these in `.env`:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key_here
   ```

2. The server will now start with a warning:
   ```
   ⚠️  Cloudinary not configured - file uploads will be disabled
   ```

3. You can still:
   - ✅ Sign up / Login
   - ✅ Follow users
   - ✅ Like posts
   - ✅ Comment
   - ✅ Send messages
   - ❌ Upload images/videos (will show error)

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep your API Secret private
- Add `.env` to `.gitignore` (already done)
- Use different credentials for development/production
- Regenerate secrets if exposed

### ❌ DON'T:
- Commit `.env` to Git
- Share credentials publicly
- Use production credentials in development
- Hardcode credentials in your code

---

## 📊 Cloudinary Free Tier Limits

The free plan includes:
- ✅ **25 GB** storage
- ✅ **25 GB** bandwidth/month
- ✅ **25,000** transformations/month
- ✅ Unlimited image/video uploads

This is **more than enough** for development and small projects!

---

## 🛠️ Troubleshooting

### Error: "Cloudinary API Key is not set"
**Solution:** Make sure you've added all three credentials to `.env`

### Error: "Invalid credentials"
**Solution:** 
1. Double-check you copied the credentials correctly
2. No extra spaces or quotes
3. Make sure you're using the right account

### Error: "Upload failed"
**Solutions:**
1. Check your internet connection
2. Verify file size is under 5MB
3. Ensure file is an image or video
4. Check Cloudinary dashboard for quota limits

### Server won't start
**Solution:** 
1. Make sure you have `MONGO_URI` and `JWT_SECRET` in `.env`
2. These are now required, Cloudinary is optional

---

## 🔄 Alternative: Use Local Storage (Advanced)

If you don't want to use Cloudinary, you can modify the code to store files locally:

1. **Install packages:**
   ```bash
   npm install multer
   ```

2. **Update `backend/config/cloudinary.js`** to use local storage:
   ```javascript
   const storage = multer.diskStorage({
     destination: (req, file, cb) => {
       cb(null, 'uploads/');
     },
     filename: (req, file, cb) => {
       cb(null, Date.now() + '-' + file.originalname);
     },
   });
   ```

3. **Create uploads folder:**
   ```bash
   mkdir backend/uploads
   ```

4. **Serve static files in server.js:**
   ```javascript
   app.use('/uploads', express.static('uploads'));
   ```

⚠️ **Note:** Local storage is not recommended for production. Use cloud storage instead.

---

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformation Guide](https://cloudinary.com/documentation/image_transformations)

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Server starts without errors
- [ ] Can upload profile picture
- [ ] Can create a post with image
- [ ] Can create a story
- [ ] Images load in the app
- [ ] Check Cloudinary dashboard for uploads

---

## 🆘 Still Having Issues?

1. **Check environment variables:**
   ```bash
   cd backend
   node -e "require('dotenv').config(); console.log(process.env.CLOUDINARY_CLOUD_NAME)"
   ```

2. **Test Cloudinary connection:**
   ```bash
   node test-cloudinary.js
   ```

3. **Review server logs** for specific error messages

4. **Contact support** if credentials aren't working

---

**Happy coding! 🎉**
