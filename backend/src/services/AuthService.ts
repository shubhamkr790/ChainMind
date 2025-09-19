import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';
import {
  LoginRequest,
  VerifyRequest,
  LoginResponse,
  VerifyResponse,
  AuthTokens,
  JWTPayload,
  RefreshTokenPayload,
  SignatureVerification,
  UserSession,
  AuthError,
  RateLimitInfo,
  AuthAuditLog,
  AuthConfig
} from '../types/auth';

class AuthenticationService {
  private config: AuthConfig;
  private activeSessions: Map<string, UserSession> = new Map();
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();
  private refreshTokenStore: Map<string, RefreshTokenPayload> = new Map();

  constructor() {
    this.config = {
      jwt: {
        secret: process.env.JWT_SECRET || 'chainmind-super-secret-key-change-in-production',
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: process.env.JWT_ISSUER || 'chainmind.ai'
      },
      nonce: {
        expiry: parseInt(process.env.NONCE_EXPIRY_SECONDS || '300'), // 5 minutes
        length: 6
      },
      session: {
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5'),
        cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600') // 1 hour
      },
      rateLimit: {
        loginAttempts: parseInt(process.env.LOGIN_RATE_LIMIT || '10'),
        windowMs: parseInt(process.env.LOGIN_RATE_WINDOW || '900000') // 15 minutes
      }
    };

    // Start session cleanup
    this.startSessionCleanup();
  }

