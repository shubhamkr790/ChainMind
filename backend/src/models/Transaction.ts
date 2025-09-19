import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Transaction interfaces
export interface ITransaction extends Document {
  // Basic Information
  transactionId: string;
  type: 'escrow_deposit' | 'escrow_release' | 'payment' | 'refund' | 'dispute_resolution' | 'platform_fee' | 'withdrawal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Participants
  fromUserId: Types.ObjectId;
  fromWalletAddress: string;
  toUserId?: Types.ObjectId;
  toWalletAddress?: string;
  
  // Job Reference
  jobId?: Types.ObjectId;
  jobReference?: string;
  
  // Amount & Pricing
  amount: {
    value: number;
    currency: string;
    usdValue: number; // Converted to USD for consistency
  };
  
  fees: {
    platformFee: number;
    gasFee: number;
    processingFee: number;
    totalFees: number;
  };
  
  netAmount: number; // Amount after fees
  
  // Blockchain Information
  blockchain: {
    network: string; // 'polygon', 'ethereum', 'bsc', etc.
    contractAddress?: string;
    transactionHash?: string;
    blockNumber?: number;
    blockHash?: string;
    gasUsed?: number;
    gasPrice?: string;
    confirmations: number;
    timestamp?: Date;
  };
  
  // Escrow Details (if applicable)
  escrow?: {
    escrowContractAddress: string;
    escrowId: string;
    releaseConditions: string[];
    arbitrator?: string;
    timeoutDuration: number; // hours
    isReleased: boolean;
    releasedAt?: Date;
    isRefunded: boolean;
    refundedAt?: Date;
  };
  
  // Payment Details
  payment: {
    method: 'crypto' | 'fiat' | 'credit_card' | 'bank_transfer';
    provider?: string; // 'stripe', 'paypal', 'metamask', etc.
    providerTransactionId?: string;
    processingTime?: number; // minutes
    exchangeRate?: number;
    receivedAmount?: number;
  };
  
  // Description & Metadata
  description: string;
  category: 'job_payment' | 'platform_service' | 'dispute' | 'withdrawal' | 'deposit';
  reference?: string;
  
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    source: 'web' | 'mobile' | 'api';
    systemNotes?: string;
    tags: string[];
  };
  
  // Timeline & Events
  events: Array<{
    type: string;
    timestamp: Date;
    data?: any;
    message?: string;
  }>;
  
  // Dispute Information
  dispute?: {
    isDisputed: boolean;
    disputedAt?: Date;
    disputeReason?: string;
    resolution?: {
      resolvedAt: Date;
      outcome: string;
      refundAmount?: number;
      notes?: string;
    };
  };
  
  // Receipts & Documentation
  receipts: Array<{
    type: 'invoice' | 'receipt' | 'tax_document';
    url: string;
    generatedAt: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Instance Methods
  addEvent(type: string, data?: any, message?: string): Promise<void>;
  updateStatus(newStatus: string, message?: string): Promise<void>;
  calculateFees(): void;
  toReceiptJSON(): object;
}

