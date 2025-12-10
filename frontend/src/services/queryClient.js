import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, userAPI, postAPI, notificationAPI, messageAPI, exploreAPI, storyAPI } from './api';

// Rate limiting cache
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Rate limiting function
const isRateLimited = (key) => {
  const now = Date.now();
  const lastRequest = rateLimitCache.get(key);
  
  if (!lastRequest || now - lastRequest > RATE_LIMIT_WINDOW) {
    rateLimitCache.set(key, now);
    return false;
  }
  
  return true;
};

// Auth Queries
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      // Set user data in localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.refetchQueries({ queryKey: ['user'] });
    }
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authAPI.register
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authAPI.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Don't run the query if there's no token
    enabled: !!localStorage.getItem('token'),
    // Don't throw error on 401/403, let the AuthContext handle it
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Cache the result to prevent flickering
    cacheTime: 10 * 60 * 1000, // 10 minutes
    // Don't refetch on mount if data is fresh
    refetchOnMount: 'always',
    // Don't automatically set query to error state on 401/403
    onError: (error) => {
      // Let AuthContext handle authentication errors
      console.debug('User data fetch error (handled by AuthContext):', error);
    }
  });
};

// User Queries
export const useUserProfile = (username) => {
  return useQuery({
    queryKey: ['user', username],
    queryFn: () => userAPI.getProfile(username),
    enabled: !!username
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (data) => {
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.data));
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.data.username] });
    }
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userAPI.followUser,
    onSuccess: (_, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
  });
};

export const useUserSuggestions = () => {
  return useQuery({
    queryKey: ['user-suggestions'],
    queryFn: userAPI.getSuggestions,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Post Queries
export const useFeed = (page = 1, limit = 10, filter = 'popular') => {
  return useQuery({
    queryKey: ['feed', page, limit, filter],
    queryFn: async () => {
      // Implement rate limiting
      const cacheKey = `feed_${page}_${limit}_${filter}`;
      if (isRateLimited(cacheKey)) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      }
      
      return await postAPI.getFeed(page, limit, filter);
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // Increase to 5 minutes
    retry: 1, // Reduce retry attempts
    retryDelay: 1000 // 1 second delay between retries
  });
};

export const usePost = (postId) => {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => postAPI.getPost(postId),
    enabled: !!postId
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postAPI.likePost,
    onSuccess: (_, postId) => {
      // Optimistically update the post in feed
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postAPI.createPost,
    onSuccess: () => {
      // Invalidate feed to show new post
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};

export const useRandomPosts = (limit = 20) => {
  return useQuery({
    queryKey: ['random-posts', limit],
    queryFn: () => postAPI.getRandomPosts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
};

// Notification Queries
export const useNotifications = (page = 1) => {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationAPI.getNotifications(page),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000 // Increase to 5 minutes
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

// Explore Queries
export const useExplorePosts = () => {
  return useQuery({
    queryKey: ['explore-posts'],
    queryFn: exploreAPI.getExplorePosts,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useTrendingHashtags = () => {
  return useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: exploreAPI.getTrendingHashtags,
    staleTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Story Queries
export const useSubscribedStories = () => {
  return useQuery({
    queryKey: ['subscribed-stories'],
    queryFn: storyAPI.getsubscribedStories,
    staleTime: 5 * 60 * 1000 // Increase to 5 minutes
  });
};