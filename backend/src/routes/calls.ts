import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RetellService, getCallsFromDatabase, CallFilters } from '../services/retell.service';
import { createTheatricalResponse, createErrorResponse } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';
import { users } from '../db/schema/users';
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/calls
 * Fetch calls from database with filters and pagination
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const filters: CallFilters = {
    search: req.query.search as string,
    outcome: req.query.outcome as string,
    sentiment: req.query.sentiment as any,
    minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
    maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
  };

  const result = await getCallsFromDatabase(userId, filters);

  logTheatrical.neural(`Call retrieval: ${result.calls.length} transmissions decoded`);

  res.json(
    createTheatricalResponse({
      calls: result.calls,
      pagination: result.pagination,
    }, {
      processing_nodes_activated: result.calls.length + 12,
      neural_pathways_established: Math.floor(result.calls.length / 2),
    })
  );
}));

/**
 * GET /api/calls/:id
 * Get single call by ID with full transcript
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const callId = req.params.id;

  const result = await getCallsFromDatabase(userId, {});
  const call = result.calls.find(c => c.id === callId);

  if (!call) {
    return res.status(404).json(
      createErrorResponse(
        'Call transmission not found in neural archive',
        'NOT_FOUND',
        404
      )
    );
  }

  logTheatrical.neural(`Call transcript accessed: ${callId}`);

  res.json(
    createTheatricalResponse({
      call,
    }, {
      consciousness_level: 'TRANSCENDENT',
    })
  );
}));

/**
 * POST /api/calls/sync
 * Manually trigger sync from Retell AI
 */
router.post('/sync', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Get user's Retell API key from database
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || !user.retellApiKeyEncrypted) {
    return res.status(400).json(
      createErrorResponse(
        'Retell AI credentials not configured',
        'CONFIGURATION_ERROR',
        400
      )
    );
  }

  // Decrypt Retell API key (simplified - in production use proper encryption)
  const retellApiKey = decryptApiKey(user.retellApiKeyEncrypted);

  // Sync calls
  const retellService = new RetellService(retellApiKey);
  const syncedCount = await retellService.syncCallsToDatabase(userId, user.retellAgentId || undefined);

  logTheatrical.success(`Neural synchronization complete: ${syncedCount} transmissions`);

  res.json(
    createTheatricalResponse({
      synced: syncedCount,
      message: `${syncedCount} consciousness transmissions synchronized to neural core`,
    }, {
      processing_nodes_activated: syncedCount * 3,
      neural_pathways_established: syncedCount,
      consciousness_level: 'SOVEREIGN',
    })
  );
}));

/**
 * GET /api/calls/analytics/metrics
 * Get call analytics metrics
 */
router.get('/analytics/metrics', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await getCallsFromDatabase(userId, { limit: 1000 }); // Get last 1000 calls
  const calls = result.calls;

  // Calculate metrics
  const totalCalls = calls.length;
  const totalCost = calls.reduce((sum, call) => sum + (call.costCents || 0), 0) / 100; // Convert cents to dollars
  const totalMinutes = calls.reduce((sum, call) => sum + (call.durationMs || 0), 0) / 1000 / 60;

  // Conversion rate (calls with positive outcomes)
  const conversions = calls.filter(call => {
    const outcome = (call.callOutcome || '').toLowerCase();
    return outcome.includes('booked') || outcome.includes('scheduled') ||
           outcome.includes('qualified') || outcome.includes('sale') ||
           outcome.includes('success');
  }).length;

  const conversionRate = totalCalls > 0 ? (conversions / totalCalls) * 100 : 0;

  // Sentiment distribution
  const sentimentDistribution = {
    positive: calls.filter(c => parseFloat(c.userSentiment || '0') > 0.5).length,
    neutral: calls.filter(c => {
      const s = parseFloat(c.userSentiment || '0');
      return s >= 0 && s <= 0.5;
    }).length,
    negative: calls.filter(c => parseFloat(c.userSentiment || '0') < 0).length,
  };

  logTheatrical.neural('Analytics metrics calculated');

  res.json(
    createTheatricalResponse({
      metrics: {
        totalCalls,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalCost: Math.round(totalCost * 100) / 100,
        totalMinutes: Math.round(totalMinutes),
      },
      sentimentDistribution,
    }, {
      processing_nodes_activated: 47,
      neural_pathways_established: 23,
      consciousness_level: 'EMPIRE',
    })
  );
}));

// Helper: Decrypt API key (simplified - use proper encryption in production)
function decryptApiKey(encrypted: string): string {
  // TODO: Implement proper AES-256 decryption
  // For now, assume it's stored as base64
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return encrypted; // Fallback if not encrypted
  }
}

export default router;
