# InstaTube Ads Integration Guide

This document explains how to integrate various ad formats from YouTube, Instagram, and Facebook into the InstaTube platform.

## Table of Contents
1. [YouTube Ads Integration](#youtube-ads-integration)
2. [Instagram Ads Integration](#instagram-ads-integration)
3. [Facebook Ads Integration](#facebook-ads-integration)
4. [Implementation Components](#implementation-components)
5. [Integration Points](#integration-points)
6. [Configuration](#configuration)

## YouTube Ads Integration

### 1. Skippable In-Stream Ads
- **Component**: `VideoAd` with `adFormat="skippable"`
- **Placement**: Before, during, or after video content
- **Features**: 
  - 5-second skip button delay
  - 15-second maximum duration
  - Mock content with brand information

### 2. Non-Skippable In-Stream Ads
- **Component**: `VideoAd` with `adFormat="non-skippable"`
- **Placement**: Before, during, or after video content
- **Features**:
  - No skip option
  - 15-second fixed duration

### 3. Bumper Ads
- **Component**: `VideoAd` with `adFormat="bumper"`
- **Placement**: Before, during, or after video content
- **Features**:
  - 6-second duration
  - No skip option

### 4. In-Feed Video Ads
- **Component**: `FeedAdCard`
- **Placement**: Within video feed/posts
- **Features**:
  - Google AdSense integration
  - Close button
  - Sponsored label

### 5. Overlay Ads
- **Component**: `OverlayAd`
- **Placement**: Over video content
- **Features**:
  - Positionable (top-left, top-right, bottom-left, bottom-right)
  - Close button
  - Transparent background

### 6. Masthead Ads
- **Component**: `MastheadAd`
- **Placement**: Top of homepage
- **Features**:
  - Full-width banner
  - Call-to-action button
  - Close button

### 7. Shorts Ads
- **Component**: Integrated with Reels functionality
- **Placement**: Within short-form video feed
- **Features**:
  - Configurable frequency
  - Same format as regular Reels

## Instagram Ads Integration

### 1. Photo Ads
- **Component**: Enhanced `FeedAdCard` with image content
- **Placement**: Within photo/feed posts
- **Features**:
  - High-quality image display
  - Caption and call-to-action

### 2. Video Ads
- **Component**: Enhanced `FeedAdCard` with video content
- **Placement**: Within video/feed posts
- **Features**:
  - Video player with play button
  - Autoplay on hover

### 3. Carousel Ads
- **Component**: `CarouselAd`
- **Placement**: Within feed posts
- **Features**:
  - Swipeable images
  - Navigation dots
  - Previous/next buttons

### 4. Stories Ads
- **Component**: `StoriesAd`
- **Placement**: Within Stories bar
- **Features**:
  - Vertical format
  - Progress bar
  - Close button

### 5. Reels Ads
- **Component**: Integrated with Reels functionality
- **Placement**: Within Reels feed
- **Features**:
  - Same format as user Reels
  - Configurable frequency

### 6. Explore Ads
- **Component**: `FeedAdCard` in Explore section
- **Placement**: Within Explore page
- **Features**:
  - Discovery-focused layout
  - Trending topics integration

### 7. Shopping Ads
- **Component**: Conceptual implementation (requires product tagging)
- **Placement**: Within feed or product pages
- **Features**:
  - Price tags on products
  - Shopping cart integration

### 8. Collection Ads
- **Component**: Conceptual implementation (requires catalog system)
- **Placement**: Dedicated ad placements
- **Features**:
  - Grid layout of products
  - Collection browsing

## Facebook Ads Integration

### 1. Image Ads
- **Component**: Enhanced `FeedAdCard` with image content
- **Placement**: Within feed posts
- **Features**:
  - High-quality image display
  - Link preview

### 2. Video Ads
- **Component**: Enhanced `FeedAdCard` with video content
- **Placement**: Within feed posts
- **Features**:
  - Video player with sound controls
  - Autoplay options

### 3. Carousel Ads
- **Component**: `CarouselAd`
- **Placement**: Within feed posts
- **Features**:
  - Multiple cards in a single ad
  - Individual links per card

### 4. Slideshow Ads
- **Component**: Conceptual implementation
- **Placement**: Within feed posts
- **Features**:
  - Sequence of images
  - Animation effects

### 5. Collection Ads
- **Component**: Conceptual implementation (requires catalog system)
- **Placement**: Dedicated placements
- **Features**:
  - Product showcase
  - Category browsing

### 6. Instant Experience Ads
- **Component**: Conceptual implementation (requires full-screen)
- **Placement**: Dedicated placements
- **Features**:
  - Immersive experience
  - Rich media content

### 7. Lead Ads
- **Component**: Conceptual implementation (requires form system)
- **Placement**: Within feed
- **Features**:
  - Form pre-fill
  - Privacy compliance

### 8. Dynamic Ads
- **Component**: Conceptual implementation (requires personalization)
- **Placement**: Various placements
- **Features**:
  - Personalized content
  - Retargeting capabilities

### 9. Messenger Ads
- **Component**: Conceptual implementation (requires messaging)
- **Placement**: Within Messenger
- **Features**:
  - Conversation starters
  - Automated responses

### 10. Stories Ads
- **Component**: `StoriesAd`
- **Placement**: Within Stories bar
- **Features**:
  - Full-screen vertical format
  - Interactive elements

### 11. Poll Ads
- **Component**: `PollAd`
- **Placement**: Within feed
- **Features**:
  - Interactive voting
  - Real-time results

### 12. Playable Ads
- **Component**: Conceptual implementation (requires mini-games)
- **Placement**: Within feed
- **Features**:
  - Interactive demos
  - Game-like experience

### 13. Augmented Reality Ads
- **Component**: Conceptual implementation (requires AR)
- **Placement**: Camera-enabled placements
- **Features**:
  - 3D object placement
  - Virtual try-ons

### 14. Offer Ads
- **Component**: Conceptual implementation (requires coupons)
- **Placement**: Within feed
- **Features**:
  - Discount codes
  - Expiration dates

## Implementation Components

All ad components are located in `frontend/src/components/`:

1. `VideoAd.jsx` - For YouTube-style video ads
2. `FeedAdCard.jsx` - For standard feed ads
3. `CarouselAd.jsx` - For carousel/swipeable ads
4. `OverlayAd.jsx` - For overlay ads on video content
5. `MastheadAd.jsx` - For homepage banner ads
6. `StoriesAd.jsx` - For Stories format ads
7. `PollAd.jsx` - For interactive poll ads

Utility functions are in `frontend/src/utils/adConfig.js`:

1. `AD_CONFIG` - Centralized ad configuration
2. Helper functions for determining ad placement

## Integration Points

### Homepage
- Masthead ads at the top
- Feed ads interspersed with content
- Stories ads in the Stories bar

### Video Pages
- Pre-roll, mid-roll, and post-roll video ads
- Overlay ads during playback
- End-screen recommendations

### Feed/Discovery
- In-feed ads between posts
- Carousel ads for product showcases
- Poll ads for engagement

### Reels/Shorts
- Video ads between short-form content
- Same format as user-generated content

### Explore Page
- Discovery-focused ads
- Trending topic integrations

## Configuration

The ad system is configured through `AD_CONFIG` in `adConfig.js`. Key configuration options include:

1. **Global Settings**
   - `enabled`: Enable/disable all ads
   - `adsense`: Google AdSense settings

2. **Platform-Specific Settings**
   - `youtubeAds`: YouTube ad formats and frequencies
   - `instagramAds`: Instagram ad formats and frequencies
   - `facebookAds`: Facebook ad formats and frequencies

3. **Helper Functions**
   - `shouldShowFeedAd()`: Determines feed ad placement
   - `shouldShowReelAd()`: Determines Reels ad placement
   - Platform-specific helpers for YouTube, Instagram, and Facebook

## Mock Data Usage

All ad components use mock data for demonstration purposes:
- Images use placeholder services
- Text content is hardcoded for examples
- Interactive elements simulate real functionality

To integrate with real ad networks:
1. Replace placeholder images with actual ad creatives
2. Connect `AdSense` component to real AdSense account
3. Implement server-side ad serving for video ads
4. Add tracking pixels for analytics

## Future Enhancements

1. **Real Ad Network Integration**
   - Google Ad Manager for video ads
   - Facebook Audience Network for social ads
   - Programmatic ad serving

2. **Advanced Targeting**
   - User behavior tracking
   - Demographic targeting
   - Interest-based targeting

3. **Performance Analytics**
   - Click-through rate tracking
   - Conversion tracking
   - Revenue reporting

4. **Advanced Features**
   - Product tagging for shopping ads
   - Catalog management for collection ads
   - AR framework for immersive ads
   - Mini-game framework for playable ads