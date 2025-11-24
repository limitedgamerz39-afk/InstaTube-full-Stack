// Simple device detection based on user agent
export const detectDevice = (userAgent) => {
  if (!userAgent) return { deviceType: 'other', browser: 'unknown', os: 'unknown' };
  
  let deviceType = 'other';
  let browser = 'unknown';
  let os = 'unknown';
  
  // Detect device type
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }
  
  // Detect browser
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/opera|opr/i.test(userAgent)) {
    browser = 'Opera';
  }
  
  // Detect OS
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iphone|ipad/i.test(userAgent)) {
    os = 'iOS';
  }
  
  return { deviceType, browser, os };
};

// Simple IP geolocation (in a real app, you would use a service like MaxMind or IPinfo)
export const getGeolocation = (ipAddress) => {
  // This is a placeholder - in production, you would call a geolocation API
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown'
  };
};

export default {
  detectDevice,
  getGeolocation
};