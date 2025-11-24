import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      validate: {
        validator: function(v) {
          // At least one uppercase, one lowercase, one number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      },
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '/default-avatar.png',
    },
    coverImage: {
      type: String,
      default: '/default-bg.jpg',
    },
    bio: {
      type: String,
      maxlength: [150, 'Bio cannot exceed 150 characters'],
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorBackupCodes: [
      {
        type: String,
      },
    ],
    role: {
      type: String,
      enum: ['user', 'creator', 'business', 'admin'],
      default: 'user',
    },
    roleUpgradeRequested: {
      type: Boolean,
      default: false,
    },
    roleUpgradeReason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    subscriber: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    subscribed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    // Shopping cart
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative'],
        },
      },
    ],
    // Premium Subscription
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumSince: {
      type: Date,
    },
    premiumExpiresAt: {
      type: Date,
    },
    premiumPlan: {
      type: String,
      enum: ['monthly', 'yearly', 'none'],
      default: 'none',
    },
    // Creator Monetization
    isMonetizationEnabled: {
      type: Boolean,
      default: false,
    },
    monetizationApproved: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
    totalWatchTime: {
      type: Number,
      default: 0, // in minutes
    },
    subscribersCount: {
      type: Number,
      default: 0,
    },
    // Shorts Fund
    shortsEarnings: {
      type: Number,
      default: 0,
    },
    lastShortsFundPayout: {
      type: Date,
    },
    totalShortViews: {
      type: Number,
      default: 0,
    },
    // Business Features
    businessProfile: {
      companyName: {
        type: String,
        trim: true,
      },
      businessCategory: {
        type: String,
        enum: ['retail', 'service', 'restaurant', 'entertainment', 'other'],
      },
      contactEmail: {
        type: String,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      },
      contactPhone: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      businessHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
      },
    },
    isBusinessProfileActive: {
      type: Boolean,
      default: false,
    },
    // Admin Features
    adminPermissions: {
      type: [String],
      enum: ['manage_users', 'manage_content', 'manage_reports', 'view_analytics', 'manage_settings'],
    },
    // Creator Features
    creatorFeatures: {
      canUploadLongVideos: {
        type: Boolean,
        default: false,
      },
      canSchedulePosts: {
        type: Boolean,
        default: false,
      },
      canCreatePlaylists: {
        type: Boolean,
        default: false,
      },
      canCreateCommunityPosts: {
        type: Boolean,
        default: false,
      },
    },
    // User Features
    userFeatures: {
      canUseHighlights: {
        type: Boolean,
        default: false,
      },
      canCreateNotes: {
        type: Boolean,
        default: false,
      },
    },
    // Achievement tracking
    achievements: [
      {
        achievementId: {
          type: String,
          required: true,
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    totalAchievementPoints: {
      type: Number,
      default: 0,
    },
    // Activity tracking for achievements
    commentsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    likesGivenCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ subscriber: 1 });
userSchema.index({ subscribed: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get user public profile
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Enable role-specific features when role changes
userSchema.pre('save', function (next) {
  // If role is being changed, update role-specific features
  if (this.isModified('role')) {
    // Reset all role-specific features
    this.creatorFeatures = {
      canUploadLongVideos: false,
      canSchedulePosts: false,
      canCreatePlaylists: false,
      canCreateCommunityPosts: false,
    };
    
    this.userFeatures = {
      canUseHighlights: false,
      canCreateNotes: false,
    };
    
    // Enable features based on new role
    switch (this.role) {
      case 'creator':
        this.creatorFeatures.canUploadLongVideos = true;
        this.creatorFeatures.canSchedulePosts = true;
        this.creatorFeatures.canCreatePlaylists = true;
        this.creatorFeatures.canCreateCommunityPosts = true;
        this.isMonetizationEnabled = true;
        this.monetizationApproved = true;
        break;
        
      case 'business':
        this.userFeatures.canUseHighlights = true;
        this.isBusinessProfileActive = true;
        break;
        
      case 'admin':
        // Admins get all features
        this.creatorFeatures.canUploadLongVideos = true;
        this.creatorFeatures.canSchedulePosts = true;
        this.creatorFeatures.canCreatePlaylists = true;
        this.creatorFeatures.canCreateCommunityPosts = true;
        this.userFeatures.canUseHighlights = true;
        this.userFeatures.canCreateNotes = true;
        this.isBusinessProfileActive = true;
        break;
        
      case 'user':
      default:
        this.userFeatures.canUseHighlights = true;
        this.userFeatures.canCreateNotes = true;
        break;
    }
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

export default User;