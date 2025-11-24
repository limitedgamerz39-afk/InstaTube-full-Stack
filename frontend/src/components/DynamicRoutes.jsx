import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import DynamicRoute from './DynamicRoute';
import AppLoader from './AppLoader';

// Dynamically import all page components
const pageComponents = {
  // Auth pages
  Login: lazy(() => import('../pages/Login')),
  Signup: lazy(() => import('../pages/Signup')),
  
  // Main pages
  Feed: lazy(() => import('../pages/Feed')),
  SimpleFeed: lazy(() => import('../pages/SimpleFeed')),
  Upload: lazy(() => import('../pages/Upload')),
  Profile: lazy(() => import('../pages/Profile')),
  Search: lazy(() => import('../pages/Search')),
  Notifications: lazy(() => import('../pages/Notifications')),
  Settings: lazy(() => import('../pages/Settings')),
  Messages: lazy(() => import('../pages/Messages')),
  Chat: lazy(() => import('../pages/Chat')),
  Groups: lazy(() => import('../pages/Groups')),
  CreateStory: lazy(() => import('../pages/CreateStory')),
  StoryViewer: lazy(() => import('../pages/StoryViewer')),
  Saved: lazy(() => import('../pages/Saved')),
  Archive: lazy(() => import('../pages/Archive')),
  Explore: lazy(() => import('../pages/Explore')),
  Hashtag: lazy(() => import('../pages/Hashtag')),
  Reels: lazy(() => import('../pages/Reels')),
  Videos: lazy(() => import('../pages/Videos')),
  Premium: lazy(() => import('../pages/Premium')),
  CreatorDashboard: lazy(() => import('../pages/CreatorDashboard')),
  VideoCall: lazy(() => import('../pages/VideoCall')),
  AudioCall: lazy(() => import('../pages/AudioCall')),
  Analytics: lazy(() => import('../pages/Analytics')),
  GroupChat: lazy(() => import('../pages/GroupChat')),
  LiveStream: lazy(() => import('../pages/LiveStream')),
  CloseFriends: lazy(() => import('../pages/CloseFriends')),
  SchedulePost: lazy(() => import('../pages/SchedulePost')),
  AdminDashboard: lazy(() => import('../pages/AdminDashboard')),
  AdminAnalytics: lazy(() => import('../pages/AdminAnalytics')),
  AdminUsers: lazy(() => import('../pages/AdminUsers')),
  AdminPosts: lazy(() => import('../pages/AdminPosts')),
  AdminReports: lazy(() => import('../pages/AdminReports')),
  AdminSecurity: lazy(() => import('../pages/AdminSecurity')),
  Playlists: lazy(() => import('../pages/Playlists')),
  WatchLater: lazy(() => import('../pages/WatchLater')),
  Community: lazy(() => import('../pages/Community')),
  Trending: lazy(() => import('../pages/Trending')),
  StoryHighlights: lazy(() => import('../pages/StoryHighlights')),
  Achievements: lazy(() => import('../pages/Achievements')),
  BusinessDashboard: lazy(() => import('../pages/BusinessDashboard')),
  BusinessProfile: lazy(() => import('../pages/BusinessProfile')),
  PostDetail: lazy(() => import('../pages/PostDetail'))
};

