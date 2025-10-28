import mongoose from 'mongoose';

const videoCallSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['calling', 'ongoing', 'ended', 'missed', 'rejected'],
      default: 'calling',
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
  },
  {
    timestamps: true,
  }
);

const VideoCall = mongoose.model('VideoCall', videoCallSchema);

export default VideoCall;
