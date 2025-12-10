// Test utility to verify mobile redirect functionality
export const testMobileRedirect = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log('Is mobile device:', isMobile);
  console.log('User agent:', navigator.userAgent);
  return isMobile;
};

// Test the redirect functionality
export const testRedirect = (navigate) => {
  const isMobile = testMobileRedirect();
  if (isMobile) {
    console.log('Would redirect to mobile shorts recorder');
    // In a real implementation, this would navigate to '/shorts/mobile'
    return '/shorts/mobile';
  } else {
    console.log('Would redirect to regular upload');
    // In a real implementation, this would navigate to '/upload'
    return '/upload';
  }
};

export default {
  testMobileRedirect,
  testRedirect
};