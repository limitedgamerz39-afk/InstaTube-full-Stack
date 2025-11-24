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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState(null);
  
  // React Query hooks
  const { data: currentUserData, isLoading: isUserLoading, isError } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // Update user when currentUserData changes
  useEffect(() => {
    if (currentUserData) {
      setUser(currentUserData.data.data);
      setLoading(false);
    } else if (isError) {
      // Handle error case - token might be invalid or expired
      logout();
      setLoading(false);
    }
  }, [currentUserData, isError]);

  useEffect(() => {
    // Check if we have a token on initial load
    if (token) {
      // The useCurrentUser hook will automatically fetch user data
      socketService.connect(token);
    } else {
      // No token means user is not authenticated
      setLoading(false);
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
      localStorage.setItem('lastLogoutAttempt', now.toString());
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

  const value = {
    user,
    token,
    loading: loading || (token && isUserLoading), // Only show loading for user data if we have a token
    login,
    verifyTwoFactor,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    requires2FA,
    twoFactorUserId,
    setRequires2FA
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};