const DynamicRoutes = ({ setMobileSidebarOpen }) => {
  const routes = [
    // Public routes
    {
      path: '/login',
      component: 'Login',
      requiresAuth: false,
      layout: 'minimal',
      title: 'Login - D4D HUB'
    },
    {
      path: '/register',
      component: 'Signup',
      requiresAuth: false,
      layout: 'minimal',
      title: 'Sign Up - D4D HUB'
    },
    {
      path: '/verify-email',
      component: 'Signup',
      requiresAuth: false,
      layout: 'minimal',
      title: 'Verify Email - D4D HUB'
    },
    
    // Protected routes
    {
      path: '/',
      component: 'Feed',
      requiresAuth: true,
      title: 'Home - D4D HUB'
    },
    {
      path: '/simple-feed',
      component: 'SimpleFeed',
      requiresAuth: true,
      title: 'Simple Feed - D4D HUB'
    },
    {
      path: '/upload',
      component: 'Upload',
      requiresAuth: true,
      title: 'Upload - D4D HUB'
    },
    {
      path: '/profile/:username',
      component: 'Profile',
      requiresAuth: true,
      title: 'Profile - D4D HUB'
    },
    {
      path: '/search',
      component: 'Search',
      requiresAuth: true,
      title: 'Search - D4D HUB'
    },
    {
      path: '/notifications',
      component: 'Notifications',
      requiresAuth: true,
      title: 'Notifications - D4D HUB'
    },
    {
      path: '/settings',
      component: 'Settings',
      requiresAuth: true,
      title: 'Settings - D4D HUB'
    },
    {
      path: '/saved',
      component: 'Saved',
      requiresAuth: true,
      title: 'Saved Posts - D4D HUB'
    },
    {
      path: '/archive',
      component: 'Archive',
      requiresAuth: true,
      title: 'Archive - D4D HUB'
    },
    {
      path: '/explore',
      component: 'Explore',
      requiresAuth: true,
      title: 'Explore - D4D HUB'
    },
    {
      path: '/explore/tags/:tag',
      component: 'Hashtag',
      requiresAuth: true,
      title: 'Hashtag - D4D HUB'
    },
    {
      path: '/reels',
      component: 'Reels',
      requiresAuth: true,
      title: 'Reels - D4D HUB'
    },
    {
      path: '/reels/:id',
      component: 'Reels',
      requiresAuth: true,
      title: 'Reels - D4D HUB'
    },
    {
      path: '/videos',
      component: 'Videos',
      requiresAuth: true,
      title: 'Videos - D4D HUB'
    },
    {
      path: '/watch/:videoId',
      component: 'Videos',
      requiresAuth: true,
      title: 'Watch Video - D4D HUB'
    },
    {
      path: '/post/:id',
      component: 'PostDetail',
      requiresAuth: true,
      title: 'Post Detail - D4D HUB'
    },
    {
      path: '/premium',
      component: 'Premium',
      requiresAuth: true,
      title: 'Premium - D4D HUB'
    },
    {
      path: '/creator',
      component: 'CreatorDashboard',
      requiresAuth: true,
      requiredRole: 'creator',
      title: 'Creator Dashboard - D4D HUB'
    },
    {
      path: '/video-call/:roomId',
      component: 'VideoCall',
      requiresAuth: true,
      title: 'Video Call - D4D HUB'
    },
    {
      path: '/audio-call/:roomId',
      component: 'AudioCall',
      requiresAuth: true,
      title: 'Audio Call - D4D HUB'
    },
    {
      path: '/analytics',
      component: 'Analytics',
      requiresAuth: true,
      title: 'Analytics - D4D HUB'
    },
    {
      path: '/group/:groupId',
      component: 'GroupChat',
      requiresAuth: true,
      title: 'Group Chat - D4D HUB'
    },
    {
      path: '/live/:streamId',
      component: 'LiveStream',
      requiresAuth: true,
      title: 'Live Stream - D4D HUB'
    },
    {
      path: '/close-friends',
      component: 'CloseFriends',
      requiresAuth: true,
      title: 'Close Friends - D4D HUB'
    },
    {
      path: '/schedule',
      component: 'SchedulePost',
      requiresAuth: true,
      title: 'Schedule Post - D4D HUB'
    },
    {
      path: '/messages',
      component: 'Messages',
      requiresAuth: true,
      title: 'Messages - D4D HUB'
    },
    {
      path: '/groups',
      component: 'Groups',
      requiresAuth: true,
      title: 'Groups - D4D HUB'
    },
    {
      path: '/messages/:username',
      component: 'Chat',
      requiresAuth: true,
      layout: 'chat',
      title: 'Chat - D4D HUB'
    },
    {
      path: '/stories/create',
      component: 'CreateStory',
      requiresAuth: true,
      layout: 'story',
      title: 'Create Story - D4D HUB'
    },
    {
      path: '/stories/:userId',
      component: 'StoryViewer',
      requiresAuth: true,
      layout: 'story',
      title: 'Story Viewer - D4D HUB'
    },
    {
      path: '/highlights/:highlightId',
      component: 'StoryHighlights',
      requiresAuth: true,
      title: 'Story Highlights - D4D HUB'
    },
    
    // Admin routes
    {
      path: '/admin',
      component: 'AdminDashboard',
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin Dashboard - D4D HUB'
    },
    {
      path: '/admin/analytics',
      component: 'AdminAnalytics',
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin Analytics - D4D HUB'
    },
    {
      path: '/admin/users',
      component: 'AdminUsers',
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin Users - D4D HUB'
    },
    {
      path: '/admin/posts',
      component: 'AdminPosts',
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin Posts - D4D HUB'
    },
    {
      path: '/admin/reports',
      component: 'AdminReports',
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin Reports - D4D HUB'
    },
    {
      path: '/admin/security',
      component: 'AdminSecurity',
      requiresAuth: true,
      requiredRole: 'admin',
      title: 'Admin Security - D4D HUB'
    },
    
    // New features routes
    {
      path: '/playlists',
      component: 'Playlists',
      requiresAuth: true,
      title: 'Playlists - D4D HUB'
    },
    {
      path: '/playlists/:userId',
      component: 'Playlists',
      requiresAuth: true,
      title: 'User Playlists - D4D HUB'
    },
    {
      path: '/watch-later',
      component: 'WatchLater',
      requiresAuth: true,
      title: 'Watch Later - D4D HUB'
    },
    {
      path: '/community',
      component: 'Community',
      requiresAuth: true,
      title: 'Community - D4D HUB'
    },
    {
      path: '/community/:userId',
      component: 'Community',
      requiresAuth: true,
      title: 'User Community - D4D HUB'
    },
    {
      path: '/trending',
      component: 'Trending',
      requiresAuth: true,
      title: 'Trending - D4D HUB'
    },
    {
      path: '/achievements',
      component: 'Achievements',
      requiresAuth: true,
      title: 'Achievements - D4D HUB'
    },
    
    // Business routes
    {
      path: '/business/dashboard',
      component: 'BusinessDashboard',
      requiresAuth: true,
      requiredRole: 'business',
      title: 'Business Dashboard - D4D HUB'
    },
    {
      path: '/business/profile',
      component: 'BusinessProfile',
      requiresAuth: true,
      requiredRole: 'business',
      title: 'Business Profile - D4D HUB'
    }
  ];

  return (
    <Suspense fallback={<AppLoader />}>
      <Routes>
        {routes.map((route, index) => {
          const Component = pageComponents[route.component];
          if (!Component) {
            console.error(`Component ${route.component} not found for route ${route.path}`);
            return null;
          }
          
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <DynamicRoute
                  component={Component}
                  requiresAuth={route.requiresAuth}
                  requiredRole={route.requiredRole}
                  layout={route.layout}
                  title={route.title}
                  setMobileSidebarOpen={setMobileSidebarOpen}
                />
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default DynamicRoutes;