# InstaTube Monetization Setup Guide

## Overview
InstaTube अब ads के साथ monetize किया जा सकता है। यह guide आपको Google AdSense integration और PWA installation के बारे में बताएगी।

## 📱 Progressive Web App (PWA) Installation

### PC/Desktop पर Install करें
1. Chrome, Edge, या Safari में अपनी InstaTube website खोलें
2. Address bar में install icon (⊕) दिखेगा
3. "Install" पर click करें
4. App अब आपके desktop पर एक native app की तरह चलेगी

### Mobile (Android/iOS) पर Install करें

**Android:**
1. Chrome browser में website खोलें
2. Menu (⋮) → "Add to Home screen" पर tap करें
3. App icon आपकी home screen पर add हो जाएगा

**iOS:**
1. Safari में website खोलें
2. Share button (□↑) tap करें
3. "Add to Home Screen" select करें
4. Home screen पर app icon दिखेगा

### PWA Features
- ✅ Offline access (बिना internet के भी काम करेगा)
- ✅ Push notifications
- ✅ Native app जैसा experience
- ✅ Fast loading
- ✅ App-like navigation

## 💰 Monetization Features

### 1. Feed Ads (Posts के बीच में Ads)

**कैसे काम करता है:**
- हर 5th post के बाद एक ad दिखाई देगा
- Users ad को close कर सकते हैं
- Development mode में placeholder ads दिखेंगे

**Configuration:**
File: `frontend/src/utils/adConfig.js`
```javascript
feedAds: {
  frequency: 5,  // हर 5th post के बाद ad
  position: 'after',
}
```

### 2. Video Ads (Reels/Stories में)

**Ad Types:**
- **Pre-roll**: Video start होने से पहले (5 seconds) - **Reels के लिए recommended**
- **Mid-roll**: Long videos (>5 minutes) के बीच में - **Shorts में नहीं**
- **Post-roll**: Video खत्म होने के बाद - **Optional**

**Important Note:**
- Reels/Shorts (≤60 seconds) में सिर्फ **pre-roll ads** show होंगे
- Mid-roll ads सिर्फ long-form videos (>5 minutes) के लिए हैं
  - ⚠️ **Current Status**: Reels page केवल shorts (≤60s) show करता है, इसलिए mid-roll ads currently inactive हैं
  - 💡 **Future**: अगर आप long-form video page add करें (जैसे YouTube regular videos या IGTV), तो mid-roll ads automatically काम करने लगेंगे
- Post-roll ads looping content के साथ intrusive हो सकते हैं (इसलिए disabled by default)

**Features:**
- 3 seconds के बाद "Skip Ad" button दिखता है
- Automatic countdown timer
- User-friendly interface
- Smart detection: Mid-roll केवल eligible videos पर ही trigger होगा

**Configuration:**
```javascript
videoAds: {
  preRoll: {
    enabled: true,
    duration: 5,      // Ad की length (seconds)
    skipAfter: 3,     // Skip button कब दिखे
  },
  midRoll: {
    enabled: true,
    interval: 300,    // 5 minutes के बाद (केवल long videos के लिए)
    duration: 5,
    skipAfter: 3,
  },
  postRoll: {
    enabled: false,   // Shorts के लिए disabled रखें
    duration: 5,
    skipAfter: 2,
  }
}
```

### 3. Reels Ads

हर 4th reel के बाद एक pre-roll video ad दिखाई देगी।

```javascript
reelsAds: {
  enabled: true,
  frequency: 4,  // हर 4th reel के बाद
}
```

## 🔧 Google AdSense Setup

### Step 1: AdSense Account बनाएं
1. https://www.google.com/adsense पर जाएं
2. "Get Started" पर click करें
3. अपनी website URL submit करें
4. Account verification complete करें

### Step 2: Ad Units Create करें

AdSense Dashboard में:
1. **Ads** → **By ad unit** → **Display ads** पर जाएं
2. तीन ad units create करें:
   - `Feed Ad` (Responsive)
   - `Sidebar Ad` (Responsive)
   - `Footer Ad` (Responsive)
3. प्रत्येक ad unit का **Ad Slot ID** copy करें

### Step 3: Configuration Update करें

File: `frontend/src/utils/adConfig.js`

```javascript
export const AD_CONFIG = {
  enabled: true,
  
  adsense: {
    client: 'ca-pub-YOUR_PUBLISHER_ID',  // ⬅️ अपना Client ID यहाँ डालें
    slots: {
      feedAd: 'YOUR_FEED_AD_SLOT_ID',    // ⬅️ Feed ad का slot ID
      sidebarAd: 'YOUR_SIDEBAR_SLOT_ID', // ⬅️ Sidebar ad का slot ID
      footerAd: 'YOUR_FOOTER_SLOT_ID',   // ⬅️ Footer ad का slot ID
    }
  },
  
  // ... rest of config
};
```

### Step 4: Website Verify करें

1. AdSense dashboard में अपनी website add करें
2. Verification code आपके `frontend/index.html` में already है
3. AdSense review process complete होने तक wait करें (1-7 days)

### Step 5: Ads Enable करें

Production deploy करने के बाद:
1. Ads automatically show होने लगेंगे
2. Development mode में placeholder ads दिखेंगे

## 📊 Revenue Optimization Tips

### Ad Placement
- ✅ Feed में natural placement (हर 5th post)
- ✅ Video ads को skip-able बनाएं (better UX)
- ✅ Mobile-friendly ad sizes use करें

### Ad Frequency
- कम ads = Better user experience
- ज्यादा ads = ज्यादा revenue but users unhappy
- **Recommended**: 5-7 posts के बाद एक ad

### Testing
```javascript
// Ads disable करने के लिए:
export const AD_CONFIG = {
  enabled: false,  // सभी ads temporarily disable
  // ...
}
```

## 💡 Advanced Features

### Custom Ad Networks

AdSense के अलावा आप ये भी use कर सकते हैं:
- **Media.net** (contextual ads)
- **PropellerAds** (pop-unders, native ads)
- **AdThrive** (premium content creators के लिए)
- **Ezoic** (AI-powered ad optimization)

### Affiliate Marketing

Products promote करें और commission earn करें:
```jsx
// Example: Amazon affiliate link in post
<a href="https://amzn.to/PRODUCT_ID" target="_blank">
  Buy Now
</a>
```

### Sponsored Posts

Brands के साथ partnership करें:
- ₹5,000 - ₹50,000 per sponsored post
- Dedicated post या story
- Analytics share करें (views, engagement)

## 🎯 Next Steps

1. ✅ **AdSense Account Setup** करें
2. ✅ **Ad Configuration** update करें
3. ✅ **Test करें** development में
4. ✅ **Deploy करें** production पर
5. ✅ **Monitor करें** ad performance

## 📞 Support

Questions? Check:
- Google AdSense Help Center
- InstaTube GitHub Issues
- Developer Documentation

---

**Remember**: 
- Ads से पहले अच्छा content बनाएं
- User experience को priority दें
- AdSense policies follow करें (no invalid clicks!)

Happy Monetizing! 💰
