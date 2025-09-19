import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authMiddleware';
import { GPUProvider } from '../models/GPUProvider';
import { blockchainService } from '../services/BlockchainService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth';
import mongoose from 'mongoose';

const router = Router();

// Validation middleware
const validateProviderRegistration = [
  body('name').isString().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('description').optional().isString().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
  body('location.country').isString().notEmpty().withMessage('Country is required'),
  body('location.city').optional().isString(),
  body('location.coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
  body('location.coordinates.lng').optional().isFloat({ min: -180, max: 180 }),
  
  // Hardware validation
  body('hardware.gpus').isArray({ min: 1 }).withMessage('At least one GPU is required'),
  body('hardware.gpus.*.model').isString().notEmpty().withMessage('GPU model is required'),
  body('hardware.gpus.*.memory').isInt({ min: 1, max: 128 }).withMessage('GPU memory must be 1-128 GB'),
  body('hardware.gpus.*.cores').isInt({ min: 1 }).withMessage('GPU cores must be positive'),
  
  body('hardware.cpu.model').isString().notEmpty().withMessage('CPU model is required'),
  body('hardware.cpu.cores').isInt({ min: 1, max: 256 }).withMessage('CPU cores must be 1-256'),
  body('hardware.cpu.clockSpeed').isFloat({ min: 0.1 }).withMessage('CPU clock speed must be positive'),
  
  body('hardware.ram.total').isInt({ min: 1, max: 2048 }).withMessage('RAM must be 1-2048 GB'),
  body('hardware.storage.total').isInt({ min: 10 }).withMessage('Storage must be at least 10 GB'),
  
  // Pricing validation
  body('pricing.hourlyRate').isFloat({ min: 0.01 }).withMessage('Hourly rate must be at least $0.01'),
  body('pricing.currency').isIn(['USD', 'EUR', 'ETH', 'POL']).withMessage('Invalid currency'),
  body('pricing.minimumJobDuration').isInt({ min: 1 }).withMessage('Minimum job duration must be at least 1 minute'),
];

const validateProviderUpdate = [
  param('providerId').isMongoId().withMessage('Invalid provider ID'),
];

// GET /api/v1/providers - Get all providers (public endpoint with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      country,
      gpuModel,
      minMemory,
      maxHourlyRate,
      isOnline,
      minRating,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter: any = {
      'verification.isVerified': true, // Only show verified providers
      'availability.status': { $ne: 'offline' } // Don't show offline providers
    };
    
    if (country) filter['location.country'] = { $regex: country, $options: 'i' };
    if (gpuModel) filter['hardware.gpus.model'] = { $regex: gpuModel, $options: 'i' };
    if (minMemory) filter['hardware.gpus.memory'] = { $gte: parseInt(minMemory as string) };
    if (maxHourlyRate) filter['pricing.hourlyRate'] = { $lte: parseFloat(maxHourlyRate as string) };
    if (isOnline === 'true') filter['availability.isOnline'] = true;
    if (minRating) filter['performance.averageRating'] = { $gte: parseFloat(minRating as string) };

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sortBy as string] = sortDirection;

    const [providers, totalCount] = await Promise.all([
      GPUProvider.find(filter)
        .select('-userId -security -earnings -settings') // Hide sensitive fields
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      GPUProvider.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum < Math.ceil(totalCount / limitNum),
          hasPrev: pageNum > 1
        }
      },
      message: 'Providers retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch providers',
      message: error.message
    });
  }
});

