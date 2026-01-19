import winston from 'winston';
import env from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create Winston logger
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Helper functions for theatrical logging
export const logTheatrical = {
  info: (message: string) => logger.info(`⚡ ${message}`),
  success: (message: string) => logger.info(`✅ ${message}`),
  warn: (message: string) => logger.warn(`⚠️  ${message}`),
  error: (message: string) => logger.error(`❌ ${message}`),
  critical: (message: string) => logger.error(`🔥 ${message}`),
  neural: (message: string) => logger.info(`🧠 ${message}`),
  important: (message: string) => logger.info(`💎 ${message}`),
};
