/**
 * Utility functions for handling media permissions
 */

/**
 * Request camera permission
 * @returns {Promise<boolean>} True if permission granted, false otherwise
 */
export const requestCameraPermission = async () => {
  try {
    // First check if we can access media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Media devices API not supported');
      return false;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop all tracks to release the camera
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
};

/**
 * Request microphone permission
 * @returns {Promise<boolean>} True if permission granted, false otherwise
 */
export const requestMicrophonePermission = async () => {
  try {
    // First check if we can access media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Media devices API not supported');
      return false;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks to release the microphone
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};

/**
 * Request both camera and microphone permissions
 * @returns {Promise<{camera: boolean, microphone: boolean}>} Permission status for both devices
 */
export const requestCameraAndMicrophonePermissions = async () => {
  let cameraPermission = false;
  let microphonePermission = false;
  
  try {
    // First check if we can access media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Media devices API not supported');
      return { camera: false, microphone: false };
    }
    
    // Try to get both at once
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    // Check which tracks we got
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();
    
    cameraPermission = videoTracks.length > 0;
    microphonePermission = audioTracks.length > 0;
    
    // Stop all tracks to release the devices
    stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('Error requesting permissions:', error);
    
    // Try individually if combined request failed
    try {
      cameraPermission = await requestCameraPermission();
    } catch (e) {
      console.error('Camera permission error:', e);
    }
    
    try {
      microphonePermission = await requestMicrophonePermission();
    } catch (e) {
      console.error('Microphone permission error:', e);
    }
  }
  
  return {
    camera: cameraPermission,
    microphone: microphonePermission
  };
};

/**
 * Check if permissions have already been granted
 * @returns {Promise<{camera: boolean, microphone: boolean}>} Current permission status
 */
export const checkPermissions = async () => {
  let cameraPermission = false;
  let microphonePermission = false;
  
  if (navigator.permissions) {
    try {
      const cameraPermissionStatus = await navigator.permissions.query({ name: 'camera' });
      cameraPermission = cameraPermissionStatus.state === 'granted';
      
      const microphonePermissionStatus = await navigator.permissions.query({ name: 'microphone' });
      microphonePermission = microphonePermissionStatus.state === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }
  
  return {
    camera: cameraPermission,
    microphone: microphonePermission
  };
};

export default {
  requestCameraPermission,
  requestMicrophonePermission,
  requestCameraAndMicrophonePermissions,
  checkPermissions
};