// POST /api/v1/providers - Register as a provider
router.post('/', authenticate, validateProviderRegistration, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const walletAddress = authReq.user?.walletAddress;

    if (!userId || !walletAddress) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user already has a provider profile
    const existingProvider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        error: 'Provider profile already exists for this user'
      });
    }

    // Create provider profile
    const providerData = {
      ...req.body,
      userId: new mongoose.Types.ObjectId(userId),
      walletAddress: walletAddress.toLowerCase(),
      
      // Initialize performance metrics
      performance: {
        averageJobCompletionTime: 0,
        successfulJobs: 0,
        failedJobs: 0,
        totalJobsCompleted: 0,
        averageRating: 0,
        totalRatings: 0,
        reliabilityScore: 100,
        benchmarks: {
          tensorflow: 0,
          pytorch: 0,
          cuda: 0
        }
      },
      
      // Initialize availability
      availability: {
        isOnline: false,
        status: 'offline',
        schedules: [],
        maintenanceWindows: [],
        lastPing: new Date(),
        uptimePercentage: 100
      },
      
      // Initialize security settings
      security: {
        encryptionEnabled: true,
        vpnRequired: false,
        whitelistedIPs: [],
        securityCertifications: [],
        dataRetentionPolicy: '30 days',
        isKYCCompliant: false
      },
      
      // Initialize software environment
      software: {
        operatingSystem: req.body.software?.operatingSystem || 'Linux',
        dockerSupport: req.body.software?.dockerSupport !== false,
        supportedFrameworks: req.body.software?.supportedFrameworks || ['tensorflow', 'pytorch'],
        pythonVersions: req.body.software?.pythonVersions || ['3.8', '3.9', '3.10'],
        cudaVersions: req.body.software?.cudaVersions || ['11.8', '12.0'],
        customImages: []
      },
      
      // Initialize earnings
      earnings: {
        totalEarned: 0,
        pendingPayouts: 0,
        averageMonthlyEarnings: 0,
        totalJobHours: 0
      },
      
      // Initialize verification
      verification: {
        isVerified: false,
        verificationLevel: 'basic',
        verificationDocuments: [],
        auditReports: []
      },
      
      // Initialize settings
      settings: {
        autoAcceptJobs: false,
        maxConcurrentJobs: 1,
        jobTypesAllowed: ['training', 'inference'],
        minimumJobValue: req.body.pricing?.minimumJobValue || 1.0,
        requireDeposit: true,
        allowSpotInstances: false,
        notificationPreferences: {
          newJobs: true,
          jobUpdates: true,
          payments: true,
          maintenance: false
        }
      },
      
      lastActiveAt: new Date()
    };

    const provider = new GPUProvider(providerData);
    await provider.save();

    logger.info(`Provider registered: ${provider._id} by user ${userId}`);

    // Return provider data without sensitive fields
    const publicProvider = provider.toPublicJSON();

    res.status(201).json({
      success: true,
      data: publicProvider,
      message: 'Provider registration successful'
    });

  } catch (error: any) {
    logger.error('Error registering provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register provider',
      message: error.message
    });
  }
});

// GET /api/v1/providers/:providerId - Get specific provider details
router.get('/:providerId', [param('providerId').isMongoId()], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider ID'
      });
    }

    const provider = await GPUProvider.findById(req.params.providerId)
      .select('-userId -security -earnings -settings'); // Hide sensitive fields for public view

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    res.json({
      success: true,
      data: provider,
      message: 'Provider retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching provider details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider details',
      message: error.message
    });
  }
});

// GET /api/v1/providers/my/profile - Get current user's provider profile
router.get('/my/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;

    const provider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    res.json({
      success: true,
      data: provider,
      message: 'Provider profile retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching provider profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider profile',
      message: error.message
    });
  }
});

// PUT /api/v1/providers/my/profile - Update current user's provider profile
router.put('/my/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;

    const provider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'location', 'hardware', 'pricing', 
      'software', 'settings', 'availability.schedules'
    ];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.some(allowed => key.startsWith(allowed))) {
        if (key.includes('.')) {
          // Handle nested updates
          const keys = key.split('.');
          let current = provider as any;
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = req.body[key];
        } else {
          (provider as any)[key] = req.body[key];
        }
      }
    });

    provider.updatedAt = new Date();
    await provider.save();

    logger.info(`Provider profile updated: ${provider._id} by user ${userId}`);

    res.json({
      success: true,
      data: provider,
      message: 'Provider profile updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating provider profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider profile',
      message: error.message
    });
  }
});

