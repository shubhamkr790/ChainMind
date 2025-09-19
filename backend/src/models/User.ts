import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User interfaces
export interface IUser extends Document {
  // Wallet & Authentication
  walletAddress: string;
  nonce: number;
  signature?: string;
  isVerified: boolean;
  
  // Profile Information
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  
  // User Type & Preferences
  userType: 'developer' | 'provider' | 'both';
  isEmailNotificationsEnabled: boolean;
  isWebNotificationsEnabled: boolean;
  
  // Account Status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  lastLogin?: Date;
  
  // Reputation & Stats
  reputation: {
    score: number;
    jobsCompleted: number;
    jobsPosted: number;
    totalEarnings: number;
    totalSpent: number;
    successRate: number;
    averageRating: number;
    totalRatings: number;
  };
  
  // KYC & Verification
  kyc: {
    level: 'none' | 'basic' | 'advanced';
    isVerified: boolean;
    documents: Array<{
      type: string;
      url: string;
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: Date;
    }>;
    verifiedAt?: Date;
  };
  
  // Preferences & Settings
  preferences: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    language: string;
    timezone: string;
    emailNotifications: {
      jobUpdates: boolean;
      payments: boolean;
      newMessages: boolean;
      systemAlerts: boolean;
    };
  };
  
  // Social & Connections
  social: {
    discord?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  generateAuthToken(): string;
  generateNonce(): number;
  updateReputation(jobData: any): Promise<void>;
  toPublicJSON(): object;
}

// User Schema
const userSchema = new Schema<IUser>({
  // Wallet & Authentication
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  nonce: {
    type: Number,
    required: true,
    default: () => Math.floor(Math.random() * 1000000)
  },
  signature: {
    type: String,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  username: {
    type: String,
    unique: true,
    sparse: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  avatar: {
    type: String,
    match: /^https?:\/\/.+/
  },
  bio: {
    type: String,
    maxlength: 500
  },
  website: {
    type: String,
    match: /^https?:\/\/.+/
  },
  
  // User Type & Preferences
  userType: {
    type: String,
    enum: ['developer', 'provider', 'both'],
    default: 'developer'
  },
  isEmailNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  isWebNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  lastLogin: Date,
  
  // Reputation & Stats
  reputation: {
    score: {
      type: Number,
      default: 1000,
      min: 0,
      max: 10000
    },
    jobsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    jobsPosted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // KYC & Verification
  kyc: {
    level: {
      type: String,
      enum: ['none', 'basic', 'advanced'],
      default: 'none'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    verifiedAt: Date
  },
  
  // Preferences & Settings
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    emailNotifications: {
      jobUpdates: {
        type: Boolean,
        default: true
      },
      payments: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      },
      systemAlerts: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Social & Connections
  social: {
    discord: String,
    twitter: String,
    github: String,
    linkedin: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (walletAddress, username, email already have indexes via unique constraint)
userSchema.index({ userType: 1 });
userSchema.index({ 'reputation.score': -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Instance Methods
userSchema.methods.generateAuthToken = function(): string {
  const payload = {
    userId: this._id,
    walletAddress: this.walletAddress,
    userType: this.userType
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );
};

userSchema.methods.generateNonce = function(): number {
  this.nonce = Math.floor(Math.random() * 1000000);
  return this.nonce;
};

userSchema.methods.updateReputation = async function(jobData: any): Promise<void> {
  // Update reputation based on job completion
  this.reputation.jobsCompleted += 1;
  
  if (jobData.rating) {
    const totalRatingPoints = this.reputation.averageRating * this.reputation.totalRatings;
    this.reputation.totalRatings += 1;
    this.reputation.averageRating = (totalRatingPoints + jobData.rating) / this.reputation.totalRatings;
  }
  
  if (jobData.earnings) {
    this.reputation.totalEarnings += jobData.earnings;
  }
  
  // Calculate success rate
  this.reputation.successRate = (this.reputation.jobsCompleted / (this.reputation.jobsCompleted + (jobData.failedJobs || 0))) * 100;
  
  // Update overall reputation score
  const baseScore = 1000;
  const ratingBonus = this.reputation.averageRating * 200;
  const successBonus = (this.reputation.successRate / 100) * 300;
  const volumeBonus = Math.min(this.reputation.jobsCompleted * 10, 500);
  
  this.reputation.score = Math.min(baseScore + ratingBonus + successBonus + volumeBonus, 10000);
  
  await this.save();
};

userSchema.methods.toPublicJSON = function(): object {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.nonce;
  delete user.signature;
  delete user.email;
  delete user.kyc.documents;
  delete user.preferences;
  delete user.__v;
  
  return user;
};

// Static methods - Define interface first
interface IUserModel extends Model<IUser> {
  findByWalletAddress(walletAddress: string): Promise<IUser | null>;
}

userSchema.statics.findByWalletAddress = function(walletAddress: string) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure wallet address is lowercase
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  next();
});

// Virtual for full name or display name
userSchema.virtual('displayName').get(function() {
  return this.username || `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
});

// Create and export model
export const User = mongoose.model<IUser, IUserModel>('User', userSchema) as IUserModel;
export default User;
