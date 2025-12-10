export const AD_CONFIG = {
  enabled: true,
  
  adsense: {
    client: 'ca-pub-XXXXXXXXXX',
    slots: {
      feedAd: '1234567890',
      sidebarAd: '0987654321',
      footerAd: '1122334455',
      mastheadAd: '5566778899',
      overlayAd: '9988776655'
    }
  },
  
  feedAds: {
    frequency: 5,
    position: 'after',
  },
  
  videoAds: {
    preRoll: {
      enabled: true,
      duration: 5,
      skipAfter: 3,
      formats: {
        skippable: { duration: 15, skipAfter: 5 },
        nonSkippable: { duration: 15, skipAfter: 15 },
        bumper: { duration: 6, skipAfter: 6 }
      }
    },
    midRoll: {
      enabled: true,
      interval: 300,
      duration: 5,
      skipAfter: 3,
    },
    postRoll: {
      enabled: true,
      duration: 5,
      skipAfter: 2,
    }
  },
  
  reelsAds: {
    enabled: true,
    frequency: 4,
  },
  
  // New ad formats configuration
  youtubeAds: {
    skippableInStream: {
      enabled: true,
      skipAfter: 5,
      maxDuration: 15
    },
    nonSkippableInStream: {
      enabled: true,
      duration: 15
    },
    bumper: {
      enabled: true,
      duration: 6
    },
    inFeed: {
      enabled: true,
      frequency: 5
    },
    overlay: {
      enabled: true,
      position: 'bottom'
    },
    masthead: {
      enabled: true,
      position: 'top'
    },
    shorts: {
      enabled: true,
      frequency: 3
    }
  },
  
  instagramAds: {
    photo: {
      enabled: true,
      frequency: 6
    },
    video: {
      enabled: true,
      frequency: 6
    },
    carousel: {
      enabled: true,
      frequency: 7
    },
    stories: {
      enabled: true,
      frequency: 4
    },
    reels: {
      enabled: true,
      frequency: 4
    },
    explore: {
      enabled: true,
      frequency: 8
    },
    shopping: {
      enabled: false, // Requires product tagging system
      frequency: 10
    },
    collection: {
      enabled: false, // Requires catalog system
      frequency: 12
    }
  },
  
  facebookAds: {
    image: {
      enabled: true,
      frequency: 6
    },
    video: {
      enabled: true,
      frequency: 6
    },
    carousel: {
      enabled: true,
      frequency: 7
    },
    slideshow: {
      enabled: true,
      frequency: 8
    },
    collection: {
      enabled: false, // Requires catalog system
      frequency: 12
    },
    instantExperience: {
      enabled: false, // Requires full-screen implementation
      frequency: 15
    },
    lead: {
      enabled: false, // Requires form system
      frequency: 20
    },
    dynamic: {
      enabled: false, // Requires personalization engine
      frequency: 10
    },
    messenger: {
      enabled: false, // Requires messaging integration
      frequency: 15
    },
    stories: {
      enabled: true,
      frequency: 4
    },
    poll: {
      enabled: true,
      frequency: 10
    },
    playable: {
      enabled: false, // Requires mini-game framework
      frequency: 20
    },
    augmentedReality: {
      enabled: false, // Requires AR implementation
      frequency: 25
    },
    offer: {
      enabled: false, // Requires coupon system
      frequency: 15
    }
  }
};

export const shouldShowFeedAd = (index) => {
  if (!AD_CONFIG.enabled || !AD_CONFIG.feedAds) return false;
  return (index + 1) % AD_CONFIG.feedAds.frequency === 0;
};

export const shouldShowReelAd = (index) => {
  if (!AD_CONFIG.enabled || !AD_CONFIG.reelsAds.enabled) return false;
  return (index + 1) % AD_CONFIG.reelsAds.frequency === 0;
};

// New helper functions for different ad types
export const shouldShowYouTubeAd = (adType, index) => {
  const config = AD_CONFIG.youtubeAds[adType];
  if (!config || !config.enabled) return false;
  return (index + 1) % config.frequency === 0;
};

export const shouldShowInstagramAd = (adType, index) => {
  const config = AD_CONFIG.instagramAds[adType];
  if (!config || !config.enabled) return false;
  return (index + 1) % config.frequency === 0;
};

export const shouldShowFacebookAd = (adType, index) => {
  const config = AD_CONFIG.facebookAds[adType];
  if (!config || !config.enabled) return false;
  return (index + 1) % config.frequency === 0;
};