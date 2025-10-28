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
      required: [true, 'Highlight title is required'],
      maxlength: [50, 'Title cannot exceed 50 characters'],
    },
    coverImage: {
      type: String,
      required: true,
    },
    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
highlightSchema.index({ user: 1, order: 1 });

const Highlight = mongoose.model('Highlight', highlightSchema);

export default Highlight;
