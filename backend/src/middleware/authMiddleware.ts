import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { AuthenticatedRequest, AuthMiddlewareOptions } from '../types/auth';
import { logger } from '../utils/logger';

/**
 * Authentication middleware to protect routes and extract user context
 */
export const authenticate = (options: AuthMiddlewareOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        required = true,
        roles = [],
        permissions = [],
        skipRoutes = []
      } = options;

      // Check if route should be skipped
      const shouldSkip = skipRoutes.some((route: string) =>
        req.path.includes(route) || req.originalUrl.includes(route)
      );
      
      if (shouldSkip) {
        return next();
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (!required) {
          return next();
        }
        
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authorization header missing or invalid'
          }
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        // Verify token and get user context
        const { user, payload } = await authService.verifyToken(token);

        // Check if user account is active
        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'User account is inactive'
            }
          });
        }

        // Check if user is suspended
        if (user.isSuspended) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'User account is suspended',
              details: user.suspensionReason
            }
          });
        }

        // Check role-based access
        if (roles.length > 0 && !roles.includes(user.userType)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Insufficient permissions',
              details: `Required roles: ${roles.join(', ')}`
            }
          });
        }

        // TODO: Implement permission-based access control if needed
        // This would require extending the User model with permissions

        // Attach user context to request
        const authenticatedReq = req as any as AuthenticatedRequest;
        authenticatedReq.user = {
          id: (user._id as any).toString(),
          walletAddress: user.walletAddress,
          username: user.username,
          userType: user.userType,
          isVerified: user.isVerified,
          reputation: {
            score: user.reputation.score,
            averageRating: user.reputation.averageRating
          }
        };
        authenticatedReq.token = token;

        // Log successful authentication (debug level)
        logger.debug('User authenticated successfully', {
          userId: (user._id as any).toString(),
          walletAddress: user.walletAddress,
          userType: user.userType,
          path: req.path
        });

        next();

      } catch (tokenError: any) {
        logger.warn('Token verification failed', {
          error: tokenError.message,
          code: tokenError.code,
          path: req.path,
          ip: req.ip
        });

        const statusCode = tokenError.statusCode || 401;
        const errorCode = tokenError.code || 'TOKEN_INVALID';

        return res.status(statusCode).json({
          success: false,
          error: {
            code: errorCode,
            message: tokenError.message
          }
        });
      }

    } catch (error: any) {
      logger.error('Authentication middleware error:', {
        error: error.message,
        stack: error.stack,
        path: req.path
      });

      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication service temporarily unavailable'
        }
      });
    }
  };
};

/**
 * Middleware to extract user context without requiring authentication
 * Useful for routes that have different behavior for authenticated vs unauthenticated users
 */
export const optionalAuth = authenticate({ required: false });

/**
 * Middleware to require authentication for all routes
 */
export const requireAuth = authenticate({ required: true });

/**
 * Middleware to require specific user roles
 */
export const requireRoles = (...roles: string[]) => {
  return authenticate({ required: true, roles });
};

/**
 * Middleware specifically for provider-only routes
 */
export const requireProvider = authenticate({ 
  required: true, 
  roles: ['provider', 'both'] 
});

/**
 * Middleware specifically for developer-only routes
 */
export const requireDeveloper = authenticate({ 
  required: true, 
  roles: ['developer', 'both'] 
});

/**
 * Middleware to check if user owns a resource
 * This is a higher-order function that takes a resource extractor function
 */
export const requireResourceOwnership = (
  extractResourceUserId: (req: AuthenticatedRequest) => string | Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authenticatedReq = req as any as AuthenticatedRequest;
      
      // Ensure user is authenticated
      if (!authenticatedReq.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Extract resource owner ID
      const resourceUserId = await extractResourceUserId(authenticatedReq);
      
      // Check ownership
      if (authenticatedReq.user.id.toString() !== resourceUserId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You can only access your own resources'
          }
        });
      }

      next();

    } catch (error: any) {
      logger.error('Resource ownership check failed:', error);
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Resource ownership verification failed'
        }
      });
    }
  };
};

/**
 * Rate limiting middleware for authentication routes
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    
    const attemptData = attempts.get(identifier);
    
    if (attemptData) {
      // Reset if window has passed
      if (now > attemptData.resetTime) {
        attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      } else if (attemptData.count >= maxAttempts) {
        const resetIn = Math.ceil((attemptData.resetTime - now) / 1000);
        
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests. Try again in ${resetIn} seconds.`
          },
          retryAfter: resetIn
        });
      } else {
        attemptData.count++;
      }
    } else {
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
    }

    next();
  };
};

/**
 * Cleanup expired rate limit entries periodically
 */
setInterval(() => {
  // This would need access to the attempts map from authRateLimit
  // For a production system, consider using Redis for rate limiting
}, 60000); // Clean up every minute

export default {
  authenticate,
  optionalAuth,
  requireAuth,
  requireRoles,
  requireProvider,
  requireDeveloper,
  requireResourceOwnership,
  authRateLimit
};
