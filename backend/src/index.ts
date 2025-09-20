import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { database } from './config/database';
import { logger, stream } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import providerRoutes from './routes/providers';
// import userRoutes from './routes/users';
// import uploadRoutes from './routes/upload';

class ChainMindServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private port: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.port = parseInt(process.env.PORT || '5000');
    
    // Initialize Socket.io
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSocketHandlers();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Trust proxy for rate limiting behind reverse proxy
    this.app.set('trust proxy', 1);

    // Security middlewares
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan(process.env.LOG_FORMAT || 'combined', { stream }));

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Static file serving for uploads
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    this.app.use('/uploads', express.static(uploadDir));

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    logger.info('Middlewares initialized successfully');
  }

  private initializeRoutes(): void {
    // Health check route
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.API_VERSION || 'v1',
        database: database.isConnectedToDatabase() ? 'connected' : 'disconnected'
      });
    });

    // Debug route for Railway
    this.app.get('/debug', (req, res) => {
      res.status(200).json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: this.port,
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
        database: database.isConnectedToDatabase() ? 'connected' : 'disconnected',
        version: process.env.API_VERSION || 'v1'
      });
    });

    // Debug route for Railway
    this.app.get('/debug', (req, res) => {
      res.status(200).json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        port: this.port,
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
        database: database.isConnectedToDatabase() ? 'connected' : 'disconnected',
        version: process.env.API_VERSION || 'v1'
      });
    });

    // API routes
    const apiVersion = process.env.API_VERSION || 'v1';
    
    // Mount auth routes
    this.app.use(`/api/${apiVersion}/auth`, authRoutes);
    
    // Mount main API routes
    this.app.use(`/api/${apiVersion}/jobs`, jobRoutes);
    this.app.use(`/api/${apiVersion}/providers`, providerRoutes);
    
    // TODO: Uncomment these as we create the route files
    // this.app.use(`/api/${apiVersion}/users`, userRoutes);
    // this.app.use(`/api/${apiVersion}/upload`, uploadRoutes);

    // Temporary placeholder route
    this.app.get(`/api/${apiVersion}`, (req, res) => {
      res.json({
        message: 'ChainMind API is running!',
        version: apiVersion,
        timestamp: new Date().toISOString()
      });
    });

    logger.info('Routes initialized successfully');
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket: any) => {
      logger.info(`Socket client connected: ${socket.id}`);

      // Handle user authentication for socket
      socket.on('authenticate', (data: any) => {
        // TODO: Implement socket authentication
        logger.info(`Socket authentication attempt: ${socket.id}`);
        socket.emit('authenticated', { success: true });
      });

      // Handle job subscription
      socket.on('subscribe:job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        logger.info(`Socket ${socket.id} subscribed to job ${jobId}`);
      });

      // Handle provider status updates
      socket.on('provider:status', (data: any) => {
        socket.broadcast.emit('provider:status:update', data);
        logger.info(`Provider status update from ${socket.id}:`, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: any) => {
        logger.info(`Socket client disconnected: ${socket.id}, reason: ${reason}`);
      });

      // Handle errors
      socket.on('error', (error: any) => {
        logger.error(`Socket error from ${socket.id}:`, error);
      });
    });

    logger.info('Socket.io handlers initialized successfully');
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('Unhandled Promise Rejection:', err);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception:', err);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    // Handle SIGINT
    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });

    logger.info('Error handling initialized successfully');
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Graceful shutdown initiated by ${signal}`);

    try {
      // Close server
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close Socket.io
      this.io.close(() => {
        logger.info('Socket.io server closed');
      });

      // Close database connection
      await database.disconnect();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      console.log('Starting ChainMind server...');
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Port: ${this.port}`);
      console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
      
      logger.info('Starting ChainMind server...');
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Port: ${this.port}`);
      logger.info(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
      
      // Connect to database (non-blocking)
      try {
        await database.connect();
        logger.info('Database connection successful');
      } catch (dbError) {
        logger.warn('Database connection failed, continuing without database:', dbError);
      }

      // Start server - bind to 0.0.0.0 for Railway
      this.server.listen(this.port, '0.0.0.0', () => {
        logger.info(`
🚀 ChainMind Server Started Successfully!
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Port: ${this.port}
📡 API Version: ${process.env.API_VERSION || 'v1'}
🗄️  Database: ${database.isConnectedToDatabase() ? '✅ Connected' : '❌ Disconnected'}
🌍 Access: http://0.0.0.0:${this.port}
📖 Health: http://0.0.0.0:${this.port}/health
🔍 Debug: http://0.0.0.0:${this.port}/debug
        `);
      });
      
      // Handle server errors
      this.server.on('error', (error: any) => {
        logger.error('Server error:', error);
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${this.port} is already in use`);
        }
      });

      // Make io available globally for routes
      (global as any).io = this.io;

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new ChainMindServer();
server.start().catch((error) => {
  logger.error('Failed to start ChainMind server:', error);
  process.exit(1);
});

export default ChainMindServer;
