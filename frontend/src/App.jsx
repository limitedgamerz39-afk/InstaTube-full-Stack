import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { VideoProvider } from './context/VideoContext';
import ErrorBoundary from './components/ErrorBoundary';
import socketService from './services/socket';
import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import AppLoader from './components/AppLoader';
import CookieConsent from './components/CookieConsent';
import TwoFactorAuth from './components/TwoFactorAuth';
import { AiOutlineMenu, AiOutlineSearch } from 'react-icons/ai';
import { BsCameraReelsFill } from 'react-icons/bs';
import DynamicRoutes from './components/DynamicRoutes';

function AppContent() {
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
          <div className="flex flex-col min-h-screen">
            {/* Mobile Header - Only visible on mobile */}
            <div className="md:hidden mobile-header">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Open menu"
                >
                  <AiOutlineMenu className="w-6 h-6" />
                </button>
                
                <a href="/" className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-1.5 rounded-lg">
                    <BsCameraReelsFill className="text-white w-5 h-5" />
                  </div>
                  <span className="text-lg font-black gradient-text">D4D</span>
                </a>
                
                <a 
                  href="/search" 
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Search"
                >
                  <AiOutlineSearch className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex flex-1">
              <DynamicRoutes setMobileSidebarOpen={setMobileSidebarOpen} />
            </div>
          </div>
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