import winston from 'winston';
import env from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format that handles both strings and objects
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  const logMessage = typeof message === 'object' ? JSON.stringify(message) : message;
  return `${timestamp} [${level}]: ${stack || logMessage} ${metaString}`.trim();
});

// Create Winston logger with proper TypeScript types
const winstonLogger = winston.createLogger({
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

// Export logger with proper types that accept both strings and objects
export const logger = {
  info: (message: string | object, ...meta: any[]) => winstonLogger.info(message as any, ...meta),
  warn: (message: string | object, ...meta: any[]) => winstonLogger.warn(message as any, ...meta),
  error: (message: string | object, ...meta: any[]) => winstonLogger.error(message as any, ...meta),
  debug: (message: string | object, ...meta: any[]) => winstonLogger.debug(message as any, ...meta),
};

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
