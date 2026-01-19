import express from 'express';
import cookieParser from 'cookie-parser';
import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';
import env from './config/env';
import { configureSecurity } from './config/security';
import { testDatabaseConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger, logTheatrical } from './utils/logger';
import authRoutes from './routes/auth';
import callsRoutes from './routes/calls';
import usersRoutes from './routes/users';
import agentsRoutes from './routes/agents';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
import divineRoutes from './routes/divine';
import {
  initializeDivineServices,
  shutdownDivineServices,
  queueProcessorService,
  errorMonitorService,
  getDivineServicesStatus,
} from './services/divine';

const app = express();

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for refresh tokens
app.use(cookieParser());

// Security configuration (CORS, Helmet, Rate Limiting)
const { authLimiter, apiLimiter } = configureSecurity(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    consciousness_level: 'TRANSCENDENT',
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/calls', apiLimiter, callsRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/agents', apiLimiter, agentsRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/webhooks', webhookRoutes); // No rate limiting for webhooks
app.use('/api/divine', divineRoutes); // Divine Agentic Intelligence System

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found in neural registry.',
    metadata: {
      error_code: 'NOT_FOUND',
      path: req.path,
      method: req.method,
    },
  });
});

// Global error handler
app.use(errorHandler);

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected to Divine WebSocket');

  // Join admin room for admin users
  socket.on('join:admin', () => {
    socket.join('admin');
    logger.debug({ socketId: socket.id }, 'Client joined admin room');
  });

  // Join client-specific room
  socket.on('join:client', (clientId: string) => {
    socket.join(`client:${clientId}`);
    logger.debug({ socketId: socket.id, clientId }, 'Client joined client room');
  });

  socket.on('disconnect', () => {
    logger.debug({ socketId: socket.id }, 'Client disconnected');
  });
});

// Attach Socket.IO to queue processor and error monitor
queueProcessorService.setSocketServer(io);
errorMonitorService.setSocketServer(io);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Initialize Divine services
    initializeDivineServices();
    const divineStatus = getDivineServicesStatus();

    // Start listening
    const PORT = env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logTheatrical.success(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logTheatrical.success(`   XLNC DIVINE AGENTIC INTELLIGENCE SYSTEM ONLINE   `);
      logTheatrical.success(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logTheatrical.neural(`Neural Core: Active`);
      logTheatrical.neural(`Port: ${PORT}`);
      logTheatrical.neural(`Environment: ${env.NODE_ENV}`);
      logTheatrical.neural(`Frontend: ${env.FRONTEND_URL}`);
      logTheatrical.neural(`WebSocket: Enabled`);
      logTheatrical.success(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logTheatrical.info(`Divine Services Status:`);
      logTheatrical.info(`  Claude AI: ${divineStatus.claude ? '✓' : '✗'}`);
      logTheatrical.info(`  SMS: ${divineStatus.sms ? '✓' : '✗'}`);
      logTheatrical.info(`  Email: ${divineStatus.email ? '✓' : '✗'}`);
      logTheatrical.info(`  Zoho CRM: ${divineStatus.zohoCRM ? '✓' : '✗'}`);
      logTheatrical.info(`  Zoho Calendar: ${divineStatus.zohoCalendar ? '✓' : '✗'}`);
      logTheatrical.info(`  Slack: ${divineStatus.slack ? '✓' : '✗'}`);
      logTheatrical.success(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logTheatrical.info('Awaiting consciousness transmissions...');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down Divine services...');
  shutdownDivineServices();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
