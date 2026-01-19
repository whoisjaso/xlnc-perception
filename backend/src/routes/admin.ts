import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { createTheatricalResponse, createErrorResponse } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';
import { db } from '../config/database';
import { users } from '../db/schema/users';
import { callLogs } from '../db/schema/calls';
import { eq, sql, desc, and, or, like, gte, lte, count } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication AND admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// Validation Schemas
const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  plan: z.enum(['INITIATE', 'SOVEREIGN', 'EMPIRE']).optional(),
  isAdmin: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

const userSearchSchema = z.object({
  search: z.string().optional(),
  plan: z.enum(['INITIATE', 'SOVEREIGN', 'EMPIRE']).optional(),
  isAdmin: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * GET /api/admin/users
 * List all users with filtering and pagination
 */
router.get('/users', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, plan, isAdmin, limit, offset } = userSearchSchema.parse({
    ...req.query,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
    isAdmin: req.query.isAdmin === 'true' ? true : req.query.isAdmin === 'false' ? false : undefined,
  });

  // Build filter conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }

  if (plan) {
    conditions.push(eq(users.plan, plan));
  }

  if (isAdmin !== undefined) {
    conditions.push(eq(users.isAdmin, isAdmin));
  }

  // Get users with filters
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    plan: users.plan,
    isAdmin: users.isAdmin,
    avatarUrl: users.avatarUrl,
    hasRetellConfig: sql<boolean>`${users.retellApiKeyEncrypted} IS NOT NULL`,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ total }] = await db.select({ total: count() })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  logTheatrical.info(`Admin user list requested by: ${req.user!.email} (${allUsers.length} results)`);

  res.json(
    createTheatricalResponse({
      users: allUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  );
}));

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 */
router.get('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;

  const [user] = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    plan: users.plan,
    isAdmin: users.isAdmin,
    avatarUrl: users.avatarUrl,
    retellAgentId: users.retellAgentId,
    hasRetellConfig: sql<boolean>`${users.retellApiKeyEncrypted} IS NOT NULL`,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  // Get user's call logs count
  const [{ callCount }] = await db.select({ callCount: count() })
    .from(callLogs)
    .where(eq(callLogs.userId, userId));

  logTheatrical.info(`Admin viewed user details: ${user.email}`);

  res.json(
    createTheatricalResponse({
      user: {
        ...user,
        callCount,
      },
    })
  );
}));

/**
 * PATCH /api/admin/users/:id
 * Update user details (plan, role, etc.)
 */
router.patch('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  const updates = updateUserSchema.parse(req.body);

  // Check if user exists
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!existingUser) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  // Prevent admin from demoting themselves
  if (userId === req.user!.id && updates.isAdmin === false) {
    return res.status(400).json(
      createErrorResponse(
        'Cannot remove your own admin privileges',
        'INVALID_OPERATION',
        400
      )
    );
  }

  // Update user
  const [updatedUser] = await db.update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  logTheatrical.success(
    `Admin updated user: ${updatedUser.email} by ${req.user!.email} - Changes: ${JSON.stringify(updates)}`
  );

  res.json(
    createTheatricalResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        isAdmin: updatedUser.isAdmin,
        avatarUrl: updatedUser.avatarUrl,
      },
      message: 'User profile updated successfully',
    })
  );
}));

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (mark as deleted, don't actually remove)
 */
router.delete('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (userId === req.user!.id) {
    return res.status(400).json(
      createErrorResponse(
        'Cannot delete your own account',
        'INVALID_OPERATION',
        400
      )
    );
  }

  // Check if user exists
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!existingUser) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  // Delete user (actual deletion - can be changed to soft delete if needed)
  await db.delete(users).where(eq(users.id, userId));

  logTheatrical.warn(`Admin deleted user: ${existingUser.email} by ${req.user!.email}`);

  res.json(
    createTheatricalResponse({
      message: 'User deleted successfully',
      deletedUserId: userId,
    })
  );
}));

/**
 * GET /api/admin/stats
 * Get global system statistics
 */
router.get('/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get user counts by plan
  const userStats = await db.select({
    plan: users.plan,
    count: count(),
  })
    .from(users)
    .groupBy(users.plan);

  // Get total users
  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);

  // Get admin count
  const [{ adminCount }] = await db.select({ adminCount: count() })
    .from(users)
    .where(eq(users.isAdmin, true));

  // Get total calls
  const [{ totalCalls }] = await db.select({ totalCalls: count() }).from(callLogs);

  // Get users with Retell config
  const [{ retellUsers }] = await db.select({ retellUsers: count() })
    .from(users)
    .where(sql`${users.retellApiKeyEncrypted} IS NOT NULL`);

  // Mock MRR calculation (can be enhanced based on actual pricing)
  const planPricing = { INITIATE: 0, SOVEREIGN: 97, EMPIRE: 497 };
  const mrr = userStats.reduce((total, stat) => {
    return total + (planPricing[stat.plan as keyof typeof planPricing] || 0) * stat.count;
  }, 0);

  logTheatrical.info(`Admin viewed global stats: ${req.user!.email}`);

  res.json(
    createTheatricalResponse({
      stats: {
        totalUsers,
        adminCount,
        totalCalls,
        retellUsers,
        mrr,
        usersByPlan: userStats,
      },
    })
  );
}));

/**
 * GET /api/admin/call-logs
 * Get all call logs across all users (with pagination)
 */
router.get('/call-logs', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const logs = await db.select({
    id: callLogs.id,
    userId: callLogs.userId,
    retellCallId: callLogs.retellCallId,
    agentId: callLogs.agentId,
    fromNumber: callLogs.fromNumber,
    toNumber: callLogs.toNumber,
    status: callLogs.callStatus,
    outcome: callLogs.callOutcome,
    duration: callLogs.durationMs,
    sentiment: callLogs.userSentiment,
    costCents: callLogs.costCents,
    createdAt: callLogs.startTimestamp,
  })
    .from(callLogs)
    .orderBy(desc(callLogs.startTimestamp))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(callLogs);

  logTheatrical.info(`Admin viewed call logs: ${req.user!.email} (${logs.length} results)`);

  res.json(
    createTheatricalResponse({
      callLogs: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  );
}));

export default router;
