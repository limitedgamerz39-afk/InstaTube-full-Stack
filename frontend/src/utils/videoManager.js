// Video Manager to control video playback across the application
// Ensures only one video plays at a time

class VideoManager {
  constructor() {
    this.activeVideo = null;
    this.registeredVideos = new Set();
  }

  // Register a video element
  registerVideo(videoElement) {
    this.registeredVideos.add(videoElement);
  }

  // Unregister a video element
  unregisterVideo(videoElement) {
    this.registeredVideos.delete(videoElement);
    if (this.activeVideo === videoElement) {
      this.activeVideo = null;
    }
  }

  // Play a video and pause all others
  playVideo(videoElement) {
    // Pause the currently active video
    if (this.activeVideo && this.activeVideo !== videoElement) {
      this.activeVideo.pause();
    }

    // Set this video as the active one
    this.activeVideo = videoElement;

    // Play the requested video
    return videoElement.play();
  }

  // Pause a specific video
  pauseVideo(videoElement) {
    if (this.activeVideo === videoElement) {
      this.activeVideo = null;
    }
    videoElement.pause();
  }

  // Pause all videos
  pauseAllVideos() {
    this.registeredVideos.forEach(video => {
      video.pause();
    });
    this.activeVideo = null;
  }
}

// Create a singleton instance
const videoManager = new VideoManager();

export default videoManager;