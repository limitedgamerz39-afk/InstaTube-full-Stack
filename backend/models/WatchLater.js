import mongoose from 'mongoose';

const watchLaterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    videos: [
      {
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

watchLaterSchema.index({ user: 1 });
watchLaterSchema.index({ 'videos.post': 1 });

const WatchLater = mongoose.model('WatchLater', watchLaterSchema);

export default WatchLater;
