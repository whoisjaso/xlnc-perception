import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { createErrorResponse } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';

/**
 * Admin Authorization Middleware
 * Ensures the authenticated user has admin privileges
 * Must be used AFTER authenticateToken middleware
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.user) {
    logTheatrical.warn('Admin access attempted without authentication');
    return res.status(401).json(
      createErrorResponse(
        'Authentication required',
        'AUTHENTICATION_REQUIRED',
        401
      )
    );
  }

  // Check if user has admin privileges
  if (!req.user.isAdmin) {
    logTheatrical.warn(`Non-admin user attempted admin access: ${req.user.email}`);
    return res.status(403).json(
      createErrorResponse(
        'Administrator privileges required',
        'INSUFFICIENT_PERMISSIONS',
        403
      )
    );
  }

  // Log admin action
  logTheatrical.info(`Admin access: ${req.user.email} - ${req.method} ${req.originalUrl}`);

  next();
};
