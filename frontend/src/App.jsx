import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { VideoProvider } from './context/VideoContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import socketService from './services/socket';
import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import AppLoader from './components/AppLoader';
import CookieConsent from './components/CookieConsent';
import TwoFactorAuth from './components/TwoFactorAuth';
import { AiOutlineMenu, AiOutlineSearch } from 'react-icons/ai';
import { BsCameraReelsFill } from 'react-icons/bs';
import { FiMail, FiPhone, FiClock } from 'react-icons/fi';

// Unified Header Component
const UnifiedHeader = ({ setMobileSidebarOpen }) => {
  return <Navbar setMobileSidebarOpen={setMobileSidebarOpen} />;
};

// Layout wrapper component
const AppLayout = ({ children, showBottomNav = true, showNavbar = true, mobileSidebarOpen, setMobileSidebarOpen }) => {
  return (
    <div className="min-h-screen">
      {/* Unified Header - only show if showNavbar is true */}
      {showNavbar && (
        <UnifiedHeader mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} />
      )}
      
      {/* Main content with mobile padding and top offset for fixed header */}
      <div id="main-content" className={`${showNavbar ? 'pt-0 md:pt-0' : 'pt-0'} px-0 sm:px-2 md:px-4 ${showBottomNav ? 'pb-20 md:pb-0' : ''}`}>
        {children}
      </div>
      
      {/* Mobile Bottom Nav - only visible on mobile */}
      {showBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <BottomNav />
        </div>
      )}
    </div>
  );
};

