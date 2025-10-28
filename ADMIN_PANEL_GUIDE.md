
# 🔐 Admin Panel Guide

## Overview
Complete Admin Panel for InstaTube with dashboard, user management, and post moderation capabilities.

## Features

### ✅ Implemented Features

#### 1. **Admin Dashboard** (`/admin`)
- **Statistics Overview**
  - Total Users
  - Total Posts
  - Total Messages
  - Total Stories
  - Active Users (24h)
  - New Users Today
  - New Posts Today

- **Quick Actions**
  - Navigate to User Management
  - Navigate to Post Management
  - Navigate to Reports

#### 2. **User Management** (`/admin/users`)
- **View All Users**
  - Paginated list (20 users per page)
  - Display user info: avatar, name, username, email
  - Show user role and status
  - Display stats: posts count, followers count

- **Search Users**
  - Search by username, name, or email
  - Real-time search functionality

- **User Actions**
  - ✅ **Verify/Unverify User** - Add or remove blue checkmark
  - 🔒 **Ban/Unban User** - Restrict user access
  - 🛡️ **Change User Role** - Change between user/creator/business/admin
  - 🗑️ **Delete User** - Permanently delete user and all their content
  - 👤 **View Profile** - Direct link to user profile

- **User Roles**
  - `user` - Regular user (default)
  - `creator` - Content creator with extra features
  - `business` - Business account
  - `admin` - Full admin access

#### 3. **Post Management** (`/admin/posts`)
- **View All Posts**
  - Grid view with thumbnails
  - Paginated list (20 posts per page)
  - Display post info: media, caption, user
  - Show statistics: likes, comments

- **Search Posts**
  - Search by caption
  - Filter functionality

- **Post Actions**
  - 👁️ **View Post Details** - Click to see full post information
  - 🗑️ **Delete Post** - Remove inappropriate content
  - 📊 **View Statistics** - See likes and comments count
  - 👤 **View Author** - Link to post creator

- **Post Details Modal**
  - Full media display (images/videos)
  - Complete caption
  - User information
  - Post statistics
  - Post ID and timestamp
  - Delete action

#### 4. **Reports Management** (`/admin/reports`)
- Coming soon feature
- Will handle user-reported content
- Review and take action on reports

## Access Control

### Admin Access
Only users with `role: 'admin'` can access the admin panel.

### Security Features
- Protected routes with authentication
- Role-based access control (RBAC)
- JWT token validation
- Admin-only middleware on backend

## Backend API Endpoints

All admin endpoints require authentication and admin role:

```
GET    /api/admin/stats                    - Dashboard statistics
GET    /api/admin/users?page=1&limit=20    - Get all users
DELETE /api/admin/users/:userId            - Delete user
PUT    /api/admin/users/:userId/ban        - Toggle ban status
PUT    /api/admin/users/:userId/verify     - Toggle verification
PUT    /api/admin/users/:userId/role       - Change user role
GET    /api/admin/posts?page=1&limit=20    - Get all posts
DELETE /api/admin/posts/:postId            - Delete post
GET    /api/admin/reports                  - Get reported content
GET    /api/admin/search?query=x&type=y    - Search users/posts
```

## How to Access Admin Panel

### 1. Make Your Account Admin
Connect to MongoDB and update your user role:

