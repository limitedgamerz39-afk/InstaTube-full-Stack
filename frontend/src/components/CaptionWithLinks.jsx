import { Link } from 'react-router-dom';

const CaptionWithLinks = ({ caption, author }) => {
  if (!caption) return null;

  // Split caption into parts while preserving spaces
  const parts = caption.split(/(\s+)/);

  return (
    <p className="mb-2 dark:text-white">
      <Link
        to={`/profile/${author.username}`}
        className="font-semibold mr-2 hover:underline"
        aria-label={`View ${author.username}'s profile`}
      >
        {author.username}
      </Link>
      {parts.map((part, index) => {
        // Hashtag
        if (part.startsWith('#')) {
          const hashtag = part.substring(1);
          return (
            <Link
              key={index}
              to={`/explore/tags/${hashtag}`}
              className="text-primary hover:underline"
              aria-label={`View posts tagged with ${hashtag}`}
            >
              {part}
            </Link>
          );
        }
        // Mention
        else if (part.startsWith('@')) {
          const username = part.substring(1);
          return (
            <Link
              key={index}
              to={`/profile/${username}`}
              className="text-primary hover:underline"
              aria-label={`View ${username}'s profile`}
            >
              {part}
            </Link>
          );
        }
        // URL
        else if (part.match(/https?:\/\/[^\s]+/)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              aria-label={`Visit external link: ${part}`}
            >
              {part}
            </a>
          );
        }
        // Regular text
        else {
          return <span key={index}>{part}</span>;
        }
      })}
    </p>
  );
};

export default CaptionWithLinks;