// Pages (lazy-loaded)
const Hashtag = lazy(() => import('./pages/Hashtag'));
const AuthForm = lazy(() => import('./components/AuthForm'));
const Feed = lazy(() => import('./pages/Feed'));
const NewUpload = lazy(() => import('./pages/NewUpload'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const StoryHighlights = lazy(() => import('./pages/StoryHighlights'));
const StoryViewer = lazy(() => import('./pages/StoryViewer'));
const Trending = lazy(() => import('./pages/Trending'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Videos = lazy(() => import('./pages/Videos'));
const WatchLater = lazy(() => import('./pages/WatchLater'));
const WatchPage = lazy(() => import('./pages/WatchPage'));
const Premium = lazy(() => import('./pages/Premium'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const Explore = lazy(() => import('./pages/Explore'));
const Reels = lazy(() => import('./pages/Reels'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const AudioCall = lazy(() => import('./pages/AudioCall'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Archive = lazy(() => import('./pages/Archive'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const LiveStream = lazy(() => import('./pages/LiveStream'));
const Messages = lazy(() => import('./pages/Messages'));
const Chat = lazy(() => import('./pages/Chat'));
const CloseFriends = lazy(() => import('./pages/CloseFriends'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const Groups = lazy(() => import('./pages/Groups'));
const Saved = lazy(() => import('./pages/Saved'));
const SchedulePost = lazy(() => import('./pages/SchedulePost'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminPosts = lazy(() => import('./pages/AdminPosts'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminSecurity = lazy(() => import('./pages/AdminSecurity'));
const AdminAuditLog = lazy(() => import('./pages/AdminAuditLog'));
const Playlists = lazy(() => import('./pages/Playlists'));
const Community = lazy(() => import('./pages/Community'));
const Achievements = lazy(() => import('./pages/Achievements'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const History = lazy(() => import('./pages/History'));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const MobileShorts = lazy(() => import('./pages/MobileShorts'));
const AdShowcase = lazy(() => import('./pages/AdShowcase'));

// New pages for role-based access
const CreatorStudio = lazy(() => import('./pages/CreatorStudio'));
const Earnings = lazy(() => import('./pages/Earnings'));
const MyContent = lazy(() => import('./pages/MyContent'));
const BusinessAnalytics = lazy(() => import('./pages/BusinessAnalytics'));

function AppContent() {
  const { requires2FA } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const oscRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const vibrateIntervalRef = useRef(null);
  const [ringMuted, setRingMuted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ringMuted') || 'false'); } catch { return false; }
  });
  const [ringVolume, setRingVolume] = useState(() => {
    try { const v = parseFloat(localStorage.getItem('ringVolume') || '0.2'); return isNaN(v) ? 0.2 : Math.min(Math.max(v, 0), 1); } catch { return 0.2; }
  });

  const startRingtone = () => {
    try {
      if (audioCtxRef.current) return; // already ringing
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || ringMuted) return;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioCtxRef.current = ctx;
      gainRef.current = gain;
      oscRef.current = osc;
      ringIntervalRef.current = setInterval(() => {
        if (!gainRef.current) return;
        const v = gainRef.current.gain.value;
        gainRef.current.gain.value = v > 0 ? 0 : ringVolume;
      }, 500);
    } catch (e) {
      // ignore ringtone errors
    }
  };

  const stopRingtone = () => {
    try {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.gain.value = 0;
      }
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch {}
        oscRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
    } catch (e) {
      // ignore
    }
  };
  
  const startVibrate = () => {
    try {
      // Check if vibration API is available
      if (ringMuted || !('vibrate' in navigator)) return;
      
      // Only vibrate if the document is visible
      if (document.visibilityState === 'visible') {
        // Check if the user has interacted with the document
        // We'll only vibrate if there's been some user interaction
        const hasUserInteracted = sessionStorage.getItem('userInteracted') === 'true';
        if (hasUserInteracted) {
          try {
            // Try to vibrate, but catch any errors silently
            const success = navigator.vibrate([300, 200, 300]);
            if (success) {
              vibrateIntervalRef.current = setInterval(() => {
                if (document.visibilityState === 'visible') {
                  try {
                    navigator.vibrate([300, 200, 300]);
                  } catch (vibrateError) {
                    console.debug('Vibration failed during interval (expected in some contexts):', vibrateError);
                    // Stop the interval if vibration fails
                    if (vibrateIntervalRef.current) {
                      clearInterval(vibrateIntervalRef.current);
                      vibrateIntervalRef.current = null;
                    }
                  }
                }
              }, 1500);
            }
          } catch (initialVibrateError) {
            console.debug('Initial vibration failed (expected before user interaction):', initialVibrateError);
          }
        } else {
          console.debug('Skipping vibration - user has not interacted with the page yet');
        }
      }
    } catch (e) {
      console.debug('Vibration not supported or failed (this is normal in many contexts):', e);
    }
  };

  const stopVibrate = () => {
    try {
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
        vibrateIntervalRef.current = null;
      }
      // Only call vibrate if it's available and the user has interacted
      if ('vibrate' in navigator) {
        const hasUserInteracted = sessionStorage.getItem('userInteracted') === 'true';
        if (hasUserInteracted) {
          try {
            navigator.vibrate(0);
          } catch (e) {
            console.debug('Failed to stop vibration (this is normal in some contexts):', e);
          }
        }
      }
    } catch (e) {
      console.debug('Error stopping vibration (this is normal in some contexts):', e);
    }
  };
  
  useEffect(() => {
    // Set up user interaction tracking
    const handleUserInteraction = () => {
      sessionStorage.setItem('userInteracted', 'true');
      // Remove the event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('pointerdown', handleUserInteraction);
    };
    
    // Check if user has already interacted in this session
    const hasUserInteracted = sessionStorage.getItem('userInteracted') === 'true';
    
    // Add event listeners for user interaction if not already interacted
    if (!hasUserInteracted) {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      document.addEventListener('pointerdown', handleUserInteraction);
    }
    
    const handleCallInvite = (payload) => {
      setIncomingCall(payload);
      startRingtone();
      startVibrate();
    };
    const handleCallDecline = () => {
      setIncomingCall(null);
      stopRingtone();
      stopVibrate();
    };
    socketService.on('call:invite', handleCallInvite);
    socketService.on('call:decline', handleCallDecline);
    return () => {
      socketService.off('call:invite', handleCallInvite);
      socketService.off('call:decline', handleCallDecline);
      stopRingtone();
      stopVibrate();
      // Clean up event listeners
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('pointerdown', handleUserInteraction);
    };
  }, []);
  
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Suspense fallback={<AppLoader />}>
          {requires2FA ? (
            <TwoFactorAuth />
          ) : (
            <>
              <div className="flex flex-col min-h-screen">
                {/* Main content area */}
                <div className="flex flex-1">
                  {/* Main content - full width on mobile, with sidebar on desktop */}
                  <div className="flex-1">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/auth" element={<AuthForm />} />
                      
                      {/* Protected Routes */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Feed />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                   
                      
                      <Route
                        path="/upload"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <NewUpload />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/profile/:username"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Profile />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/search"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Search />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Notifications />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Settings />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/saved"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Saved />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/archive"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Archive />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/explore"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Explore />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/explore/tags/:tag"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Hashtag />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/reels"
                        element={
                          <ProtectedRoute>
                            <AppLayout showNavbar={false}>
                              <Reels />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/reels/:id"
                        element={
                          <ProtectedRoute>
                            <AppLayout showNavbar={false} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Reels />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/shorts/mobile"
                        element={
                          <ProtectedRoute>
                            <AppLayout showNavbar={false} showBottomNav={false}>
                              <MobileShorts />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/videos"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Videos />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/watch/:videoId"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <WatchPage />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/post/:id"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <PostDetail />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/premium"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Premium />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/creator"
                        element={
                          <ProtectedRoute requiredRole="creator">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <CreatorDashboard />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/video-call/:roomId"
                        element={
                          <ProtectedRoute>
                            <AppLayout showBottomNav={false} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <VideoCall />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/audio-call/:roomId"
                        element={
                          <ProtectedRoute>
                            <AppLayout showBottomNav={false} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AudioCall />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Analytics />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/group/:groupId"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <GroupChat />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/live/:streamId"
                        element={
                          <ProtectedRoute>
                            <AppLayout showBottomNav={false} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <LiveStream />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/close-friends"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <CloseFriends />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/schedule"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <SchedulePost />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/history"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <History />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/messages"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Messages />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/groups"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Groups />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/subscriptions"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Subscriptions />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/messages/:username"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Chat />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/stories/create"
                        element={
                          <ProtectedRoute>
                            <AppLayout showBottomNav={false} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <CreateStory />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/stories/:userId"
                        element={
                          <ProtectedRoute>
                            <AppLayout showNavbar={false} showBottomNav={false} mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <StoryViewer />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/highlights/:highlightId"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <StoryHighlights />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminDashboard />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/admin/analytics"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminAnalytics />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminUsers />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/admin/posts"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminPosts />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/admin/reports"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminReports />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/admin/security"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminSecurity />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/admin/audit-log"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdminAuditLog />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* New Features Routes */}
                      <Route
                        path="/playlists"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Playlists />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/playlists/:userId"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Playlists />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/watch-later"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <WatchLater />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/community"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Community />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/community/:userId"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Community />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/trending"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Trending />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/achievements"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Achievements />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/help"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <HelpCenter />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/contact"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <div className="max-w-4xl mx-auto px-4 py-8">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Contact Support</h1>
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Get in Touch</h2>
                                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Our support team is available 24/7 to assist you with any questions or issues you may have.
                                      </p>
                                      
                                      <div className="space-y-4">
                                        <div className="flex items-start">
                                          <FiMail className="w-5 h-5 text-purple-500 mt-1 mr-3" />
                                          <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">Email Support</h3>
                                            <p className="text-gray-600 dark:text-gray-400">support@d4dhub.com</p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                          <FiPhone className="w-5 h-5 text-purple-500 mt-1 mr-3" />
                                          <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">Phone Support</h3>
                                            <p className="text-gray-600 dark:text-gray-400">+1 (800) 123-4567</p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                          <FiClock className="w-5 h-5 text-purple-500 mt-1 mr-3" />
                                          <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">Hours</h3>
                                            <p className="text-gray-600 dark:text-gray-400">24/7 Support Available</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Send a Message</h2>
                                      <form className="space-y-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                          <input 
                                            type="text" 
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="What is this regarding?"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                          <textarea 
                                            rows="4"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Describe your issue or question..."
                                          ></textarea>
                                        </div>
                                        
                                        <button 
                                          type="submit"
                                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                          Send Message
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/ads"
                        element={
                          <ProtectedRoute>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <AdShowcase />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Creator Routes */}
                      <Route
                        path="/creator-studio"
                        element={
                          <ProtectedRoute requiredRole={['creator', 'admin']}>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <CreatorStudio />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/earnings"
                        element={
                          <ProtectedRoute requiredRole={['creator', 'business', 'admin']}>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <Earnings />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/my-content"
                        element={
                          <ProtectedRoute requiredRole={['creator', 'admin']}>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <MyContent />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Business Routes */}
                      <Route
                        path="/business/analytics"
                        element={
                          <ProtectedRoute requiredRole={['business', 'admin']}>
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <BusinessAnalytics />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/business/dashboard"
                        element={
                          <ProtectedRoute requiredRole="business">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <BusinessDashboard />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route
                        path="/business/profile"
                        element={
                          <ProtectedRoute requiredRole="business">
                            <AppLayout mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen}>
                              <BusinessProfile />
                            </AppLayout>
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Catch all - redirect to feed */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </>
          )}
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <VideoProvider>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          {/* Skip to content link for accessibility */}
          <a 
            href="#main-content" 
            className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:underline"
          >
            Skip to main content
          </a>
          
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          
          <AppContent />
          <CookieConsent />
        </Router>
      </VideoProvider>
    </AuthProvider>
  );
}

export default App;