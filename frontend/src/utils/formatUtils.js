/**
 * Format duration in seconds to human-readable format
 * - If duration is less than 1 hour: MM:SS
 * - If duration is 1 hour or more: HH:MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    // Format as HH:MM:SS
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    // Format as MM:SS
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * Get thumbnail URL for a post/video
 * Tries multiple sources in order: thumbnail, thumbnailUrl, mediaUrl
 * For videos, if no thumbnail is available, it will use the first frame of the video as a fallback
 * @param {Object} item - Post or video object
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (item) => {
  if (!item) return '/default-thumbnail.jpg';
  
  // Try to get thumbnail from various possible fields
  if (item.thumbnail) return item.thumbnail;
  if (item.thumbnailUrl) return item.thumbnailUrl;
  
  // For videos, if no thumbnail, use the mediaUrl as fallback
  if (item.mediaUrl) {
    return item.mediaUrl;
  }
  
  // For posts with media array
  if (item.media && Array.isArray(item.media) && item.media.length > 0) {
    const firstMedia = item.media[0];
    if (firstMedia.thumbnail) return firstMedia.thumbnail;
    if (firstMedia.url) return firstMedia.url;
  }
  
  // Default fallback
  return '/default-thumbnail.jpg';
};