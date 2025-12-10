import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { postAPI, storyAPI, recommendationAPI, reelsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import PullToRefresh from '../components/PullToRefresh';
import { PostSkeleton } from '../components/SkeletonLoader';
import StoriesBar from '../components/StoriesBar';
import Post from '../components/Post';
import { FiFilm, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Custom hook to detect mobile devices
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// New component to handle reel/short media rendering
const ShelfMedia = ({ reel }) => {
  // Properly extract media URL from either mediaUrl or media array
  const mediaUrl = reel.mediaUrl || (reel.media && reel.media.length > 0 ? reel.media[0].url : null);
  const customThumbnail = reel.thumbnail;

  // Don't render if no media URL
  if (!mediaUrl) {
    return (
      <div className="relative w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-white text-sm">No media available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-200 dark:bg-gray-800">
      <video
        key={mediaUrl} // Add key to force re-render on src change
        src={`${mediaUrl}#t=0.1`}
        className="w-full h-full object-cover"
        preload="metadata"
        muted
        playsInline
        loop
      />
      {/* Overlay custom thumbnail if it exists */}
      {customThumbnail && (
        <img
          src={customThumbnail}
          alt={reel.caption || 'thumbnail'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      <p className="absolute bottom-2 left-2 text-white text-sm font-semibold line-clamp-2">
        {reel.caption}
      </p>
    </div>
  );
};


// New Reels/Shorts Shelf Component
const ShortsShelf = () => {
  const isMobile = useMobileDetection();
  
  const { data: reelsData, isLoading, isError, error } = useQuery({
    queryKey: ['shorts'],
    queryFn: () => postAPI.getShorts(1, 10),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const reels = reelsData?.data?.data || [];

  if (isError) {
    console.error('Error fetching shorts:', error);
    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <FiFilm className="mr-2 text-purple-500" />
            Shorts & Reels
          </h2>
        </div>
        <div className="text-center py-4 text-red-500">
          Error loading shorts. Please try again later.
        </div>
      </div>
    );
  }

  // Limit to 2 reels on mobile devices, show all on larger screens
  const displayedReels = isMobile ? reels.slice(0, 2) : reels;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          <FiFilm className="mr-3 text-purple-500" />
          Shorts & Reels
        </h2>
      </div>
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        {isLoading
          ? [...Array(2)].map((_, i) => (
              <div key={i} className="w-40 flex-shrink-0 animate-pulse">
                <div className="w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              </div>
            ))
          : displayedReels.map((reel) => {
              // Skip reels without media
              const mediaUrl = reel.mediaUrl || (reel.media && reel.media.length > 0 ? reel.media[0].url : null);
              if (!mediaUrl) return null;
              
              return (
                <Link to={`/reels/${reel._id}`} key={reel._id} className="w-40 flex-shrink-5 group">
                  <div 
                    className="w-full h-64 rounded-lg overflow-hidden relative"
                    onMouseOver={e => e.currentTarget.querySelector('video')?.play()}
                    onMouseOut={e => e.currentTarget.querySelector('video')?.pause()}
                  >
                    <ShelfMedia reel={reel} />
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
};

const Feed = () => {
  const [filter, setFilter] = useState('recommended'); // Default to personalized recommendations
  const { ref, inView } = useInView({ threshold: 0.5 });

  const fetchFeed = async ({ pageParam = 1 }) => {
    let response;
    // The backend recommendation routes do not support pagination, so we only fetch them once.
    // Only the main feed ('subscriptions') will be paginated.
    switch (filter) {
      case 'trending':
        response = await recommendationAPI.getTrending({ limit: 20 });
        // Since it's not paginated, we return it in a way that useInfiniteQuery understands as a single page.
        return { data: response.data.data, pagination: { hasMore: false } };
      case 'recommended':
         response = await recommendationAPI.getPersonalized({ limit: 20 });
         return { data: response.data.data, pagination: { hasMore: false } };
      case 'posts':
        // For the posts filter, we fetch all posts and will filter on the client side
        response = await postAPI.getFeed(pageParam, 10);
        return response.data;
      case 'subscriptions':
      default:
        response = await postAPI.getFeed(pageParam, 10);
        return response.data;
    }
  };

  const {
    data,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', filter],
    queryFn: fetchFeed,
    getNextPageParam: (lastPage) => {
        // Only the 'subscriptions' and 'posts' feeds have real pagination
        if ((filter === 'subscriptions' || filter === 'posts') && lastPage.pagination.hasMore) {
            return lastPage.pagination.page + 1;
        }
        return undefined;
    },
  });

  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storyAPI.getsubscribedStories(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetching]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Feed refreshed!');
    } catch (err) {
      toast.error(err.message || 'Failed to refresh feed');
    }
  };

  // Filter posts based on the selected filter
  let posts = [];
  if (data) {
    const allPosts = data.pages.flatMap(page => page.data) || [];
    
    if (filter === 'posts') {
      // For 'posts' filter, show only image posts (exclude all videos)
      posts = allPosts.filter(post => {
        // Exclude posts that are categorized as videos
        const isVideo = post.category === 'short' || post.category === 'long';
        return !isVideo;
      });
    } else if (filter === 'recommended') {
      // For 'For You' filter, show all content except shorts
      posts = allPosts.filter(post => post.category !== 'short');
    } else {
      // For other filters (trending, subscriptions), exclude short videos (< 60 seconds) as per existing logic
      posts = allPosts.filter(post => !post.durationSec || post.durationSec >= 60);
    }
  }

  const stories = storiesData?.data?.data || [];

  const handleFilterChange = (newFilter) => {
    // Prevent refetch if filter is the same
    if(newFilter !== filter) {
        setFilter(newFilter);
    }
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500">Error: {error.message}</div>;
  }

  return (
     <div className="min-h-screen bg-white dark:bg-gray-900">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
          <StoriesBar stories={stories} loading={storiesLoading} />

          <ShortsShelf />
          
          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

          {/* Feed with Filters */}
          <div className="py-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {[
                { key: 'recommended', label: 'For You' },
                { key: 'trending', label: 'Trending' },
                { key: 'posts', label: 'Posts' },
                { key: 'subscriptions', label: 'Subscriptions' },
              ].map(({key, label}) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange(key)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                    filter === key
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4 py-4">
            {isFetching && !isFetchingNextPage ? (
              [...Array(5)].map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <FiTrendingUp className="mx-auto w-16 h-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">No Posts to Show</h3>
                <p className="mt-2 text-gray-500">This feed is currently empty. Check back later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                    <Post key={post._id} post={post} />
                  ))}
              </div>
            )}
            
            {/* Infinite Scroll for Subscriptions Feed Only */}
            {filter === 'subscriptions' && <div ref={ref} className="h-1"></div>}

            {isFetchingNextPage && (
              <div className="flex justify-center items-center py-4">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!hasNextPage && posts.length > 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>You've reached the end!</p>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
};

export default Feed;