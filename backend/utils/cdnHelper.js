// CDN Helper functions for static asset optimization

/**
 * Generate CDN URL for static assets
 * @param {string} assetPath - Path to the asset
 * @param {string} cdnBaseUrl - Base URL of the CDN
 * @returns {string} Full CDN URL
 */
export const generateCDNUrl = (assetPath, cdnBaseUrl = process.env.CDN_BASE_URL) => {
  if (!cdnBaseUrl) {
    // Fallback to local path if CDN is not configured
    return assetPath;
  }
  
  // Ensure the asset path doesn't start with a slash if CDN URL ends with one
  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
  
  // Ensure CDN URL ends with a slash
  const normalizedCdnUrl = cdnBaseUrl.endsWith('/') ? cdnBaseUrl : `${cdnBaseUrl}/`;
  
  return `${normalizedCdnUrl}${normalizedAssetPath}`;
};

/**
 * Optimize image for CDN delivery
 * @param {string} imageUrl - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized CDN URL
 */
export const optimizeImageForCDN = (imageUrl, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover'
  } = options;
  
  // If it's already a CDN URL, modify the parameters
  if (imageUrl.includes('cdn.') || imageUrl.includes('cloudinary') || imageUrl.includes('imgix')) {
    // Add optimization parameters to existing CDN URL
    const separator = imageUrl.includes('?') ? '&' : '?';
    const params = [];
    
    if (width) params.push(`w=${width}`);
    if (height) params.push(`h=${height}`);
    if (quality) params.push(`q=${quality}`);
    if (format) params.push(`f=${format}`);
    if (fit) params.push(`fit=${fit}`);
    
    return `${imageUrl}${separator}${params.join('&')}`;
  }
  
  // If no CDN is configured, return original URL
  if (!process.env.CDN_BASE_URL) {
    return imageUrl;
  }
  
  // Generate CDN URL with optimization parameters
  const cdnUrl = generateCDNUrl(imageUrl);
  const separator = cdnUrl.includes('?') ? '&' : '?';
  const params = [];
  
  if (width) params.push(`w=${width}`);
  if (height) params.push(`h=${height}`);
  if (quality) params.push(`q=${quality}`);
  if (format) params.push(`f=${format}`);
  if (fit) params.push(`fit=${fit}`);
  
  return `${cdnUrl}${separator}${params.join('&')}`;
};

/**
 * Prefetch critical assets for better performance
 * @param {Array} assets - Array of asset URLs to prefetch
 */
export const prefetchAssets = (assets) => {
  if (typeof window === 'undefined') return; // Only run in browser
  
  assets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = generateCDNUrl(asset);
    document.head.appendChild(link);
  });
};

/**
 * Preload critical assets for immediate use
 * @param {Array} assets - Array of asset URLs to preload
 */
export const preloadAssets = (assets) => {
  if (typeof window === 'undefined') return; // Only run in browser
  
  assets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = generateCDNUrl(asset);
    link.as = getAssetType(asset);
    document.head.appendChild(link);
  });
};

/**
 * Determine asset type for preload
 * @param {string} assetUrl - URL of the asset
 * @returns {string} Asset type
 */
const getAssetType = (assetUrl) => {
  if (assetUrl.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) return 'image';
  if (assetUrl.match(/\.(css)$/i)) return 'style';
  if (assetUrl.match(/\.(js)$/i)) return 'script';
  if (assetUrl.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
  return 'fetch';
};

/**
 * Configure CDN headers for static assets
 * @param {Object} res - Express response object
 * @param {string} assetType - Type of asset
 */
export const setCdnHeaders = (res, assetType = 'default') => {
  const cacheControl = {
    'images': 'public, max-age=31536000, immutable', // 1 year
    'css': 'public, max-age=31536000, immutable', // 1 year
    'js': 'public, max-age=31536000, immutable', // 1 year
    'fonts': 'public, max-age=31536000, immutable', // 1 year
    'default': 'public, max-age=86400' // 1 day
  };
  
  res.setHeader('Cache-Control', cacheControl[assetType] || cacheControl['default']);
  res.setHeader('CDN-Cache-Control', cacheControl[assetType] || cacheControl['default']);
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
};