import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Reputation Event interfaces
export interface IReputationEvent extends Document {
  // Basic Information
  eventId: string;
  userId: Types.ObjectId;
  walletAddress: string;
  
  // Event Details
  eventType: 'job_completion' | 'rating_received' | 'dispute_resolution' | 'verification' | 'penalty' | 'bonus' | 'decay' | 'manual_adjustment';
  action: 'increase' | 'decrease' | 'reset';
  
  // Reputation Changes
  changes: {
    scoreBefore: number;
    scoreAfter: number;
    scoreDelta: number;
    
    // Component changes
    jobsCompletedDelta: number;
    jobsPostedDelta: number;
    totalEarningsDelta: number;
    totalSpentDelta: number;
    successRateBefore: number;
    successRateAfter: number;
    averageRatingBefore: number;
    averageRatingAfter: number;
    totalRatingsDelta: number;
  };
  
  // Event Context
  context: {
    jobId?: Types.ObjectId;
    jobReference?: string;
    transactionId?: Types.ObjectId;
    rating?: number;
    reviewComment?: string;
    disputeId?: string;
    verificationLevel?: string;
    penaltyReason?: string;
    bonusReason?: string;
    manualAdjustmentReason?: string;
  };
  
  // Source & Attribution
  source: {
    type: 'system' | 'user' | 'admin' | 'smart_contract' | 'external';
    triggeredBy?: Types.ObjectId; // User who triggered this event
    triggeredByAddress?: string;
    automaticTrigger: boolean;
    smartContractAddress?: string;
    transactionHash?: string;
  };
  
  // Impact & Metrics
  impact: {
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    category: 'performance' | 'reliability' | 'communication' | 'quality' | 'compliance' | 'system';
    weight: number; // Multiplier for the reputation change
    decayFactor?: number; // For time-based reputation decay
  };
  
  // Verification & Auditing
  verification: {
    isVerified: boolean;
    verifiedAt?: Date;
    verifiedBy?: Types.ObjectId;
    verificationMethod?: string;
    evidence?: Array<{
      type: string;
      url: string;
      description: string;
    }>;
  };
  
  // Metadata & Additional Info
  metadata: {
    description: string;
    tags: string[];
    isPublic: boolean;
    isReversible: boolean;
    expiresAt?: Date;
    relatedEvents?: Types.ObjectId[];
    systemNotes?: string;
    additionalData?: any;
  };
  
  // Status & Lifecycle
  status: 'pending' | 'processed' | 'failed' | 'reversed';
  processedAt?: Date;
  reversedAt?: Date;
  reverseReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Instance Methods
  process(): Promise<void>;
  reverse(reason: string): Promise<void>;
  toAuditJSON(): object;
}

