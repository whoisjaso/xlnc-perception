import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { createErrorResponse } from '../utils/theatrical';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json(
      createErrorResponse(
        err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        'VALIDATION_ERROR',
        400
      )
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      createErrorResponse(
        'Invalid token',
        'AUTHENTICATION_FAILED',
        401
      )
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      createErrorResponse(
        'Token expired',
        'TOKEN_EXPIRED',
        401
      )
    );
  }

  // Default error
  const statusCode = (err as any).statusCode || 500;
  const errorCode = (err as any).code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json(
    createErrorResponse(err.message, errorCode, statusCode)
  );
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
