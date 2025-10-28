import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [50, 'Group name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?name=Group&background=8B5CF6&color=fff',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroupMessage',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ admin: 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;
