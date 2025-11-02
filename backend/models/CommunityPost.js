import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Community post content is required'],
      trim: true,
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'poll', 'video'],
      default: 'text',
    },
    media: {
      url: String,
      type: {
        type: String,
        enum: ['image', 'video'],
      },
    },
    poll: {
      question: String,
      options: [
        {
          text: String,
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
        },
      ],
      expiresAt: Date,
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
    pinned: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ['public', 'subscribers'],
      default: 'public',
    },
  },
  {
    timestamps: true,
  }
);

communityPostSchema.index({ creator: 1, createdAt: -1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

export default CommunityPost;
