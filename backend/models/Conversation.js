import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    readReceiptsDisabledBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    typingIndicatorDisabledBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    messageExpiryHours: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure participants array has exactly 2 users
conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  next();
});

// Index for faster queries
conversationSchema.index({ participants: 1, lastActivity: -1 });
conversationSchema.index({ starredBy: 1 });
conversationSchema.index({ archivedBy: 1 });

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function (user1Id, user2Id) {
  let conversation = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
  });

  if (!conversation) {
    conversation = await this.create({
      participants: [user1Id, user2Id],
    });
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
