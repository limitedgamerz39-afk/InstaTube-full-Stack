import React, { useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postAPI } from '../services/api';
import Post from './Post';
import { PostSkeleton } from './SkeletonLoader';
import { FiFilm } from 'react-icons/fi';

const UserContentGrid = ({ userId, category }) => {
  // Don't render anything if userId is not provided
  if (!userId) {
    return (
      <div className="text-center py-20">
        <FiFilm className="mx-auto w-16 h-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">No {category}s yet</h3>
        <p className="mt-2 text-gray-500">This channel hasn't posted any {category}s.</p>
      </div>
    );
  }
  
  const fetchUserContent = async ({ pageParam = 1 }) => {
    const response = await postAPI.getPostsByUserId(userId, {
      page: pageParam,
      limit: 12,
      category: category === 'all' ? 'all' : category,
    });
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
    queryKey: ['userContent', userId, category],
    queryFn: fetchUserContent,
    getNextPageParam: (lastPage) => {
      return lastPage.data.hasNextPage ? lastPage.data.nextPage : undefined;
    },
    enabled: !!userId, // Only run query if userId exists
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

  const posts = data?.pages.flatMap(page => page.data.docs) ?? [];

  if (isFetching && !isFetchingNextPage) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-10 text-red-500">Error loading content: {error.message}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <FiFilm className="mx-auto w-16 h-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">No {category === 'all' ? 'posts' : category}s yet</h3>
        <p className="mt-2 text-gray-500">This channel hasn't posted any {category === 'all' ? 'content' : category}s.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post, index) => {
          if (posts.length === index + 1) {
            return <div ref={lastPostElementRef} key={post._id}><Post post={post} /></div>;
          }
          return <Post key={post._id} post={post} />;
        })}
      </div>
      {isFetchingNextPage && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default UserContentGrid;