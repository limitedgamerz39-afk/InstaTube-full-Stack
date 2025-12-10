import { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { exploreAPI, reelsAPI, videoAPI, postAPI, trendingAPI } from '../services/api';
import EnhancedExplorePostCard from '../components/EnhancedExplorePostCard';
import { AiOutlineFire, AiOutlineClockCircle, AiOutlineRise } from 'react-icons/ai';
import { FiTrendingUp, FiHash, FiUsers } from 'react-icons/fi';

const ExplorePostCardSkeleton = () => (
  <div className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
);

const HashtagSkeleton = () => (
  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 animate-pulse">
    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
  </div>
);

const CreatorSkeleton = () => (
  <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
    </div>
  </div>
);

const Explore = () => {
  const [category, setCategory] = useState('all');
  const [timeFrame, setTimeFrame] = useState('all');

  // Fetch trending hashtags
  const { data: hashtagsData, isLoading: isLoadingHashtags } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: trendingAPI.getTrendingHashtags,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  

  const fetchExploreContent = async ({ pageParam = 1 }) => {
    try {
      // Fetch different content types based on category
      if (category === 'short') {
        // For shorts, we fetch from the reels API
        const response = await reelsAPI.getReels();
        // Handle both data structures
        let data = [];
        if (response.data.reels) {
          data = response.data.reels;
        } else if (response.data.data) {
          data = response.data.data;
        }
        return {
          data: data || [],
          pagination: { hasMore: false, page: 1 }
        };
      } else if (category === 'video') {
        // For videos, we fetch trending videos
        const response = await videoAPI.getVideos();
        // Handle the trending videos response structure
        let data = [];
        if (response.data.videos) {
          data = response.data.videos;
        } else if (response.data.data) {
          data = response.data.data;
        }
        return {
          data: data || [],
          pagination: { hasMore: false, page: 1 }
        };
      } else {
        // For 'all' and 'post', we fetch from explore posts
        const response = await exploreAPI.getExplorePosts({
          page: pageParam,
          limit: 18,
          category: category === 'all' ? 'all' : 'post',
          time: timeFrame,
        });
        
        // Handle the response data structure
        let data = [];
        let pagination = { hasMore: false, page: 1 };
        
        if (response.data.data) {
          // New structure with pagination
          data = response.data.data;
          pagination = response.data.pagination || { hasMore: false, page: 1 };
        } else if (response.data) {
          // Old structure
          data = response.data;
        }
        
        return {
          data: data || [],
          pagination: pagination
        };
      }
    } catch (error) {
      console.error('Error fetching explore content:', error);
      return {
        data: [],
        pagination: { hasMore: false, page: 1 }
      };
    }
  };

  const {
    data: contentData,
    error: contentError,
    isError: isContentError,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetchingContent,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['exploreContent', category, timeFrame],
    queryFn: fetchExploreContent,
    getNextPageParam: (lastPage) => {
      // Only for posts we have pagination
      if ((category === 'all' || category === 'post') && lastPage.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Refetch when category or timeFrame changes
  useEffect(() => {
    refetch();
  }, [category, timeFrame, refetch]);

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, fetchNextPage, hasNextPage]);

  const content = contentData?.pages.flatMap(page => {
    if (page.data && page.data.docs && Array.isArray(page.data.docs)) {
      return page.data.docs;
    }
    if (page.data && Array.isArray(page.data)) {
      return page.data;
    }
    return [];
  }) ?? [];

  const renderContentGrid = () => {
    if (isFetchingContent && !isFetchingNextPage) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-4">
          {[...Array(12)].map((_, i) => <ExplorePostCardSkeleton key={i} />)}
        </div>
      );
    }

    if (isContentError) {
      return <div className="text-center py-10">Error loading content: {contentError.message}</div>;
    }

    if (content.length === 0) {
      return (
        <div className="text-center py-20">
          <FiTrendingUp className="mx-auto w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No Content Found</h3>
          <p className="mt-2 text-gray-500">Check back later to discover new posts, shorts, and videos.</p>
        </div>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-4">
          {content.map((post, index) => {
            if (!post || !post._id) {
              return null;
            }
            
            if (content.length === index + 1) {
              return (
                <div ref={lastPostElementRef} key={post._id}>
                  <EnhancedExplorePostCard post={post} />
                </div>
              );
            }
            return <EnhancedExplorePostCard key={post._id} post={post} />;
          })}
        </div>
        {isFetchingNextPage && (
          <div className="flex justify-center items-center py-4 col-span-full">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!hasNextPage && content.length > 0 && (
          <div className="text-center py-8 text-gray-500 col-span-full">
            <p>You've reached the end!</p>
          </div>
        )}
      </>
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AiOutlineFire className="text-purple-500" />
              Explore
            </h1>
            
            {/* Time Frame Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Time:</span>
              <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                {['all', 'today', 'week', 'month'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeFrame(time)}
                    className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                      timeFrame === time
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {time === 'all' && <span className="hidden sm:inline">All Time</span>}
                    {time === 'today' && <span className="hidden sm:inline">Today</span>}
                    {time === 'week' && <span className="hidden sm:inline">This Week</span>}
                    {time === 'month' && <span className="hidden sm:inline">This Month</span>}
                    {time === 'all' && <span className="sm:hidden">All</span>}
                    {time === 'today' && <span className="sm:hidden">T</span>}
                    {time === 'week' && <span className="sm:hidden">W</span>}
                    {time === 'month' && <span className="sm:hidden">M</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4 -mb-px" aria-label="Tabs">
              {['all', 'post', 'short', 'video'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCategory(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    category === tab
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Trending Hashtags Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiHash className="text-purple-500" />
            <h2 className="text-xl font-bold">Trending Hashtags</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isLoadingHashtags ? (
              [...Array(8)].map((_, i) => <HashtagSkeleton key={i} />)
            ) : (
              (hashtagsData?.data?.hashtags || []).slice(0, 15).map((hashtag) => (
                <div 
                  key={hashtag.hashtag} 
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full px-3 py-1.5 cursor-pointer transition-colors"
                  onClick={() => window.location.hash = `/hashtag/${hashtag.hashtag}`}
                >
                  <span className="font-medium text-purple-600 dark:text-purple-400">#</span>
                  <span className="font-medium">{hashtag.hashtag}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(hashtag.postCount || 0)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>


        <div className="w-full">
          {renderContentGrid()}
        </div>
      </div>
    </div>
  );
};

export default Explore;