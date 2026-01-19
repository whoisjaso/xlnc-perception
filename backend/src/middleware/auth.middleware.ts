import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { createErrorResponse } from '../utils/theatrical';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
    plan: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(
      createErrorResponse(
        'No authentication token provided',
        'AUTHENTICATION_FAILED',
        401
      )
    );
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
      plan: decoded.plan,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(
        createErrorResponse(
          'Authentication token expired',
          'TOKEN_EXPIRED',
          401
        )
      );
    }

    return res.status(401).json(
      createErrorResponse(
        'Invalid authentication token',
        'AUTHENTICATION_FAILED',
        401
      )
    );
  }
};

// Admin-only middleware
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json(
      createErrorResponse(
        'Admin access required',
        'UNAUTHORIZED',
        403
      )
    );
  }
  next();
};
