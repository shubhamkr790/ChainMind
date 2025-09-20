import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
// import { authenticate } from '../middleware/authMiddleware'; // Disabled for development
import { TrainingJob } from '../models/TrainingJob';
import { GPUProvider } from '../models/GPUProvider';
import { blockchainService } from '../services/BlockchainService';
// import { validateJobData } from '../utils/validation'; // Not used
// import { AuthenticatedRequest } from '../types/auth'; // Disabled for development
import mongoose, { Types } from 'mongoose';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateJobCreation = [
  body('title').isString().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').isString().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('jobType').isIn(['training', 'inference', 'fine-tuning', 'custom']).withMessage('Invalid job type'),
  body('framework').isIn(['tensorflow', 'pytorch', 'huggingface', 'custom']).withMessage('Invalid framework'),
  body('requirements.gpuType').isString().notEmpty().withMessage('GPU type is required'),
  body('requirements.gpuMemory').isInt({ min: 1, max: 128 }).withMessage('GPU memory must be 1-128 GB'),
  body('requirements.gpuCount').isInt({ min: 1, max: 8 }).withMessage('GPU count must be 1-8'),
  body('requirements.maxDuration').isInt({ min: 1, max: 168 }).withMessage('Max duration must be 1-168 hours'),
  body('requirements.estimatedDuration').isInt({ min: 1 }).withMessage('Estimated duration is required'),
  body('dataset.name').isString().notEmpty().withMessage('Dataset name is required'),
  body('dataset.size').isInt({ min: 1 }).withMessage('Dataset size must be positive'),
  body('dataset.format').isString().notEmpty().withMessage('Dataset format is required'),
  body('dataset.location').isString().notEmpty().withMessage('Dataset location is required'),
  body('pricing.budget').isFloat({ min: 0.01 }).withMessage('Budget must be at least $0.01'),
  body('pricing.maxHourlyRate').isFloat({ min: 0.01 }).withMessage('Max hourly rate must be at least $0.01'),
  body('environment.trainingScript').isString().notEmpty().withMessage('Training script is required'),
];

const validateJobUpdate = [
  param('jobId').isMongoId().withMessage('Invalid job ID'),
  body('status').optional().isIn(['draft', 'posted', 'accepted', 'running', 'paused', 'completed', 'failed', 'cancelled', 'disputed'])
];

// GET /api/v1/jobs - Get all jobs (with filters) (auth disabled for development)
router.get('/', /* authenticate, */ async (req: Request, res: Response) => {
  try {
    const {
      status,
      jobType,
      framework,
      minBudget,
      maxBudget,
      gpuType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter: any = {};
    
    if (status) filter.status = status;
    if (jobType) filter.jobType = jobType;
    if (framework) filter.framework = framework;
    if (gpuType) filter['requirements.gpuType'] = { $regex: gpuType, $options: 'i' };
    
    if (minBudget || maxBudget) {
      filter['pricing.budget'] = {};
      if (minBudget) filter['pricing.budget'].$gte = parseFloat(minBudget as string);
      if (maxBudget) filter['pricing.budget'].$lte = parseFloat(maxBudget as string);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sortBy as string] = sortDirection;

    const [jobs, totalCount] = await Promise.all([
      TrainingJob.find(filter)
        .populate('clientId', 'username email walletAddress')
        .populate('providerId', 'name walletAddress')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      TrainingJob.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          hasNext: pageNum < Math.ceil(totalCount / limitNum),
          hasPrev: pageNum > 1
        }
      },
      message: 'Jobs retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message
    });
  }
});

