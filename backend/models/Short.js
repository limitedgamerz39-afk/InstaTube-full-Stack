import mongoose from 'mongoose';

const shortSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    trim: true,
    default: '',
  },
  media: [
    {
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['image', 'video'],
        default: 'video',
      },
    },
  ],
  // Keep for backward compatibility
  mediaUrl: {
    type: String,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'video',
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  category: {
    type: String,
    enum: ['short'],
    default: 'short',
    index: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public',
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  location: {
    name: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  scheduledAt: {
    type: Date,
  },
  // D4D HUB-style metadata
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  thumbnail: {
    type: String,
  },
  durationSec: {
    type: Number,
  },
  videoLanguage: {
    type: String,
    default: 'en',
  },
  license: {
    type: String,
    enum: ['standard', 'creative_commons'],
    default: 'standard',
  },
  topicCategory: {
    type: String,
    trim: true,
  },
  madeForKids: {
    type: Boolean,
    default: false,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
  paidPromotion: {
    type: Boolean,
    default: false,
  },
  ageRestricted: {
    type: Boolean,
    default: false,
  },
  contentWarnings: [
    {
      type: String,
      enum: ['violence', 'sexual', 'nudity', 'profanity', 'drugs', 'alcohol', 'gambling', 'horror', 'other'],
    }
  ],
  customWarning: {
    type: String,
    maxlength: [200, 'Custom warning cannot exceed 200 characters'],
  },
  allowEmbedding: {
    type: Boolean,
    default: true,
  },
  keywords: [
    {
      type: String,
      trim: true,
    },
  ],
  // Video editing features
  videoStartSec: {
    type: Number,
  },
  videoEndSec: {
    type: Number,
  },
  playbackRate: {
    type: Number,
  },
  // Collaboration features
  pinnedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  chapters: [
    {
      timestamp: {
        type: Number,
        required: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Chapter title cannot exceed 100 characters'],
      },
    },
  ],
  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  // New Instagram-like features
  filter: {
    type: String,
    default: 'normal',
  },
  beautyFilter: {
    type: String,
    default: 'none',
  },
  productTags: [
    {
      x: Number,
      y: Number,
      product: String,
    }
  ],
  isBusinessProfile: {
    type: Boolean,
    default: false,
  },
  shoppingCartEnabled: {
    type: Boolean,
    default: false,
  },
  checkInLocation: {
    name: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
  },
  highlightTitle: {
    type: String,
    trim: true,
    maxlength: [50, 'Highlight title cannot exceed 50 characters'],
  },
  igtvTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'IGTV title cannot exceed 100 characters'],
  },
  views: {
    type: Number,
    default: 0,
  },
  // Audio association for reels and stories
  audio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio',
  },
}, {
  timestamps: true
});

// ✅ Add comprehensive indexes for better query performance
shortSchema.index({ author: 1 });
shortSchema.index({ createdAt: -1 });
shortSchema.index({ likes: 1 });
shortSchema.index({ views: 1 });
shortSchema.index({ category: 1 });
shortSchema.index({ tags: 1 });
shortSchema.index({ privacy: 1 });
shortSchema.index({ scheduledAt: 1 });
shortSchema.index({ author: 1, createdAt: -1 }); // Compound index for user posts
shortSchema.index({ category: 1, createdAt: -1 }); // Compound index for category feeds
shortSchema.index({ 
  title: 'text', 
  description: 'text' 
}); // Text index for search

const Short = mongoose.model('Short', shortSchema);

export default Short;