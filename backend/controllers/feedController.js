import Post from "../models/Post.js";
import CommunityPost from "../models/CommunityPost.js";
import User from "../models/User.js";

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get current user
    const currentUser = await User.findById(req.user._id);
    
    // 1) Fetch All Content with proper pagination
    // Instead of fetching all posts and then applying pattern, we'll fetch posts in batches
    const allPosts = await Post.find({ 
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true }
    })
    .sort({ createdAt: -1 })
    .populate('author', 'username fullName avatar')
    .skip(skip)
    .limit(limit * 2); // Fetch more to ensure we have enough for the pattern

    const community = await CommunityPost.find({ 
      creator: { $in: [...currentUser.subscribed, currentUser._id] }
    })
    .sort({ createdAt: -1 })
    .populate('creator', 'username fullName avatar')
    .skip(skip)
    .limit(limit); // Fetch community posts

    // 2) Categorize posts
    const longVideos = allPosts.filter(p => p.category === "long");
    const reels = allPosts.filter(p => p.category === "short");
    const images = allPosts.filter(p => p.category === "image");

    // 3) Enhanced Alternating Pattern for Better UX
    // Pattern alternates between long videos and reels with some images and community posts
    const pattern = [
      "long", "reel", "long", "reel",
      "long", "image", "reel", "community",
      "long", "reel", "long", "reel"
    ];

    const feed = [];
    let iLV = 0, iR = 0, iI = 0, iC = 0;

    // Apply the pattern to create the mixed feed
    for (let i = 0; i < pattern.length && feed.length < limit; i++) {
      const type = pattern[i];
      
      switch (type) {
        case "long":
          if (iLV < longVideos.length) {
            feed.push({ ...longVideos[iLV++].toObject(), type: "long" });
          }
          break;
        case "reel":
          if (iR < reels.length) {
            feed.push({ ...reels[iR++].toObject(), type: "reel" });
          }
          break;
        case "image":
          if (iI < images.length) {
            feed.push({ ...images[iI++].toObject(), type: "image" });
          }
          break;
        case "community":
          if (iC < community.length) {
            feed.push({ ...community[iC++].toObject(), type: "community" });
          }
          break;
      }
    }

    // If we still need more content, fill with remaining posts
    if (feed.length < limit) {
      // Add remaining long videos
      while (iLV < longVideos.length && feed.length < limit) {
        feed.push({ ...longVideos[iLV++].toObject(), type: "long" });
      }
      
      // Add remaining reels
      while (iR < reels.length && feed.length < limit) {
        feed.push({ ...reels[iR++].toObject(), type: "reel" });
      }
      
      // Add remaining images
      while (iI < images.length && feed.length < limit) {
        feed.push({ ...images[iI++].toObject(), type: "image" });
      }
      
      // Add remaining community posts
      while (iC < community.length && feed.length < limit) {
        feed.push({ ...community[iC++].toObject(), type: "community" });
      }
    }

    // Check if there are more posts available
    const totalLongVideos = await Post.countDocuments({ 
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true },
      category: "long"
    });
    
    const totalReels = await Post.countDocuments({ 
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true },
      category: "short"
    });
    
    const totalImages = await Post.countDocuments({ 
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true },
      category: "image"
    });
    
    const totalCommunity = await CommunityPost.countDocuments({ 
      creator: { $in: [...currentUser.subscribed, currentUser._id] }
    });

    const totalAvailable = totalLongVideos + totalReels + totalImages + totalCommunity;
    const hasMore = (skip + feed.length) < totalAvailable;

    // Fixed: Return data in the structure expected by the frontend
    return res.json({ 
      success: true,
      data: feed,
      pagination: {
        page,
        limit,
        total: feed.length,
        hasMore: hasMore,
        nextPage: hasMore ? page + 1 : null
      }
    });

  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};