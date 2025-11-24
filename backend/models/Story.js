import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    caption: {
      type: String,
      maxlength: [200, 'Caption cannot exceed 200 characters'],
      trim: true,
    },
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 }, // Auto-delete when expired
    },
    // New fields for Instagram-like features
    effect: {
      type: String,
      enum: ['none', 'flowers', 'hearts', 'fireworks', 'sunglasses', 'crown', 'animal_ears', 'rainbow'],
      default: 'none',
    },
    productTags: [
      {
        x: Number,
        y: Number,
        product: String,
      }
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: -1 });

const Story = mongoose.model('Story', storySchema);

export default Story;