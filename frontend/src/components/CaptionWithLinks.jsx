import { Link } from 'react-router-dom';

const CaptionWithLinks = ({ caption, author }) => {
  if (!caption) return null;

  const parts = caption.split(/(\s+)/);

  return (
    <p className="mb-2 dark:text-white">
      <Link
        to={`/profile/${author.username}`}
        className="font-semibold mr-2 hover:underline"
      >
        {author.username}
      </Link>
      {parts.map((part, index) => {
        // Hashtag
        if (part.startsWith('#')) {
          return (
            <Link
              key={index}
              to={`/explore/tags/${part.substring(1)}`}
              className="text-primary hover:underline"
            >
              {part}
            </Link>
          );
        }
        // Mention
        else if (part.startsWith('@')) {
          return (
            <Link
              key={index}
              to={`/profile/${part.substring(1)}`}
              className="text-primary hover:underline"
            >
              {part}
            </Link>
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
