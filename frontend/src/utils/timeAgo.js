import { formatDistanceToNow } from 'date-fns';

export const timeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