```javascript
// Using MongoDB Compass or mongosh
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

Or use the MongoDB Node.js script:

```bash
cd backend
node scripts/makeUserAdmin.js your-email@example.com
```

### 2. Access the Admin Panel
After logging in with an admin account:

1. **Via Settings Page**
   - Go to Settings (`/settings`)
   - Click on "Admin Panel" button (visible only to admins)

2. **Direct URL**
   - Navigate to `/admin` in your browser

## UI/UX Features

### Design
- Modern, clean interface
- Dark mode support
- Responsive design (mobile-friendly)
- Consistent with main app design

### Navigation
- Back to main app button
- Breadcrumb navigation
- Quick action cards
- Easy access to all sections

### User Experience
- Loading states
- Empty states with helpful messages
- Confirmation dialogs for destructive actions
- Toast notifications for all actions
- Pagination for large datasets
- Search functionality

## Color Coding

### User Roles
- 🔴 **Admin** - Red badge
- 🟣 **Creator** - Purple badge
- 🔵 **Business** - Blue badge
- ⚪ **User** - Gray badge

### User Status
- 🟢 **Active** - Green badge
- 🔴 **Banned** - Red badge

### Action Buttons
- 🔵 **Verify** - Blue icon
- 🟣 **Role** - Purple icon
- 🟡 **Ban** - Yellow icon
- 🟢 **Unban** - Green icon
- 🔴 **Delete** - Red icon

## Statistics Explained

### Dashboard Metrics

1. **Total Users** - All registered users
2. **Total Posts** - All posts created
3. **Total Messages** - All messages sent
4. **Total Stories** - All stories posted
5. **Active Users (24h)** - Users active in last 24 hours
6. **New Users Today** - Users registered today
7. **New Posts Today** - Posts created today

## User Management Operations

### Verify User
- Adds blue checkmark to user profile
- Sets `isVerified: true`
- Records `verifiedAt` timestamp
- Visible to all users

### Ban User
- Prevents user from accessing the platform
- Sets `isBanned: true`
- Records `bannedAt` timestamp
- Can be reversed (unban)

### Change Role
- Upgrades or downgrades user permissions
- Available roles: user, creator, business, admin
- **Warning:** Be careful when assigning admin role!

### Delete User
- **Permanent action** - Cannot be undone
- Deletes user account
- Deletes all user's posts
- Deletes all user's messages
- Confirmation required

## Post Management Operations

### View Post Details
- Click on any post card to see full details
- View all media files
- See complete caption
- Check statistics
- View author information

### Delete Post
- Removes post from database
- Removes from user's posts array
- Deletes associated media from storage
- **Permanent action** - Cannot be undone
- Confirmation required

## Security Best Practices

### Admin Account Security
1. Use strong passwords for admin accounts
2. Never share admin credentials
3. Regularly review admin activity logs
4. Limit number of admin accounts
5. Use two-factor authentication (when implemented)

### Content Moderation
1. Review reported content regularly
2. Document reasons for user bans
3. Keep records of deleted content
4. Follow community guidelines
5. Be fair and consistent

## Troubleshooting

### Can't Access Admin Panel?
1. Check if your user has `role: 'admin'`
2. Clear browser cache and cookies
3. Logout and login again
4. Check browser console for errors

### Admin Routes Not Working?
1. Verify backend server is running
2. Check if admin routes are registered
3. Verify JWT token is valid
4. Check adminMiddleware is working

### API Errors?
1. Check backend logs
2. Verify MongoDB connection
3. Check if user is authenticated
4. Verify admin permissions

## Future Enhancements

### Planned Features
- [ ] Reports management system
- [ ] Analytics and charts
- [ ] Bulk actions (ban multiple users)
- [ ] Export data functionality
- [ ] Admin activity logs
- [ ] Advanced search filters
- [ ] Content moderation AI
- [ ] Email notifications
- [ ] Scheduled actions
- [ ] Custom admin roles
- [ ] Two-factor authentication
- [ ] IP blocking
- [ ] Content review queue

## Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- React Icons
- React Hot Toast
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Middleware-based authorization

## File Structure

```
frontend/src/
├── pages/
│   ├── AdminDashboard.jsx    # Main admin dashboard
│   ├── AdminUsers.jsx         # User management
│   ├── AdminPosts.jsx         # Post management
│   └── AdminReports.jsx       # Reports (coming soon)
├── services/
│   └── adminAPI.js            # Admin API service
└── App.jsx                    # Routes configuration

backend/
├── controllers/
│   └── adminController.js     # Admin controllers
├── routes/
│   └── adminRoutes.js         # Admin routes
└── middleware/
    └── adminMiddleware.js     # Admin authorization
```

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console
4. Contact system administrator

## License

This admin panel is part of InstaTube application.

---

**Last Updated:** December 2024
**Version:** 1.0.0