// Reputation Event Schema
const reputationEventSchema = new Schema<IReputationEvent>({
  // Basic Information
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  
  // Event Details
  eventType: {
    type: String,
    enum: ['job_completion', 'rating_received', 'dispute_resolution', 'verification', 'penalty', 'bonus', 'decay', 'manual_adjustment'],
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['increase', 'decrease', 'reset'],
    required: true,
    index: true
  },
  
  // Reputation Changes
  changes: {
    scoreBefore: {
      type: Number,
      required: true,
      min: 0,
      max: 10000
    },
    scoreAfter: {
      type: Number,
      required: true,
      min: 0,
      max: 10000
    },
    scoreDelta: {
      type: Number,
      required: true
    },
    
    // Component changes
    jobsCompletedDelta: {
      type: Number,
      default: 0
    },
    jobsPostedDelta: {
      type: Number,
      default: 0
    },
    totalEarningsDelta: {
      type: Number,
      default: 0
    },
    totalSpentDelta: {
      type: Number,
      default: 0
    },
    successRateBefore: {
      type: Number,
      min: 0,
      max: 100
    },
    successRateAfter: {
      type: Number,
      min: 0,
      max: 100
    },
    averageRatingBefore: {
      type: Number,
      min: 0,
      max: 5
    },
    averageRatingAfter: {
      type: Number,
      min: 0,
      max: 5
    },
    totalRatingsDelta: {
      type: Number,
      default: 0
    }
  },
  
  // Event Context
  context: {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingJob',
      index: true
    },
    jobReference: String,
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      index: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    reviewComment: {
      type: String,
      maxlength: 500
    },
    disputeId: String,
    verificationLevel: {
      type: String,
      enum: ['basic', 'advanced', 'enterprise']
    },
    penaltyReason: {
      type: String,
      maxlength: 200
    },
    bonusReason: {
      type: String,
      maxlength: 200
    },
    manualAdjustmentReason: {
      type: String,
      maxlength: 200
    }
  },
  
  // Source & Attribution
  source: {
    type: {
      type: String,
      enum: ['system', 'user', 'admin', 'smart_contract', 'external'],
      required: true,
      index: true
    },
    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    triggeredByAddress: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    automaticTrigger: {
      type: Boolean,
      default: true
    },
    smartContractAddress: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    transactionHash: {
      type: String,
      index: true
    }
  },
  
  // Impact & Metrics
  impact: {
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'critical'],
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['performance', 'reliability', 'communication', 'quality', 'compliance', 'system'],
      required: true,
      index: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0.1,
      max: 5.0,
      default: 1.0
    },
    decayFactor: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  // Verification & Auditing
  verification: {
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    verifiedAt: Date,
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationMethod: String,
    evidence: [{
      type: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      description: String
    }]
  },
  
  // Metadata & Additional Info
  metadata: {
    description: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true
    },
    tags: {
      type: [String],
      index: true
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    isReversible: {
      type: Boolean,
      default: true
    },
    expiresAt: Date,
    relatedEvents: [{
      type: Schema.Types.ObjectId,
      ref: 'ReputationEvent'
    }],
    systemNotes: String,
    additionalData: Schema.Types.Mixed
  },
  
  // Status & Lifecycle
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed', 'reversed'],
    default: 'pending',
    index: true
  },
  processedAt: Date,
  reversedAt: Date,
  reverseReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reputationEventSchema.index({ eventId: 1 });
reputationEventSchema.index({ userId: 1 });
reputationEventSchema.index({ walletAddress: 1 });
reputationEventSchema.index({ eventType: 1 });
reputationEventSchema.index({ action: 1 });
reputationEventSchema.index({ status: 1 });
reputationEventSchema.index({ 'source.type': 1 });
reputationEventSchema.index({ 'impact.severity': 1 });
reputationEventSchema.index({ 'impact.category': 1 });
reputationEventSchema.index({ 'context.jobId': 1 });
reputationEventSchema.index({ 'context.transactionId': 1 });
reputationEventSchema.index({ createdAt: -1 });
reputationEventSchema.index({ processedAt: -1 });

// Compound indexes
reputationEventSchema.index({ userId: 1, eventType: 1 });
reputationEventSchema.index({ userId: 1, status: 1 });
reputationEventSchema.index({ eventType: 1, status: 1 });
reputationEventSchema.index({ 'impact.severity': 1, 'impact.category': 1 });

// Instance Methods
reputationEventSchema.methods.process = async function(): Promise<void> {
  if (this.status !== 'pending') {
    throw new Error('Event has already been processed');
  }
  
  try {
    // Update user's reputation (this would integrate with User model)
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Apply reputation changes
    user.reputation.score = this.changes.scoreAfter;
    user.reputation.jobsCompleted += this.changes.jobsCompletedDelta;
    user.reputation.jobsPosted += this.changes.jobsPostedDelta;
    user.reputation.totalEarnings += this.changes.totalEarningsDelta;
    user.reputation.totalSpent += this.changes.totalSpentDelta;
    
    if (this.changes.averageRatingAfter !== undefined) {
      user.reputation.averageRating = this.changes.averageRatingAfter;
    }
    
    if (this.changes.successRateAfter !== undefined) {
      user.reputation.successRate = this.changes.successRateAfter;
    }
    
    user.reputation.totalRatings += this.changes.totalRatingsDelta;
    
    await user.save();
    
    // Update event status
    this.status = 'processed';
    this.processedAt = new Date();
    
    await this.save();
    
  } catch (error: any) {
    this.status = 'failed';
    this.metadata.systemNotes = `Processing failed: ${error.message}`;
    await this.save();
    throw error;
  }
};

