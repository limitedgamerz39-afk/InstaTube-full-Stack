export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const formatDuration = (duration) => {
  if (!duration) return '0:00';
  
  // If duration is in seconds
  if (typeof duration === 'number') {
    return formatTime(duration);
  }
  
  // If duration is a string like "3:45"
  return duration;
};

export const formatViews = (views) => {
  return formatNumber(views) + ' views';
};