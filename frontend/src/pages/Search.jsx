import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { userAPI, postAPI } from '../services/api';
import { 
  AiOutlineSearch, 
  AiOutlineMessage, 
  AiOutlineHistory, 
  AiOutlineFilter, 
  AiOutlineClose,
  AiOutlineUser,
  AiOutlinePicture,
  AiOutlineVideoCamera,
  AiOutlinePlayCircle,
  AiOutlineFire,
  AiOutlineClockCircle,
  AiOutlineCrown
} from 'react-icons/ai';
import { 
  FiTrendingUp, 
  FiClock, 
  FiUsers, 
  FiImage, 
  FiVideo,
  FiChevronRight,
  FiCheck
} from 'react-icons/fi';
import { IoSparklesOutline, IoTimeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';
import Pagination from '../components/Pagination';
import searchAnalytics from '../utils/searchAnalytics';

// Custom debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches] = useState([
    { term: 'D4D HUB', count: '12.5K', trending: true },
    { term: 'music', count: '8.2K', trending: false },
    { term: 'travel', count: '6.7K', trending: true },
    { term: 'food', count: '5.9K', trending: false },
    { term: 'art', count: '4.3K', trending: true },
    { term: 'photography', count: '3.8K', trending: false },
    { term: 'technology', count: '3.2K', trending: true },
    { term: 'fashion', count: '2.7K', trending: false }
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'relevance',
    minFollowers: 0,
    dateRange: 'all',
    minViews: 0,
    verifiedOnly: false
  });
  
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [categoryResults, setCategoryResults] = useState({
    users: [],
    posts: [],
    reels: [],
    videos: []
  });
  const [activeCategory, setActiveCategory] = useState('all');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  
  const searchCache = useRef(new Map());
  const searchInputRef = useRef(null);
  const CACHE_EXPIRY = 5 * 60 * 1000;

  // Enhanced search categories with icons and colors
  const categories = [
    { id: 'all', name: 'All', icon: AiOutlineSearch, color: 'text-blue-500' },
    { id: 'users', name: 'Users', icon: AiOutlineUser, color: 'text-green-500' },
    { id: 'posts', name: 'Posts', icon: AiOutlinePicture, color: 'text-purple-500' },
    { id: 'reels', name: 'Reels', icon: AiOutlinePlayCircle, color: 'text-pink-500' },
    { id: 'videos', name: 'Videos', icon: AiOutlineVideoCamera, color: 'text-red-500' }
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    
    setRecentSearches(prev => {
      const updated = [
        { term: searchTerm, timestamp: Date.now() },
        ...prev.filter(item => item.term && item.term.toLowerCase() !== searchTerm.toLowerCase())
      ].slice(0, 8);
      
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle search when query changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== query) {
      setQuery(q);
      handleSearch(q);
      saveRecentSearch(q);
    }
  }, [searchParams]);

  // Fetch search suggestions
  useEffect(() => {
    if (query.trim() && showSuggestions) {
      const delayDebounce = setTimeout(() => {
        fetchSuggestions(query);
      }, 200);

      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
    }
  }, [query, showSuggestions]);

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await userAPI.searchUsers(searchQuery);
      const users = response.data.data.slice(0, 4);
      const hashtagSuggestions = [
        `#${searchQuery}`,
        `#${searchQuery}life`,
        `#${searchQuery}love`,
        `#${searchQuery}art`
      ].slice(0, 2);
      
      setSuggestions([...users, ...hashtagSuggestions.map(term => ({ isHashtag: true, term }))]);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSearch = async (searchQuery, pageNum = 1, retryCount = 0) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setCategoryResults({
        users: [],
        posts: [],
        reels: [],
        videos: []
      });
      setShowSuggestions(true);
      return;
    }

    const cacheKey = `${searchQuery.toLowerCase()}:page:${pageNum}`;
    const cachedResult = searchCache.current.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRY) {
      setResults(cachedResult.data.users);
      setCategoryResults(cachedResult.data.categories);
      setHasMore(cachedResult.data.hasMore);
      setTotalResults(cachedResult.data.totalResults);
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const [usersResponse, postsResponse] = await Promise.all([
        userAPI.searchUsers(searchQuery, pageNum),
        userAPI.searchPosts(searchQuery, pageNum)
      ]);
      
      const filteredUsers = usersResponse.data.data.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const filteredPosts = postsResponse.data.data.filter(post => 
        (post.caption && post.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      const imagePosts = filteredPosts.filter(post => post.category === 'image');
      const shortPosts = filteredPosts.filter(post => post.category === 'short');
      const longPosts = filteredPosts.filter(post => post.category === 'long');
      
      const searchData = {
        users: filteredUsers,
        categories: {
          users: filteredUsers,
          posts: imagePosts,
          reels: shortPosts,
          videos: longPosts
        },
        hasMore: usersResponse.data.pagination?.hasMore || postsResponse.data.pagination?.hasMore || false,
        totalResults: filteredUsers.length + imagePosts.length + shortPosts.length + longPosts.length
      };
      
      searchCache.current.set(cacheKey, {
        data: searchData,
        timestamp: Date.now()
      });
      
      setResults(filteredUsers);
      setCategoryResults(searchData.categories);
      setHasMore(searchData.hasMore);
      setTotalResults(searchData.totalResults);
      setPage(pageNum);
      
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      searchAnalytics.trackSearch(searchQuery, searchData.totalResults, timeTaken);
    } catch (error) {
      console.error('Search error:', error);
      
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || !error.response)) {
        setTimeout(() => {
          handleSearch(searchQuery, pageNum, retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message || 'Search failed. Please try again.');
      toast.error('Search failed. Please check your connection and try again.');
      
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      searchAnalytics.trackSearch(searchQuery, 0, timeTaken);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((searchQuery, pageNum = 1) => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery, pageNum);
      }
    }, 400),
    []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      saveRecentSearch(query);
      setShowSuggestions(false);
      setSearchFocus(false);
      debouncedSearch(query, 1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.isHashtag) {
      setQuery(suggestion.term);
      setSearchParams({ q: suggestion.term });
      saveRecentSearch(suggestion.term);
    } else {
      setQuery(suggestion.username);
      setSearchParams({ q: suggestion.username });
      saveRecentSearch(suggestion.username);
    }
    setShowSuggestions(false);
    setSearchFocus(false);
    handleSearch(suggestion.isHashtag ? suggestion.term : suggestion.username);
  };

  const handleRecentSearchClick = (searchTerm) => {
    setQuery(searchTerm);
    setSearchParams({ q: searchTerm });
    setShowSuggestions(false);
    setSearchFocus(false);
    handleSearch(searchTerm);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    toast.success('Recent searches cleared');
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
    setResults([]);
    setCategoryResults({
      users: [],
      posts: [],
      reels: [],
      videos: []
    });
    setShowSuggestions(true);
    searchInputRef.current?.focus();
  };

  const applyFilters = async () => {
    setShowFilters(false);
    if (query.trim()) {
      await handleSearch(query);
      toast.success('Filters applied successfully');
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Escape') {
        setShowMobileSearch(false);
        setShowFilters(false);
        setShowSuggestions(false);
        setSearchFocus(false);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCategoryCount = (category) => {
    switch (category) {
      case 'users': return categoryResults.users.length;
      case 'posts': return categoryResults.posts.length;
      case 'reels': return categoryResults.reels.length;
      case 'videos': return categoryResults.videos.length;
      default: return totalResults;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Mobile Search Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AiOutlineSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setSearchFocus(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => {
                  setSearchFocus(false);
                  setShowSuggestions(false);
                }, 200);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (query.trim()) {
                    setSearchParams({ q: query });
                    handleSearch(query);
                    saveRecentSearch(query);
                  }
                }
              }}
              placeholder="Search users, posts, hashtags..."
              className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Search"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setCategoryResults({
                    users: [],
                    posts: [],
                    reels: [],
                    videos: []
                  });
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <AiOutlineClose className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search Suggestions and Recent Searches - Mobile */}
      {showSuggestions && (query || recentSearches.length > 0) && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20 max-h-[70vh] overflow-y-auto">
          {query ? (
            <>
              {suggestions.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Suggestions
                  </div>
                  {suggestions.map((item, index) => (
                    <Link
                      key={index}
                      to={item.isHashtag ? `/explore/tags/${item.term.substring(1)}` : `/profile/${item.username}`}
                      onClick={() => {
                        if (item.isHashtag) {
                          saveRecentSearch(item.term);
                        } else {
                          saveRecentSearch(item.username);
                        }
                        setShowSuggestions(false);
                      }}
                      className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {item.isHashtag ? (
                        <>
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 mr-3">
                            <AiOutlineSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="text-gray-900 dark:text-white">{item.term}</span>
                        </>
                      ) : (
                        <>
                          <img
                            src={item.avatar}
                            alt={item.username}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.username}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.fullName}</div>
                          </div>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <AiOutlineSearch className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No suggestions found</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Searches
                </div>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recentSearches');
                  }}
                  className="text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Clear All
                </button>
              </div>
              {recentSearches.map((item, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Link
                    to={`/search?q=${encodeURIComponent(item.term)}`}
                    onClick={() => {
                      setQuery(item.term);
                      setShowSuggestions(false);
                    }}
                    className="flex items-center flex-1"
                  >
                    <AiOutlineHistory className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{item.term}</span>
                  </Link>
                  <button
                    onClick={() => {
                      const updated = recentSearches.filter((_, i) => i !== index);
                      setRecentSearches(updated);
                      localStorage.setItem('recentSearches', JSON.stringify(updated));
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Remove"
                  >
                    <AiOutlineClose className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Desktop Search - hidden on mobile */}
      <div className="hidden md:block max-w-4xl mx-auto px-4 py-6">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AiOutlineSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow clicking on them
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (query.trim()) {
                  setSearchParams({ q: query });
                  handleSearch(query);
                  saveRecentSearch(query);
                }
              }
            }}
            placeholder="Search users, posts, hashtags..."
            className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full border-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Search"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setCategoryResults({
                  users: [],
                  posts: [],
                  reels: [],
                  videos: []
                });
                searchInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <AiOutlineClose className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Desktop Categories - hidden on mobile */}
        <div className="hidden md:flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex space-x-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    activeCategory === category.id
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
                  {category.name}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <AiOutlineFilter className="w-4 h-4 mr-1" />
            Filters
          </button>
        </div>
        
        {/* Mobile Categories - only visible on mobile */}
        <div className="md:hidden overflow-x-auto hide-scrollbar px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex space-x-1 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-3 h-3 mr-1 ${category.color}`} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Search Results */}
        <div className="p-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonLoader key={i} type="searchResult" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 dark:text-red-400 font-medium">Failed to load search results</p>
              <button
                onClick={() => handleSearch(query, page)}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : activeCategory === 'users' || activeCategory === 'all' ? (
            <div className="space-y-4">
              {categoryResults.users.length > 0 ? (
                categoryResults.users.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/${user.username}`}
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.username}
                        </h3>
                        {user.isVerified && (
                          <span className="ml-1 text-blue-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {user.subscriber?.length || 0} subscribers • {user.posts?.length || 0} posts
                      </p>
                    </div>
                    <button className="ml-4 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors">
                      Subscribe
                    </button>
                  </Link>
                ))
              ) : activeCategory === 'users' ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <AiOutlineUser className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {(activeCategory === 'posts' ? categoryResults.posts : 
                activeCategory === 'reels' ? categoryResults.reels : 
                categoryResults.videos).map((post) => (
                <div 
                  key={post._id} 
                  className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative cursor-pointer"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  <img 
                    src={post.thumbnailUrl || post.mediaUrl} 
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  {post.category === 'short' && (
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded px-1 py-0.5 text-xs">
                      <BsPlayCircle className="w-3 h-3" />
                    </div>
                  )}
                  {(post.likes?.length > 0 || post.comments?.length > 0) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                      <div className="flex items-center text-white text-xs space-x-2">
                        <div className="flex items-center">
                          <AiFillHeart className="w-3 h-3 mr-1" />
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <BsChat className="w-3 h-3 mr-1" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;