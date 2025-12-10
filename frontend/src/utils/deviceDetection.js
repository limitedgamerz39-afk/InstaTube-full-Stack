/**
 * Device detection utilities
 */

// Check if the user is on a mobile device
export const isMobileDevice = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Check if the user is on a tablet
export const isTablet = () => {
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
};

// Check if the user is on a desktop
export const isDesktop = () => {
  return !isMobileDevice() && !isTablet();
};

// Get the device type
export const getDeviceType = () => {
  if (isMobileDevice()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

// Redirect mobile users to the mobile shorts recorder if they're trying to access the regular upload
export const redirectToMobileRecorder = (navigate) => {
  if (isMobileDevice() && window.location.hash !== '#/shorts/mobile') {
    navigate('/shorts/mobile');
    return true;
  }
  return false;
};

export default {
  isMobileDevice,
  isTablet,
  isDesktop,
  getDeviceType,
  redirectToMobileRecorder
};