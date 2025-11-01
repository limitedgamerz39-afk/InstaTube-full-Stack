import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Stream title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    streamKey: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['live', 'ended', 'scheduled'],
      default: 'live',
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentViewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    scheduledFor: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    recording: {
      available: {
        type: Boolean,
        default: false,
      },
      url: {
        type: String,
      },
    },
    // Super Chat / Monetization
    superChats: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        amount: {
          type: Number,
          required: true,
        },
        message: {
          type: String,
          maxlength: 200,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        highlighted: {
          type: Boolean,
          default: true,
        },
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['gaming', 'music', 'sports', 'education', 'entertainment', 'news', 'tech', 'other'],
      default: 'other',
    },
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
liveStreamSchema.index({ host: 1, status: 1 });
liveStreamSchema.index({ status: 1, createdAt: -1 });

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

export default LiveStream;
