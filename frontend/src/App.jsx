import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import socketService from './services/socket';
import { Suspense, lazy, useState, useEffect, useRef } from 'react';

// Pages (lazy-loaded)
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Feed = lazy(() => import('./pages/Feed'));
const Upload = lazy(() => import('./pages/Upload'));
const Profile = lazy(() => import('./pages/Profile'));
const Search = lazy(() => import('./pages/Search'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Messages = lazy(() => import('./pages/Messages'));
const Chat = lazy(() => import('./pages/Chat'));
const Groups = lazy(() => import('./pages/Groups'));
const CreateStory = lazy(() => import('./pages/CreateStory'));
const StoryViewer = lazy(() => import('./pages/StoryViewer'));
const Saved = lazy(() => import('./pages/Saved'));
const Archive = lazy(() => import('./pages/Archive'));
const Explore = lazy(() => import('./pages/Explore'));
const Reels = lazy(() => import('./pages/Reels'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const AudioCall = lazy(() => import('./pages/AudioCall'));
const Analytics = lazy(() => import('./pages/Analytics'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const LiveStream = lazy(() => import('./pages/LiveStream'));
const CloseFriends = lazy(() => import('./pages/CloseFriends'));
const SchedulePost = lazy(() => import('./pages/SchedulePost'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminPosts = lazy(() => import('./pages/AdminPosts'));
const AdminReports = lazy(() => import('./pages/AdminReports'));

function App() {
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
      if (ringMuted) return;
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 200, 300]);
        vibrateIntervalRef.current = setInterval(() => navigator.vibrate([300, 200, 300]), 1500);
      }
    } catch {}
  };

  const stopVibrate = () => {
    try {
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
        vibrateIntervalRef.current = null;
      }
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    } catch {}
  };
  useEffect(() => {
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
    };
  }, []);
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

          <ErrorBoundary>
            <Suspense fallback={<div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading...</div>}>
              <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navbar />
                <Feed />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Navbar />
                <Upload />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <Navbar />
                <Profile />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Navbar />
                <Search />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Navbar />
                <Notifications />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Navbar />
                <Settings />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <Navbar />
                <Saved />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/archive"
            element={
              <ProtectedRoute>
                <Navbar />
                <Archive />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Navbar />
                <Explore />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/explore/tags/:tag"
            element={
              <ProtectedRoute>
                <Navbar />
                {(() => { const Hashtag = lazy(() => import('./pages/Hashtag')); return <Hashtag />; })()}
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reels"
            element={
              <ProtectedRoute>
                <Reels />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/video-call/:roomId"
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audio-call/:roomId"
            element={
              <ProtectedRoute>
                <AudioCall />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Navbar />
                <Analytics />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/group/:groupId"
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/live/:streamId"
            element={
              <ProtectedRoute>
                <LiveStream />
              </ProtectedRoute>
            }
          />

          <Route
            path="/close-friends"
            element={
              <ProtectedRoute>
                <Navbar />
                <CloseFriends />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <Navbar />
                <SchedulePost />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Navbar />
                <Messages />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Navbar />
                <Groups />
                <BottomNav />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages/:username"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stories/create"
            element={
              <ProtectedRoute>
                <CreateStory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stories/:userId"
            element={
              <ProtectedRoute>
                <StoryViewer />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/posts"
            element={
              <ProtectedRoute>
                <AdminPosts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminReports />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to feed */}
          <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              {incomingCall && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 border dark:border-gray-700">
                    <h3 className="text-lg font-semibold dark:text-white mb-2">Incoming {incomingCall.type || 'call'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">From: {incomingCall.from}</p>
                    <div className="mb-4 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={ringMuted} onChange={(e) => { const val = e.target.checked; setRingMuted(val); try { localStorage.setItem('ringMuted', JSON.stringify(val)); } catch {} }} />
                        Mute ringtone
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Vol</span>
                        <input type="range" min="0" max="1" step="0.05" value={ringVolume} onChange={(e) => { const v = parseFloat(e.target.value); setRingVolume(v); try { localStorage.setItem('ringVolume', String(v)); } catch {} if (gainRef.current) gainRef.current.gain.value = v; }} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 border rounded dark:border-gray-600 dark:text-white"
                        onClick={() => {
                          socketService.emit('call:decline', { to: incomingCall.from, roomId: incomingCall.roomId });
                          stopRingtone();
                          stopVibrate();
                          setIncomingCall(null);
                        }}
                      >
                        Decline
                      </button>
                      <button
                        className="px-4 py-2 bg-primary text-white rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          const path = `/${(incomingCall.type === 'video' ? 'video-call' : 'audio-call')}/${incomingCall.roomId}`;
                          stopRingtone();
                          stopVibrate();
                          setIncomingCall(null);
                          try {
                            // Ensure navigation even if Link fails
                            window.location.href = path;
                          } catch {
                            // Fallback no-op
                          }
                        }}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
      </Router>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
