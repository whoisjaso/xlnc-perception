import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { createTheatricalResponse, createErrorResponse } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';
import { users } from '../db/schema/users';
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateRetellConfigSchema = z.object({
  retellApiKey: z.string().min(10).optional(),
  retellAgentId: z.string().optional(),
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  res.json(
    createTheatricalResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl,
        hasRetellConfig: !!user.retellApiKeyEncrypted,
        createdAt: user.createdAt,
      },
    })
  );
}));

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const updates = updateProfileSchema.parse(req.body);

  const [updatedUser] = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  logTheatrical.success(`Profile updated for: ${updatedUser.email}`);

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
      message: 'Sovereign identity matrix updated',
    })
  );
}));

/**
 * PATCH /api/users/retell-config
 * Update Retell AI configuration
 */
router.patch('/retell-config', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { retellApiKey, retellAgentId } = updateRetellConfigSchema.parse(req.body);

  const updates: any = {};

  if (retellApiKey) {
    // Encrypt API key before storing (simplified - use proper encryption)
    updates.retellApiKeyEncrypted = Buffer.from(retellApiKey).toString('base64');
  }

  if (retellAgentId !== undefined) {
    updates.retellAgentId = retellAgentId || null;
  }

  updates.updatedAt = new Date();

  await db.update(users).set(updates).where(eq(users.id, userId));

  logTheatrical.success(`Retell AI configuration updated for user: ${userId}`);

  res.json(
    createTheatricalResponse({
      message: 'Neural uplink credentials synchronized',
      hasRetellConfig: true,
    }, {
      consciousness_level: 'SOVEREIGN',
    })
  );
}));

export default router;
