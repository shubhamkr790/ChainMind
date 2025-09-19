import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/AuthService';
import { authRateLimit, requireAuth } from '../middleware/authMiddleware';
import { AuthenticatedRequest, LoginRequest, VerifyRequest, RefreshTokenRequest } from '../types/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateWalletAddress = body('walletAddress')
  .isString()
  .isLength({ min: 42, max: 42 })
  .matches(/^0x[a-fA-F0-9]{40}$/)
  .withMessage('Invalid Ethereum wallet address');

const validateSignature = body('signature')
  .isString()
  .isLength({ min: 130, max: 132 })
  .matches(/^0x[a-fA-F0-9]+$/)
  .withMessage('Invalid signature format');

const validateMessage = body('message')
  .isString()
  .isLength({ min: 10, max: 1000 })
  .withMessage('Invalid message format');

const validateRefreshToken = body('refreshToken')
  .isString()
  .isJWT()
  .withMessage('Invalid refresh token format');

// Apply rate limiting to all auth routes
router.use(authRateLimit(10, 15 * 60 * 1000)); // 10 attempts per 15 minutes

/**
 * @route   POST /api/v1/auth/login
 * @desc    Initiate Web3 authentication by generating nonce
 * @access  Public
 * @body    { walletAddress: string }
 */
router.post('/login', [validateWalletAddress], async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const loginRequest: LoginRequest = {
      walletAddress: req.body.walletAddress.toLowerCase()
    };

    const response = await authService.initiateLogin(loginRequest);

    logger.info('Login initiated successfully', {
      walletAddress: loginRequest.walletAddress,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(response);

  } catch (error: any) {
    logger.error('Login initiation failed:', {
      error: error.message,
      walletAddress: req.body.walletAddress,
      ip: req.ip
    });

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'LOGIN_FAILED',
        message: error.message || 'Login initiation failed'
      }
    });
  }
});

/**
 * @route   POST /api/v1/auth/verify
 * @desc    Verify signature and complete authentication
 * @access  Public
 * @body    { walletAddress: string, signature: string, message: string }
 */
router.post('/verify', [
  validateWalletAddress,
  validateSignature,
  validateMessage
], async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const verifyRequest: VerifyRequest = {
      walletAddress: req.body.walletAddress.toLowerCase(),
      signature: req.body.signature,
      message: req.body.message
    };

    const response = await authService.verifySignature(verifyRequest);

    logger.info('Authentication successful', {
      userId: response.user.id,
      walletAddress: response.user.walletAddress,
      isNewUser: response.isNewUser,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set secure HTTP-only cookie for refresh token (optional)
    if (process.env.USE_REFRESH_COOKIES === 'true') {
      res.cookie('refreshToken', response.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json(response);

  } catch (error: any) {
    logger.error('Authentication verification failed:', {
      error: error.message,
      code: error.code,
      walletAddress: req.body.walletAddress,
      ip: req.ip
    });

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'VERIFICATION_FAILED',
        message: error.message || 'Signature verification failed'
      }
    });
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken: string } OR cookie
 */
router.post('/refresh', [validateRefreshToken], async (req: Request, res: Response) => {
  try {
    // Get refresh token from body or cookie
    let refreshToken = req.body.refreshToken;
    
    if (!refreshToken && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    }

    const newTokens = await authService.refreshTokens(refreshToken);

    logger.info('Tokens refreshed successfully', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update refresh token cookie if using cookies
    if (process.env.USE_REFRESH_COOKIES === 'true') {
      res.cookie('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      success: true,
      tokens: newTokens
    });

  } catch (error: any) {
    logger.error('Token refresh failed:', {
      error: error.message,
      code: error.code,
      ip: req.ip
    });

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'REFRESH_FAILED',
        message: error.message || 'Token refresh failed'
      }
    });
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Protected
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as any as AuthenticatedRequest;
    const userId = authenticatedReq.user.id.toString();

    // Extract session ID from token payload if available
    const sessionId = req.headers['x-session-id'] as string;

    await authService.logout(userId, sessionId);

    logger.info('User logged out successfully', {
      userId,
      walletAddress: authenticatedReq.user.walletAddress,
      ip: req.ip
    });

    // Clear refresh token cookie if using cookies
    if (process.env.USE_REFRESH_COOKIES === 'true') {
      res.clearCookie('refreshToken');
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    logger.error('Logout failed:', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed'
      }
    });
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as any as AuthenticatedRequest;
    
    // Return user context (already verified by middleware)
    res.json({
      success: true,
      user: {
        id: authenticatedReq.user.id,
        walletAddress: authenticatedReq.user.walletAddress,
        username: authenticatedReq.user.username,
        userType: authenticatedReq.user.userType,
        isVerified: authenticatedReq.user.isVerified,
        reputation: authenticatedReq.user.reputation
      }
    });

  } catch (error: any) {
    logger.error('Get user profile failed:', {
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile'
      }
    });
  }
});

/**
 * @route   GET /api/v1/auth/status
 * @desc    Check authentication status and token validity
 * @access  Protected
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as any as AuthenticatedRequest;

    res.json({
      success: true,
      status: 'authenticated',
      user: {
        id: authenticatedReq.user.id,
        walletAddress: authenticatedReq.user.walletAddress,
        userType: authenticatedReq.user.userType,
        isVerified: authenticatedReq.user.isVerified
      },
      tokenValid: true
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_CHECK_FAILED',
        message: 'Authentication status check failed'
      }
    });
  }
});

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get active sessions for current user
 * @access  Protected
 */
router.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const authenticatedReq = req as any as AuthenticatedRequest;
    
    // Get active sessions count (for security monitoring)
    const activeSessionsCount = authService.getActiveSessionsCount();

    res.json({
      success: true,
      data: {
        activeSessionsCount: activeSessionsCount,
        currentSession: {
          authenticated: true,
          userType: authenticatedReq.user.userType,
          isVerified: authenticatedReq.user.isVerified
        }
      }
    });

  } catch (error: any) {
    logger.error('Get sessions failed:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'SESSIONS_FETCH_FAILED',
        message: 'Failed to fetch session information'
      }
    });
  }
});

/**
 * @route   POST /api/v1/auth/validate-address
 * @desc    Validate wallet address format (utility endpoint)
 * @access  Public
 */
router.post('/validate-address', [validateWalletAddress], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    
    res.json({
      success: true,
      valid: errors.isEmpty(),
      address: req.body.walletAddress?.toLowerCase(),
      errors: errors.isEmpty() ? undefined : errors.array()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Address validation failed'
      }
    });
  }
});

export default router;