reputationEventSchema.methods.reverse = async function(reason: string): Promise<void> {
  if (this.status !== 'processed') {
    throw new Error('Can only reverse processed events');
  }
  
  if (!this.metadata.isReversible) {
    throw new Error('This event is not reversible');
  }
  
  try {
    // Create reverse event
    const ReputationEvent = mongoose.model('ReputationEvent');
    const reverseEvent = new ReputationEvent({
      userId: this.userId,
      walletAddress: this.walletAddress,
      eventType: this.eventType,
      action: this.action === 'increase' ? 'decrease' : 'increase',
      changes: {
        scoreBefore: this.changes.scoreAfter,
        scoreAfter: this.changes.scoreBefore,
        scoreDelta: -this.changes.scoreDelta,
        jobsCompletedDelta: -this.changes.jobsCompletedDelta,
        jobsPostedDelta: -this.changes.jobsPostedDelta,
        totalEarningsDelta: -this.changes.totalEarningsDelta,
        totalSpentDelta: -this.changes.totalSpentDelta,
        successRateBefore: this.changes.successRateAfter,
        successRateAfter: this.changes.successRateBefore,
        averageRatingBefore: this.changes.averageRatingAfter,
        averageRatingAfter: this.changes.averageRatingBefore,
        totalRatingsDelta: -this.changes.totalRatingsDelta
      },
      source: {
        type: 'system',
        automaticTrigger: true
      },
      impact: this.impact,
      metadata: {
        description: `Reversal of event ${this.eventId}: ${reason}`,
        tags: ['reversal'],
        isPublic: false,
        isReversible: false,
        relatedEvents: [this._id]
      }
    });
    
    await reverseEvent.process();
    
    // Mark original event as reversed
    this.status = 'reversed';
    this.reversedAt = new Date();
    this.reverseReason = reason;
    this.metadata.relatedEvents.push(reverseEvent._id);
    
    await this.save();
    
  } catch (error: any) {
    throw new Error(`Failed to reverse event: ${error.message}`);
  }
};

reputationEventSchema.methods.toAuditJSON = function(): object {
  const event = this.toObject();
  
  return {
    eventId: event.eventId,
    userId: event.userId,
    walletAddress: event.walletAddress,
    eventType: event.eventType,
    action: event.action,
    changes: event.changes,
    context: event.context,
    source: event.source,
    impact: event.impact,
    verification: event.verification,
    status: event.status,
    createdAt: event.createdAt,
    processedAt: event.processedAt,
    reversedAt: event.reversedAt,
    reverseReason: event.reverseReason
  };
};

// Pre-save middleware to generate eventId
reputationEventSchema.pre('save', function(next) {
  if (!this.eventId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    this.eventId = `rep_${timestamp}_${random}`;
  }
  next();
});

// Virtuals
reputationEventSchema.virtual('isPositive').get(function() {
  return this.changes.scoreDelta > 0;
});

reputationEventSchema.virtual('isNegative').get(function() {
  return this.changes.scoreDelta < 0;
});

reputationEventSchema.virtual('impactScore').get(function() {
  const severityWeights = {
    minor: 1,
    moderate: 2,
    major: 3,
    critical: 5
  };
  return Math.abs(this.changes.scoreDelta) * severityWeights[this.impact.severity] * this.impact.weight;
});

// Create and export model
export const ReputationEvent: Model<IReputationEvent> = mongoose.model<IReputationEvent>('ReputationEvent', reputationEventSchema);
export default ReputationEvent;