  /**
   * Initiate wallet-based authentication
   */
  async initiateLogin(request: LoginRequest): Promise<LoginResponse> {
    try {
      const { walletAddress } = request;

      // Validate wallet address format
      if (!this.isValidWalletAddress(walletAddress)) {
        throw this.createAuthError('INVALID_WALLET', 'Invalid wallet address format', 400);
      }

      // Check rate limiting
      await this.checkRateLimit(walletAddress);

      // Find or create user
      let user = await User.findByWalletAddress(walletAddress);
      
      if (!user) {
        // Create new user with initial reputation
        user = new User({
          walletAddress: walletAddress.toLowerCase(),
          userType: 'developer', // Default type
          isVerified: false,
          reputation: {
            score: 1000,
            jobsCompleted: 0,
            jobsPosted: 0,
            totalEarnings: 0,
            totalSpent: 0,
            successRate: 0,
            averageRating: 0,
            totalRatings: 0
          }
        });
      }

      // Generate new nonce
      const nonce = user.generateNonce();
      await user.save();

      // Create sign-in message
      const message = this.createSignMessage(walletAddress, nonce);

      // Log authentication attempt
      await this.logAuthEvent({
        walletAddress,
        action: 'LOGIN_ATTEMPT',
        success: true,
        metadata: {
          timestamp: new Date()
        }
      });

      return {
        success: true,
        nonce,
        message,
        expiresIn: this.config.nonce.expiry
      };

    } catch (error: any) {
      logger.error('Login initiation failed:', error);
      
      // Log failed attempt
      await this.logAuthEvent({
        walletAddress: request.walletAddress,
        action: 'LOGIN_ATTEMPT',
        success: false,
        metadata: {
          timestamp: new Date(),
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Verify signature and complete authentication
   */
  async verifySignature(request: VerifyRequest): Promise<VerifyResponse> {
    try {
      const { walletAddress, signature, message } = request;

      // Validate inputs
      if (!this.isValidWalletAddress(walletAddress)) {
        throw this.createAuthError('INVALID_WALLET', 'Invalid wallet address format', 400);
      }

      // Check rate limiting
      await this.checkRateLimit(walletAddress);

      // Find user
      const user = await User.findByWalletAddress(walletAddress);
      if (!user) {
        throw this.createAuthError('USER_NOT_FOUND', 'User not found', 404);
      }

      // Verify signature
      const verification = await this.verifyWalletSignature(message, signature, walletAddress);
      if (!verification.isValid) {
        // Log invalid signature attempt
        await this.logAuthEvent({
          userId: (user._id as any).toString(),
          walletAddress,
          action: 'SIGNATURE_INVALID',
          success: false,
          metadata: {
            timestamp: new Date(),
            error: verification.error || 'Invalid signature'
          }
        });

        throw this.createAuthError('INVALID_SIGNATURE', 'Invalid signature', 401);
      }

      // Check if nonce is still valid (within expiry window)
      const expectedMessage = this.createSignMessage(walletAddress, user.nonce);
      if (message !== expectedMessage) {
        throw this.createAuthError('EXPIRED_NONCE', 'Nonce expired or invalid', 401);
      }

      const isNewUser = !user.isVerified;

      // Mark user as verified and update login time
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Create session
      const session = await this.createSession(user, tokens);

      // Clear rate limit for successful login
      this.rateLimitMap.delete(walletAddress);

      // Log successful login
      await this.logAuthEvent({
        userId: (user._id as any).toString(),
        walletAddress,
        action: 'LOGIN_SUCCESS',
        success: true,
        metadata: {
          timestamp: new Date(),
          sessionId: session.sessionId
        }
      });

      // Prepare user data for response
      const userData = {
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

      return {
        success: true,
        user: userData,
        tokens,
        isNewUser
      };

    } catch (error: any) {
      logger.error('Signature verification failed:', error);

      // Log failed verification
      await this.logAuthEvent({
        walletAddress: request.walletAddress,
        action: 'LOGIN_FAILED',
        success: false,
        metadata: {
          timestamp: new Date(),
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as RefreshTokenPayload;
      
      // Check if refresh token exists in store
      const storedToken = this.refreshTokenStore.get(decoded.tokenId);
      if (!storedToken || storedToken.userId !== decoded.userId) {
        throw this.createAuthError('TOKEN_INVALID', 'Invalid refresh token', 401);
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw this.createAuthError('USER_NOT_FOUND', 'User not found', 404);
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(user);

      // Remove old refresh token from store
      this.refreshTokenStore.delete(decoded.tokenId);

      // Log token refresh
      await this.logAuthEvent({
        userId: (user._id as any).toString(),
        walletAddress: user.walletAddress,
        action: 'TOKEN_REFRESH',
        success: true,
        metadata: {
          timestamp: new Date()
        }
      });

      return newTokens;

    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw this.createAuthError('TOKEN_INVALID', 'Invalid or expired refresh token', 401);
      }
      
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return; // Silently handle missing user
      }

      // Remove specific session or all sessions for user
      if (sessionId) {
        this.activeSessions.delete(sessionId);
      } else {
        // Remove all sessions for this user
        for (const [id, session] of this.activeSessions.entries()) {
          if (session.userId === userId) {
            this.activeSessions.delete(id);
          }
        }
      }

      // Log logout
      await this.logAuthEvent({
        userId,
        walletAddress: user.walletAddress,
        action: 'LOGOUT',
        success: true,
        metadata: {
          timestamp: new Date(),
          sessionId
        }
      });

    } catch (error: any) {
      logger.error('Logout failed:', error);
    }
  }

  /**
   * Verify JWT token and return user context
   */
  async verifyToken(token: string): Promise<{ user: IUser; payload: JWTPayload }> {
    try {
      const payload = jwt.verify(token, this.config.jwt.secret) as JWTPayload;
      
      const user = await User.findById(payload.userId);
      if (!user) {
        throw this.createAuthError('USER_NOT_FOUND', 'User not found', 404);
      }

      return { user, payload };

    } catch (error: any) {
      logger.error('Token verification failed:', error);
      
      if (error.name === 'JsonWebTokenError') {
        throw this.createAuthError('TOKEN_INVALID', 'Invalid token', 401);
      } else if (error.name === 'TokenExpiredError') {
        throw this.createAuthError('TOKEN_EXPIRED', 'Token expired', 401);
      }
      
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async verifyWalletSignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): Promise<SignatureVerification> {
    try {
      // Recover address from signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare with expected address (case-insensitive)
      const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

      return {
        isValid,
        recoveredAddress: recoveredAddress.toLowerCase()
      };

    } catch (error: any) {
      logger.error('Signature verification error:', error);
      
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  private createSignMessage(walletAddress: string, nonce: number): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `Welcome to ChainMind!\n\nPlease sign this message to authenticate with your wallet.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  private async generateTokens(user: IUser): Promise<AuthTokens> {
    const tokenId = crypto.randomUUID();
    
    const accessPayload: JWTPayload = {
      userId: (user._id as any).toString(),
      walletAddress: user.walletAddress,
      userType: user.userType,
      jti: tokenId
    };

    const refreshPayload: RefreshTokenPayload = {
      userId: (user._id as any).toString(),
      walletAddress: user.walletAddress,
      tokenId
    };

    const accessToken = jwt.sign(accessPayload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.accessTokenExpiry,
      issuer: this.config.jwt.issuer,
      audience: 'chainmind-api'
    } as any);

    const refreshToken = jwt.sign(refreshPayload, this.config.jwt.secret, {
      expiresIn: this.config.jwt.refreshTokenExpiry,
      issuer: this.config.jwt.issuer,
      audience: 'chainmind-refresh'
    } as any);

    // Store refresh token
    this.refreshTokenStore.set(tokenId, refreshPayload);

    // Calculate expiry time in seconds
    const expiresIn = this.parseExpiry(this.config.jwt.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer'
    };
  }

  private async createSession(user: IUser, tokens: AuthTokens): Promise<UserSession> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (tokens.expiresIn * 1000));

    const session: UserSession = {
      userId: (user._id as any).toString(),
      walletAddress: user.walletAddress,
      sessionId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      isActive: true,
      metadata: {}
    };

    // Remove old sessions if user has too many
    await this.cleanupUserSessions((user._id as any).toString());

    // Store session
    this.activeSessions.set(sessionId, session);

    return session;
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([, session]) => session.userId === userId)
      .sort(([, a], [, b]) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Keep only the most recent sessions
    if (userSessions.length >= this.config.session.maxConcurrent) {
      const sessionsToRemove = userSessions.slice(this.config.session.maxConcurrent - 1);
      sessionsToRemove.forEach(([sessionId]) => {
        this.activeSessions.delete(sessionId);
      });
    }
  }

  private async checkRateLimit(walletAddress: string): Promise<void> {
    const now = new Date();
    const rateLimit = this.rateLimitMap.get(walletAddress);

    if (rateLimit) {
      // Check if still locked
      if (rateLimit.lockedUntil && now < rateLimit.lockedUntil) {
        const remaining = Math.ceil((rateLimit.lockedUntil.getTime() - now.getTime()) / 1000);
        throw this.createAuthError(
          'UNAUTHORIZED', 
          `Too many failed attempts. Try again in ${remaining} seconds.`, 
          429
        );
      }

      // Check if within rate limit window
      const timeDiff = now.getTime() - rateLimit.lastAttempt.getTime();
      if (timeDiff < this.config.rateLimit.windowMs) {
        rateLimit.attempts++;
        rateLimit.lastAttempt = now;

        if (rateLimit.attempts >= this.config.rateLimit.loginAttempts) {
          // Lock for 15 minutes
          rateLimit.lockedUntil = new Date(now.getTime() + (15 * 60 * 1000));
          
          // Log account locked
          await this.logAuthEvent({
            walletAddress,
            action: 'ACCOUNT_LOCKED',
            success: false,
            metadata: {
              timestamp: now,
              error: 'Too many failed login attempts'
            }
          });

          throw this.createAuthError('UNAUTHORIZED', 'Account temporarily locked due to too many failed attempts.', 429);
        }
      } else {
        // Reset rate limit if outside window
        rateLimit.attempts = 1;
        rateLimit.lastAttempt = now;
        delete rateLimit.lockedUntil;
      }
    } else {
      // First attempt
      this.rateLimitMap.set(walletAddress, {
        walletAddress,
        attempts: 1,
        lastAttempt: now
      });
    }
  }

  private isValidWalletAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  private createAuthError(code: AuthError['code'], message: string, statusCode: number): AuthError {
    const error = new Error(message) as any;
    error.code = code;
    error.statusCode = statusCode;
    return error;
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900;
    }
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      
      // Clean expired sessions
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now > session.expiresAt) {
          this.activeSessions.delete(sessionId);
        }
      }

      // Clean expired refresh tokens
      for (const [tokenId, payload] of this.refreshTokenStore.entries()) {
        try {
          jwt.verify(jwt.sign(payload, this.config.jwt.secret), this.config.jwt.secret);
        } catch {
          this.refreshTokenStore.delete(tokenId);
        }
      }

      // Clean old rate limit entries
      for (const [walletAddress, rateLimit] of this.rateLimitMap.entries()) {
        const timeDiff = now.getTime() - rateLimit.lastAttempt.getTime();
        if (timeDiff > this.config.rateLimit.windowMs && !rateLimit.lockedUntil) {
          this.rateLimitMap.delete(walletAddress);
        }
      }

    }, this.config.session.cleanupInterval * 1000);
  }

  private async logAuthEvent(event: AuthAuditLog): Promise<void> {
    try {
      logger.info('Auth event:', event);
      // Here you could also store to database for persistent audit logs
    } catch (error: any) {
      logger.error('Failed to log auth event:', error);
    }
  }

  // Public getters for debugging/monitoring
  public getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  public getRateLimitInfo(walletAddress: string): RateLimitInfo | undefined {
    return this.rateLimitMap.get(walletAddress);
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
export default authService;
