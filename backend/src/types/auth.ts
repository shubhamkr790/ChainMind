import { Types } from 'mongoose';
import { Request } from 'express';

// Authentication request types
export interface LoginRequest {
  walletAddress: string;
}

export interface VerifyRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Authentication response types
export interface LoginResponse {
  success: boolean;
  nonce: number;
  message: string;
  expiresIn: number; // seconds
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface VerifyResponse {
  success: boolean;
  user: {
    id: string;
    walletAddress: string;
    username?: string;
    userType: string;
    isVerified: boolean;
    reputation: {
      score: number;
      averageRating: number;
    };
  };
  tokens: AuthTokens;
  isNewUser: boolean;
}

export interface RefreshTokenResponse {
  success: boolean;
  tokens: AuthTokens;
}

// JWT Payload types
export interface JWTPayload {
  userId: string;
  walletAddress: string;
  userType: string;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for refresh token tracking
}

export interface RefreshTokenPayload {
  userId: string;
  walletAddress: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// Authentication context
export interface AuthContext {
  user: {
    id: string;
    walletAddress: string;
    username?: string;
    userType: string;
    isVerified: boolean;
    reputation: {
      score: number;
      averageRating: number;
    };
  };
  token: string;
  issuedAt: Date;
  expiresAt: Date;
}

// Express request extension
export interface AuthenticatedRequest extends Request {
  user: AuthContext['user'];
  token: string;
}

// Error types
export interface AuthError {
  code: 'INVALID_WALLET' | 'INVALID_SIGNATURE' | 'EXPIRED_NONCE' | 'USER_NOT_FOUND' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'UNAUTHORIZED';
  message: string;
  statusCode: number;
}

// Signature verification types
export interface SignatureVerification {
  isValid: boolean;
  recoveredAddress?: string;
  error?: string;
}

// Session types
export interface UserSession {
  userId: string;
  walletAddress: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    location?: string;
  };
}

// Authentication configuration
export interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenExpiry: string; // e.g., '15m'
    refreshTokenExpiry: string; // e.g., '7d'
    issuer: string;
  };
  nonce: {
    expiry: number; // seconds
    length: number;
  };
  session: {
    maxConcurrent: number;
    cleanupInterval: number; // seconds
  };
  rateLimit: {
    loginAttempts: number;
    windowMs: number;
  };
}

// Middleware options
export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  skipRoutes?: string[];
}

// Rate limiting types
export interface RateLimitInfo {
  walletAddress: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

// Audit log types
export interface AuthAuditLog {
  userId?: string;
  walletAddress: string;
  action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'TOKEN_REFRESH' | 'SIGNATURE_INVALID' | 'ACCOUNT_LOCKED';
  success: boolean;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    error?: string;
    sessionId?: string;
  };
}
