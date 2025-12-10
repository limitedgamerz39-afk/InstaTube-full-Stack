import { useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postAPI } from '../services/api';
import Post from '../components/Post';
import { PostSkeleton } from '../components/SkeletonLoader';
import { FiFilm } from 'react-icons/fi';

const Videos = () => {
  const fetchVideos = async ({ pageParam = 1 }) => {
    // Use postAPI to fetch long videos directly
    const response = await postAPI.getLongVideos(pageParam, 12);
    return response.data;
  };

  const {
    data,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['videos'],
    queryFn: fetchVideos,
    getNextPageParam: (lastPage, pages) => {
      // Check if there are more pages based on the response structure
      if (lastPage && lastPage.length > 0) {
        return pages.length + 1;
      }
      return undefined;
    },
  });
  
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

  const posts = data?.pages.flatMap(page => page.data || page) ?? [];

  const renderGrid = () => {
    if (isFetching && !isFetchingNextPage) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {[...Array(12)].map((_, i) => <PostSkeleton key={i} />)}
        </div>
      );
    }

    if (isError) {
      return <div className="text-center py-10 text-red-500">Error loading videos: {error.message}</div>;
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-20">
          <FiFilm className="mx-auto w-16 h-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No Videos Yet</h3>
          <p className="mt-2 text-gray-500">Check back later for new content!</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return <div ref={lastPostElementRef} key={post._id}><Post post={post} /></div>;
            }
            return <Post key={post._id} post={post} />;
          })}
        </div>
        {isFetchingNextPage && (
          <div className="flex justify-center items-center py-8 col-span-full">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className="text-center py-10 text-gray-500 col-span-full">
            <p>You've seen all the videos!</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
        <h1 className="text-3xl font-bold mb-8">All Videos</h1>
        {renderGrid()}
      </div>
    </div>
  );
};

export default Videos;