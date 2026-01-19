import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';
import env from './env';

export const configureSecurity = (app: Express) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: env.NODE_ENV === 'production'
      ? env.FRONTEND_URL
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
      error: 'Too many authentication attempts. Please try again later.',
      metadata: {
        error_code: 'RATE_LIMIT_EXCEEDED',
        retry_after_seconds: 900
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // General API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
      error: 'Bandwidth capacity exceeded. Throttling active.',
      metadata: {
        error_code: 'BANDWIDTH_EXCEEDED',
        retry_after_seconds: 60
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  return { authLimiter, apiLimiter };
};