// POST /api/v1/providers/my/status - Update provider online status
router.post('/my/status', authenticate, [
  body('status').isIn(['available', 'busy', 'maintenance', 'offline']).withMessage('Invalid status'),
  body('isOnline').isBoolean().optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { status, isOnline } = req.body;

    const provider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    // Update availability status
    provider.availability.status = status;
    if (typeof isOnline === 'boolean') {
      provider.availability.isOnline = isOnline;
    }
    provider.availability.lastPing = new Date();
    provider.lastActiveAt = new Date();

    await provider.save();

    logger.info(`Provider status updated: ${provider._id} to ${status}`);

    res.json({
      success: true,
      data: {
        status: provider.availability.status,
        isOnline: provider.availability.isOnline,
        lastPing: provider.availability.lastPing
      },
      message: 'Provider status updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating provider status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider status',
      message: error.message
    });
  }
});

// GET /api/v1/providers/my/stats - Get provider statistics
router.get('/my/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;

    const provider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    // Get blockchain reputation data
    let blockchainReputation = null;
    try {
      blockchainReputation = await blockchainService.getProviderReputation(provider.walletAddress);
    } catch (error) {
      logger.warn('Failed to fetch blockchain reputation:', error);
    }

    const stats = {
      performance: provider.performance,
      earnings: provider.earnings,
      availability: {
        status: provider.availability.status,
        isOnline: provider.availability.isOnline,
        uptimePercentage: provider.availability.uptimePercentage,
        lastPing: provider.availability.lastPing
      },
      verification: {
        isVerified: provider.verification.isVerified,
        verificationLevel: provider.verification.verificationLevel
      },
      blockchain: blockchainReputation,
      totalGPUs: provider.hardware.gpus.length,
      totalMemory: provider.hardware.gpus.reduce((sum, gpu) => sum + gpu.memory, 0),
      joinedAt: provider.createdAt,
      lastActive: provider.lastActiveAt
    };

    res.json({
      success: true,
      data: stats,
      message: 'Provider statistics retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching provider statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider statistics',
      message: error.message
    });
  }
});

// POST /api/v1/providers/my/benchmark - Update provider benchmarks
router.post('/my/benchmark', authenticate, [
  body('framework').isIn(['tensorflow', 'pytorch', 'cuda']).withMessage('Invalid framework'),
  body('score').isFloat({ min: 0 }).withMessage('Score must be positive')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { framework, score } = req.body;

    const provider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    // Update benchmark score
    (provider.performance.benchmarks as any)[framework] = score;
    provider.updatedAt = new Date();

    await provider.save();

    logger.info(`Provider benchmark updated: ${provider._id} ${framework}: ${score}`);

    res.json({
      success: true,
      data: { benchmarks: provider.performance.benchmarks },
      message: 'Benchmark updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating provider benchmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update benchmark',
      message: error.message
    });
  }
});

// POST /api/v1/providers/:providerId/heartbeat - Provider heartbeat (keep-alive)
router.post('/:providerId/heartbeat', authenticate, [param('providerId').isMongoId()], async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const providerId = req.params.providerId;

    const provider = await GPUProvider.findById(providerId);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Check if user owns this provider
    if (provider.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update heartbeat
    provider.availability.lastPing = new Date();
    provider.lastActiveAt = new Date();

    // Update any status information from the heartbeat
    if (req.body.systemInfo) {
      // Could update GPU usage, memory usage, etc. from heartbeat data
      logger.info(`Heartbeat received from provider ${providerId}:`, req.body.systemInfo);
    }

    await provider.save();

    res.json({
      success: true,
      message: 'Heartbeat received'
    });

  } catch (error: any) {
    logger.error('Error processing provider heartbeat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process heartbeat',
      message: error.message
    });
  }
});

export default router;