// Transaction Schema
const transactionSchema = new Schema<ITransaction>({
  // Basic Information
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['escrow_deposit', 'escrow_release', 'payment', 'refund', 'dispute_resolution', 'platform_fee', 'withdrawal'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Participants
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fromWalletAddress: {
    type: String,
    required: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  toUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  toWalletAddress: {
    type: String,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  
  // Job Reference
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'TrainingJob',
    index: true
  },
  jobReference: {
    type: String,
    index: true
  },
  
  // Amount & Pricing
  amount: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    usdValue: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  fees: {
    platformFee: {
      type: Number,
      default: 0,
      min: 0
    },
    gasFee: {
      type: Number,
      default: 0,
      min: 0
    },
    processingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFees: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Blockchain Information
  blockchain: {
    network: {
      type: String,
      required: true,
      index: true
    },
    contractAddress: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    transactionHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    blockNumber: {
      type: Number,
      index: true
    },
    blockHash: String,
    gasUsed: Number,
    gasPrice: String,
    confirmations: {
      type: Number,
      default: 0,
      min: 0
    },
    timestamp: Date
  },
  
  // Escrow Details
  escrow: {
    escrowContractAddress: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    escrowId: String,
    releaseConditions: [String],
    arbitrator: {
      type: String,
      lowercase: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    timeoutDuration: {
      type: Number,
      min: 1
    },
    isReleased: {
      type: Boolean,
      default: false
    },
    releasedAt: Date,
    isRefunded: {
      type: Boolean,
      default: false
    },
    refundedAt: Date
  },
  
  // Payment Details
  payment: {
    method: {
      type: String,
      enum: ['crypto', 'fiat', 'credit_card', 'bank_transfer'],
      required: true
    },
    provider: String,
    providerTransactionId: {
      type: String,
      index: true
    },
    processingTime: Number,
    exchangeRate: Number,
    receivedAmount: Number
  },
  
  // Description & Metadata
  description: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  category: {
    type: String,
    enum: ['job_payment', 'platform_service', 'dispute', 'withdrawal', 'deposit'],
    required: true,
    index: true
  },
  reference: {
    type: String,
    index: true
  },
  
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    systemNotes: String,
    tags: {
      type: [String],
      index: true
    }
  },
  
  // Timeline & Events
  events: [{
    type: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: Schema.Types.Mixed,
    message: String
  }],
  
  // Dispute Information
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false,
      index: true
    },
    disputedAt: Date,
    disputeReason: String,
    resolution: {
      resolvedAt: Date,
      outcome: String,
      refundAmount: Number,
      notes: String
    }
  },
  
  // Receipts & Documentation
  receipts: [{
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'tax_document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  processedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ fromUserId: 1 });
transactionSchema.index({ toUserId: 1 });
transactionSchema.index({ fromWalletAddress: 1 });
transactionSchema.index({ toWalletAddress: 1 });
transactionSchema.index({ jobId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ 'blockchain.network': 1 });
transactionSchema.index({ 'blockchain.transactionHash': 1 });
transactionSchema.index({ 'blockchain.blockNumber': 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ updatedAt: -1 });

// Compound indexes
transactionSchema.index({ fromUserId: 1, status: 1 });
transactionSchema.index({ toUserId: 1, status: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ jobId: 1, type: 1 });

// Instance Methods
transactionSchema.methods.addEvent = async function(type: string, data?: any, message?: string): Promise<void> {
  this.events.push({
    type,
    timestamp: new Date(),
    data,
    message
  });
  
  await this.save();
};

transactionSchema.methods.updateStatus = async function(newStatus: string, message?: string): Promise<void> {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Set timestamp fields based on status
  if (newStatus === 'processing' && !this.processedAt) {
    this.processedAt = new Date();
  } else if (newStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Add status change event
  await this.addEvent('status_change', {
    oldStatus,
    newStatus
  }, message || `Status changed from ${oldStatus} to ${newStatus}`);
};

transactionSchema.methods.calculateFees = function(): void {
  const platformFeeRate = 0.025; // 2.5%
  const processingFeeRate = 0.005; // 0.5%
  
  this.fees.platformFee = this.amount.usdValue * platformFeeRate;
  this.fees.processingFee = this.amount.usdValue * processingFeeRate;
  this.fees.totalFees = this.fees.platformFee + this.fees.gasFee + this.fees.processingFee;
  this.netAmount = this.amount.usdValue - this.fees.totalFees;
};

transactionSchema.methods.toReceiptJSON = function(): object {
  return {
    transactionId: this.transactionId,
    type: this.type,
    status: this.status,
    amount: this.amount,
    fees: this.fees,
    netAmount: this.netAmount,
    description: this.description,
    fromAddress: this.fromWalletAddress,
    toAddress: this.toWalletAddress,
    blockchain: {
      network: this.blockchain.network,
      transactionHash: this.blockchain.transactionHash,
      blockNumber: this.blockchain.blockNumber
    },
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Pre-save middleware to generate transactionId and calculate fees
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    this.transactionId = `tx_${timestamp}_${random}`;
  }
  
  // Calculate fees if not already set
  if (this.fees.totalFees === 0 && this.amount.usdValue > 0) {
    this.calculateFees();
  }
  
  next();
});

// Virtuals
transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

transactionSchema.virtual('isPending').get(function() {
  return ['pending', 'processing'].includes(this.status);
});

transactionSchema.virtual('processingTime').get(function() {
  if (this.completedAt && this.createdAt) {
    return Math.floor((this.completedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)); // minutes
  }
  return 0;
});

// Create and export model
export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
