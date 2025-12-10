import { createContext, useContext, useState, useEffect } from 'react';
import { useLogin, useRegister, useCurrentUser } from '../services/queryClient';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize user state with cached data if available
  const cachedUser = localStorage.getItem('user');
  const initialUser = cachedUser ? JSON.parse(cachedUser) : null;
  
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState(null);
  
  // React Query hooks
  const { data: currentUserData, isLoading: isUserLoading, isError, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Update user when currentUserData changes
  useEffect(() => {
    if (currentUserData) {
      setUser(currentUserData.data.data);
      // Store user data in localStorage for faster loading on refresh
      localStorage.setItem('user', JSON.stringify(currentUserData.data.data));
      setLoading(false);
    } else if (isError) {
      // Handle error case - token might be invalid or expired
      // Check if we have cached user data to maintain session
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          // Keep the cached user data but mark that we had an auth error
          // This allows role-based routes to still work with cached data
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    }
  }, [currentUserData, isError]);

  useEffect(() => {
    // Check if we have a token on initial load
    if (token) {
      // The useCurrentUser hook will automatically fetch user data
      socketService.connect(token);
      // Also try to get cached user data immediately for better UX
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          // Don't set loading to false here because we still want to verify with the server
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
          localStorage.removeItem('user');
        }
      }
      // Set loading to false immediately since we have user data to show
      // But keep isUserLoading true so the ProtectedRoute knows we're verifying
      setLoading(false);
    } else {
      // Try to refresh token if we have a refresh token
      refreshTokenIfNeeded().then(newToken => {
        if (newToken) {
          // If we got a new token, connect socket and fetch user data
          socketService.connect(newToken);
        } else {
          // Check if we have cached user data
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              setUser(parsedUser);
              // Even without token, show cached data and let app decide what to do
            } catch (e) {
              console.error('Failed to parse cached user data:', e);
              localStorage.removeItem('user');
            }
          }
        }
        // Set loading to false to allow app to render
        setLoading(false);
      }).catch(() => {
        // If token refresh fails, still try to show cached data
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
          } catch (e) {
            console.error('Failed to parse cached user data:', e);
            localStorage.removeItem('user');
          }
        }
        setLoading(false);
      });
    }
  }, [token]);

  const login = async (email, password) => {
    // Debounce login attempts to prevent rate limiting
    const now = Date.now();
    const lastLoginAttempt = localStorage.getItem('lastLoginAttempt');
    
    // Only allow login attempts every 5 seconds
    if (lastLoginAttempt && now - parseInt(lastLoginAttempt) < 5000) {
      toast.error('Please wait before trying to login again');
      throw new Error('Rate limit exceeded');
    }
    
    try {
      localStorage.setItem('lastLoginAttempt', now.toString());
      const response = await loginMutation.mutateAsync({ email, password });
      
      // Check if 2FA is required
      if (response.data.data && response.data.data.requires2FA) {
        setRequires2FA(true);
        setTwoFactorUserId(response.data.data.userId);
        return { requires2FA: true, userId: response.data.data.userId };
      }
      
      // Normal login flow
      // Fix the destructuring to match the actual response structure
      const { token, refreshToken, data } = response.data;
      const userData = data.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
      
      socketService.connect(token);
      toast.success('Welcome back!');
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const verifyTwoFactor = async (token, backupCode) => {
    try {
      const response = await api.post('/auth/2fa/verify-login', {
        userId: twoFactorUserId,
        token,
        backupCode
      });
      
      // Fix the destructuring to match the actual response structure
      const { token: accessToken, refreshToken, data } = response.data;
      const userData = data.user;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      setRequires2FA(false);
      setTwoFactorUserId(null);
      
      socketService.connect(accessToken);
      toast.success('Welcome back!');
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || '2FA verification failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (userData) => {
    // Debounce registration attempts to prevent rate limiting
    const now = Date.now();
    const lastRegisterAttempt = localStorage.getItem('lastRegisterAttempt');
    
    // Only allow registration attempts every 30 seconds
    if (lastRegisterAttempt && now - parseInt(lastRegisterAttempt) < 30000) {
      toast.error('Please wait before trying to register again');
      throw new Error('Rate limit exceeded');
    }
    
    try {
      localStorage.setItem('lastRegisterAttempt', now.toString());
      const response = await registerMutation.mutateAsync(userData);
      // Fix the destructuring to match the actual response structure
      const { token, refreshToken, data } = response.data;
      const user = data.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      socketService.connect(token);
      toast.success('Account created successfully!');
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    // Debounce logout attempts to prevent rate limiting
    const now = Date.now();
    const lastLogoutAttempt = localStorage.getItem('lastLogoutAttempt');
    
    // Only allow logout attempts every 5 seconds
    if (lastLogoutAttempt && now - parseInt(lastLogoutAttempt) < 5000) {
      toast.error('Please wait before trying to logout again');
      return;
    }
    
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('lastVisitedPath');
      setToken(null);
      setUser(null);
      setRequires2FA(false);
      setTwoFactorUserId(null);
      socketService.disconnect();
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Function to refresh user data from the server with rate limiting
  const refreshUser = async () => {
    // Rate limiting - only allow refresh every 30 seconds
    const now = Date.now();
    const lastRefresh = localStorage.getItem('lastUserRefresh');
    
    if (lastRefresh && now - parseInt(lastRefresh) < 30000) {
      // Return cached user data if available
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        return userData;
      }
      // If no cached data, continue with refresh
    }
    
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastUserRefresh', now.toString());
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Even if refresh fails, keep the cached user data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        return userData;
      }
      // If no cached data and refresh failed, but we had user data before, keep it
      if (user) {
        return user;
      }
      throw error;
    }
  };

  // Function to refresh token if needed
  const refreshTokenIfNeeded = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const token = localStorage.getItem('token');
    
    if (!token && refreshToken) {
      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        setToken(newToken);
        return newToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // If token refresh fails, logout the user
        logout();
        throw error;
      }
    }
    return token;
  };


  const value = {
    user,
    token,
    loading, // Only show loading during initial app load
    isVerifying: token && isUserLoading, // Separate flag for when we're verifying user data
    login,
    verifyTwoFactor,
    register,
    logout,
    updateUser,
    refreshUser, // Add refreshUser function to context
    refreshTokenIfNeeded, // Add token refresh function to context
    isAuthenticated: !!user, // User is authenticated if we have user data (even cached)
    // But we distinguish between having a valid token and just cached data
    hasValidToken: !!user && !!token, // Only true if both user and valid token exist
    requires2FA,
    twoFactorUserId,
    setRequires2FA
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};