// POST /api/v1/jobs - Create a new training job (auth disabled for development)
router.post('/', validateJobCreation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Mock user data for development (replace with auth when ready)
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID
    const walletAddress = '0x742d35Cc6634C0532925a3b8D0A04D5F9F123456'; // Mock wallet

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create training job
    const jobData = {
      ...req.body,
      jobId,
      clientId: new mongoose.Types.ObjectId(userId),
      clientWalletAddress: walletAddress,
      status: 'draft',
      lifecycle: {
        createdAt: new Date()
      },
      progress: {
        percentage: 0,
        checkpoints: []
      },
      results: {
        artifacts: []
      },
      communication: {
        messages: []
      },
      blockchain: {
        transactionHashes: {}
      },
      metadata: {
        tags: req.body.tags || [],
        isPublic: req.body.isPublic !== false,
        isRated: false,
        attempts: 0
      }
    };

    const job = new TrainingJob(jobData);
    await job.save();

    logger.info(`Training job created: ${jobId} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Training job created successfully'
    });

  } catch (error: any) {
    logger.error('Error creating training job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create training job',
      message: error.message
    });
  }
});

// GET /api/v1/jobs/:jobId - Get specific job details (auth disabled for development)
router.get('/:jobId', /* authenticate, */ [param('jobId').isMongoId()], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID'
      });
    }

    const job = await TrainingJob.findById(req.params.jobId)
      .populate('clientId', 'username email walletAddress')
      .populate('providerId', 'name walletAddress location.country hardware.gpus');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Access control disabled for development
    // const authReq = req as unknown as AuthenticatedRequest;
    // const userId = authReq.user?.id;
    // if (job.clientId._id.toString() !== userId && 
    //     (!job.providerId || job.providerId._id.toString() !== userId)) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied'
    //   });
    // }

    res.json({
      success: true,
      data: job,
      message: 'Job retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details',
      message: error.message
    });
  }
});

// PUT /api/v1/jobs/:jobId - Update job
router.put('/:jobId', /* authenticate, */ validateJobUpdate, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const job = await TrainingJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check permissions
    if (job.clientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the job owner can update this job'
      });
    }

    // Update job
    Object.assign(job, req.body);
    job.updatedAt = new Date();

    await job.save();

    logger.info(`Job updated: ${job.jobId} by user ${userId}`);

    res.json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job',
      message: error.message
    });
  }
});

// POST /api/v1/jobs/:jobId/publish - Publish job to marketplace
router.post('/:jobId/publish', /* authenticate, */ [param('jobId').isMongoId()], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID'
      });
    }

    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const job = await TrainingJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.clientId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the job owner can publish this job'
      });
    }

    if (job.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft jobs can be published'
      });
    }

    // Update job status
    job.status = 'posted';
    job.lifecycle.postedAt = new Date();
    await job.save();

    logger.info(`Job published: ${job.jobId} by user ${userId}`);

    res.json({
      success: true,
      data: job,
      message: 'Job published successfully'
    });

  } catch (error: any) {
    logger.error('Error publishing job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish job',
      message: error.message
    });
  }
});

// POST /api/v1/jobs/:jobId/accept - Provider accepts a job
router.post('/:jobId/accept', /* authenticate, */ [param('jobId').isMongoId()], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID'
      });
    }

    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const walletAddress = '0x742d35Cc6634C0532925a3b8D0A04D5F9F123456'; // Mock wallet

    // Find the job
    const job = await TrainingJob.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if job is available for acceptance
    if (job.status !== 'posted') {
      return res.status(400).json({
        success: false,
        error: 'Job is not available for acceptance'
      });
    }

    // Find provider profile
    const provider = await GPUProvider.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found. Please register as a provider first.'
      });
    }

    // Create escrow on blockchain
    const escrowResult = await blockchainService.createEscrow(
      job.jobId,
      walletAddress!,
      job.pricing.escrowAmount || job.pricing.budget
    );

    if (!escrowResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create escrow',
        details: escrowResult.error
      });
    }

    // Update job with provider information
    job.providerId = provider._id as Types.ObjectId;
    job.providerWalletAddress = walletAddress;
    job.status = 'accepted';
    job.lifecycle.acceptedAt = new Date();
    job.blockchain.transactionHashes.accepted = escrowResult.transactionHash;

    await job.save();

    logger.info(`Job accepted: ${job.jobId} by provider ${userId}, escrow ID: ${escrowResult.escrowId}`);

    res.json({
      success: true,
      data: {
        job,
        escrowId: escrowResult.escrowId,
        transactionHash: escrowResult.transactionHash
      },
      message: 'Job accepted successfully'
    });

  } catch (error: any) {
    logger.error('Error accepting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept job',
      message: error.message
    });
  }
});

// POST /api/v1/jobs/:jobId/start - Start job execution
router.post('/:jobId/start', /* authenticate, */ [param('jobId').isMongoId()], async (req: Request, res: Response) => {
  try {
    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const job = await TrainingJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Check if user is the assigned provider
    if (!job.providerId || job.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the assigned provider can start this job'
      });
    }

    if (job.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Job must be accepted before starting'
      });
    }

    // Update job status
    job.status = 'running';
    job.lifecycle.startedAt = new Date();
    job.progress.percentage = 0;

    await job.save();

    logger.info(`Job started: ${job.jobId} by provider ${userId}`);

    res.json({
      success: true,
      data: job,
      message: 'Job started successfully'
    });

  } catch (error: any) {
    logger.error('Error starting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start job',
      message: error.message
    });
  }
});

// PUT /api/v1/jobs/:jobId/progress - Update job progress
router.put('/:jobId/progress', /* authenticate, */ [
  param('jobId').isMongoId(),
  body('percentage').isInt({ min: 0, max: 100 }),
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

    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const job = await TrainingJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (!job.providerId || job.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the assigned provider can update job progress'
      });
    }

    if (job.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Job must be running to update progress'
      });
    }

    // Update progress
    job.progress = { ...job.progress, ...req.body };
    job.metadata.lastHeartbeat = new Date();

    await job.save();

    res.json({
      success: true,
      data: { progress: job.progress },
      message: 'Job progress updated successfully'
    });

  } catch (error: any) {
    logger.error('Error updating job progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job progress',
      message: error.message
    });
  }
});

// POST /api/v1/jobs/:jobId/complete - Complete job
router.post('/:jobId/complete', /* authenticate, */ [param('jobId').isMongoId()], async (req: Request, res: Response) => {
  try {
    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const job = await TrainingJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (!job.providerId || job.providerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the assigned provider can complete this job'
      });
    }

    if (job.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: 'Job must be running to complete'
      });
    }

    // Update job status
    job.status = 'completed';
    job.lifecycle.completedAt = new Date();
    job.progress.percentage = 100;

    // Add results from request body
    if (req.body.results) {
      job.results = { ...job.results, ...req.body.results };
    }

    await job.save();

    logger.info(`Job completed: ${job.jobId} by provider ${userId}`);

    res.json({
      success: true,
      data: job,
      message: 'Job completed successfully'
    });

  } catch (error: any) {
    logger.error('Error completing job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete job',
      message: error.message
    });
  }
});

// GET /api/v1/jobs/my/client - Get jobs where user is the client
router.get('/my/client', /* authenticate, */ async (req: Request, res: Response) => {
  try {
    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const { status, page = 1, limit = 20 } = req.query;

    const filter: any = { clientId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, totalCount] = await Promise.all([
      TrainingJob.find(filter)
        .populate('providerId', 'name walletAddress location.country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TrainingJob.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      },
      message: 'Client jobs retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching client jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client jobs',
      message: error.message
    });
  }
});

// GET /api/v1/jobs/my/provider - Get jobs where user is the provider
router.get('/my/provider', /* authenticate, */ async (req: Request, res: Response) => {
  try {
    // const authReq = req as unknown as AuthenticatedRequest;
    const userId = '674d8b8f5e1a2b3c4d5e6f78'; // Mock user ID for development
    const { status, page = 1, limit = 20 } = req.query;

    const filter: any = { providerId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, totalCount] = await Promise.all([
      TrainingJob.find(filter)
        .populate('clientId', 'username email walletAddress')
        .sort({ acceptedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      TrainingJob.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      },
      message: 'Provider jobs retrieved successfully'
    });

  } catch (error: any) {
    logger.error('Error fetching provider jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider jobs',
      message: error.message
    });
  }
});


export default router;
