import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Highlight title cannot exceed 50 characters'],
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
      },
    ],
    coverImage: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
highlightSchema.index({ user: 1, createdAt: -1 });

const Highlight = mongoose.model('Highlight', highlightSchema);

export default Highlight;