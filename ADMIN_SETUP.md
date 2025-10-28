# 🚀 Admin Panel Quick Setup Guide

## Step 1: Create Admin User

### Option A: Using Command Line Script (Recommended)

```bash
cd backend
node scripts/makeUserAdmin.js your-email@example.com
```

Or using username:
```bash
node scripts/makeUserAdmin.js your_username
```

### Option B: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Find the `users` collection
4. Find your user document
5. Edit the document and set `role: "admin"`
6. Save changes

### Option C: Using MongoDB Shell (mongosh)

```javascript
// Connect to your database
mongosh "your-connection-string"

// Switch to your database
use instaTube

// Update user role to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Option D: Using Node.js Script

Create a file `makeAdmin.js`:

```javascript
import mongoose from 'mongoose';
import User from './models/User.js';

const MONGO_URI = 'your-mongodb-uri';
const USER_EMAIL = 'your-email@example.com';

mongoose.connect(MONGO_URI).then(async () => {
  const user = await User.findOne({ email: USER_EMAIL });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log('✅ User is now admin!');
  }
  process.exit(0);
});
```

Run it:
```bash
node makeAdmin.js
```

## Step 2: Verify Admin Access

### List All Admins
```bash
cd backend
node scripts/listAdmins.js
```

This will show all users with admin role.

## Step 3: Access Admin Panel

1. **Login** to your account with admin credentials
2. **Navigate** to Settings page (`/settings`)
3. **Click** on "Admin Panel" button (red/pink gradient button)
4. Or directly go to: `http://localhost:5173/admin`

## Step 4: Explore Admin Features

### Dashboard
- View overall statistics
- See active users
- Monitor new registrations
- Track content creation

### User Management
- View all users
- Search for specific users
- Verify users (add blue checkmark)
- Ban/Unban users
- Change user roles
- Delete users (careful!)

### Post Management
- View all posts
- Search posts
- View post details
- Delete inappropriate content

## Admin Routes

```
/admin              - Main dashboard
/admin/users        - User management
/admin/posts        - Post management  
/admin/reports      - Reports (coming soon)
```

## Testing Admin Functions

### Test User Verification
1. Go to `/admin/users`
2. Find a test user
3. Click the verify button (blue checkmark icon)
4. User should now have verified badge

### Test User Ban
1. Go to `/admin/users`
2. Find a test user
3. Click the ban button (yellow X icon)
4. User status should change to "Banned"

### Test Post Deletion
1. Go to `/admin/posts`
2. Click on any post to view details
3. Click "Delete Post" button
4. Confirm deletion
5. Post should be removed

## Common Issues

### Issue: "Access Denied" Error
**Solution:** 
- Verify user role is set to "admin" in database
- Logout and login again
- Clear browser cache

### Issue: Admin Panel Button Not Showing
**Solution:**
- Check if user role is "admin"
- Refresh the page
- Check browser console for errors

### Issue: API Errors (403/401)
**Solution:**
- Verify backend server is running
- Check if adminMiddleware is working
- Verify JWT token is valid
- Check backend logs

## Security Checklist

- [ ] Use strong password for admin accounts
- [ ] Don't share admin credentials
- [ ] Limit number of admin users
- [ ] Regularly review admin actions
- [ ] Keep admin privileges confidential
- [ ] Monitor suspicious activities
- [ ] Document all admin actions

## Quick Commands

```bash
# Make user admin
node scripts/makeUserAdmin.js user@example.com

# List all admins
node scripts/listAdmins.js

# Start backend server
cd backend
npm run dev

# Start frontend server
cd frontend
npm run dev
```

## Admin Roles Hierarchy

```
admin     - Full access to everything
creator   - Extra features for content creation
business  - Business account features
user      - Regular user (default)
```

## Next Steps

1. ✅ Create admin user
2. ✅ Login with admin account
3. ✅ Access admin panel
4. ✅ Explore dashboard
5. ✅ Test user management
6. ✅ Test post moderation
7. ✅ Review documentation

## Need Help?

- Read full documentation: [ADMIN_PANEL_GUIDE.md](ADMIN_PANEL_GUIDE.md)
- Check backend logs for errors
- Review browser console for frontend errors
- Verify MongoDB connection

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Running InstaTube app with MongoDB

Good luck with your admin panel! 🎉
