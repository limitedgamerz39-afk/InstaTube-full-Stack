import { useState, useEffect, useRef } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy', 
  priority = false,
  sizes = '100vw',
  quality = 80,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // For local images, use directly
    if (src.startsWith('/') || src.startsWith('http://localhost') || src.startsWith('https://ui-avatars.com')) {
      setImageSrc(src);
      return;
    }

    // For remote images, we could implement optimization here
    // For now, we'll just use the original src
    setImageSrc(src);
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    // Fallback to a default avatar if the image fails to load
    if (src && !src.includes('default')) {
      setImageSrc('/default-avatar.png');
    }
  };

  // Add blur placeholder effect
  const blurPlaceholder = !loaded && !error;

  return (
    <img
      ref={imgRef}
      src={imageSrc || '/default-avatar.png'}
      alt={alt}
      className={`
        ${className}
        ${blurPlaceholder ? 'blur-sm' : ''}
        transition-all duration-300
      `}
      loading={priority ? 'eager' : loading}
      sizes={sizes}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default OptimizedImage;