export const AD_CONFIG = {
  enabled: true,
  
  adsense: {
    client: 'ca-pub-XXXXXXXXXX',
    slots: {
      feedAd: '1234567890',
      sidebarAd: '0987654321',
      footerAd: '1122334455',
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
    },
    midRoll: {
      enabled: true,
      interval: 300,
      duration: 5,
      skipAfter: 3,
    },
    postRoll: {
      enabled: false,
      duration: 5,
      skipAfter: 2,
    }
  },
  
  reelsAds: {
    enabled: true,
    frequency: 4,
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
