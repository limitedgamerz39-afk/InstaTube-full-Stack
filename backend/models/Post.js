import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
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
          default: 'image',
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
      default: 'image',
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
    pinnedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    hashtags: [
      {
        type: String,
        trim: true,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
    },
    madeForKids: {
      type: Boolean,
      default: false,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
    },
    videoLanguage: {
      type: String,
      trim: true,
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
    playlistName: {
      type: String,
      trim: true,
    },
    paidPromotion: {
      type: Boolean,
      default: false,
    },
    ageRestricted: {
      type: Boolean,
      default: false,
    },
    allowEmbedding: {
      type: Boolean,
      default: true,
    },
    locationLat: { type: Number },
    locationLng: { type: Number },
    category: {
      type: String,
      enum: ['image', 'short', 'long'],
      default: 'image',
    },
    durationSec: {
      type: Number,
    },
    derivedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    remixType: {
      type: String,
      enum: ['duet', 'remix'],
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    videoStartSec: { type: Number },
    videoEndSec: { type: Number },
    playbackRate: { type: Number },
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
