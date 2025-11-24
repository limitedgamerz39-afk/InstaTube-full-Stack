import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema(
  {
    // Reference to the original post/video
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    // User who extracted the audio
    extractedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Audio file URL
    audioUrl: {
      type: String,
      required: true,
    },
    // Original video title/description
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    // Duration in seconds
    durationSec: {
      type: Number,
    },
    // File size in bytes
    fileSize: {
      type: Number,
    },
    // Format (mp3, wav, etc.)
    format: {
      type: String,
      default: 'mp3',
    },
    // Visibility settings
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
    },
    // Tags for the audio
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // View count
    views: {
      type: Number,
      default: 0,
    },
    // Download count
    downloads: {
      type: Number,
      default: 0,
    },
    // Whether this audio can be used in remixes
    allowRemix: {
      type: Boolean,
      default: true,
    },
    // License information
    license: {
      type: String,
      enum: ['standard', 'creative_commons'],
      default: 'standard',
    },
    // Posts that use this audio
    usedInPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
audioSchema.index({ originalPost: 1 });
audioSchema.index({ extractedBy: 1 });
audioSchema.index({ createdAt: -1 });
audioSchema.index({ views: -1 });
audioSchema.index({ downloads: -1 });
audioSchema.index({ usedInPosts: 1 });

const Audio = mongoose.model('Audio', audioSchema);

export default Audio;