import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { createTheatricalResponse, createErrorResponse, theatricalMessages } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';
import { users } from '../db/schema/users';
import { voiceAgents, NewVoiceAgent } from '../db/schema/agents';
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

const deployAgentSchema = z.object({
  name: z.string().min(2).max(255),
  systemPrompt: z.string().min(10),
  industry: z.string().optional(),
  tone: z.enum(['AGGRESSIVE', 'AUTHORITATIVE', 'EXCLUSIVE', 'URGENT']).optional(),
  goal: z.string().optional(),
  traits: z.string().optional(),
  voiceConfig: z.object({
    voiceId: z.string().optional(),
    language: z.string().optional(),
    temperature: z.number().optional(),
  }).optional(),
});

/**
 * POST /api/agents/deploy
 * Create and deploy a new voice agent to Retell AI
 */
router.post('/deploy', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const agentData = deployAgentSchema.parse(req.body);

  // Get user's Retell API key
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || !user.retellApiKeyEncrypted) {
    return res.status(400).json(
      createErrorResponse(
        'Retell AI credentials not configured. Please configure in Voice Uplink.',
        'CONFIGURATION_ERROR',
        400
      )
    );
  }

  // Decrypt Retell API key
  const retellApiKey = decryptApiKey(user.retellApiKeyEncrypted);

  logTheatrical.neural(`Initiating neural construct deployment for user: ${userId}`);

  try {
    // Create agent in Retell AI
    const retellResponse = await fetch('https://api.retellai.com/v2/create-agent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_name: agentData.name,
        voice_id: agentData.voiceConfig?.voiceId || 'elevenlabs-adrian',
        language: agentData.voiceConfig?.language || 'en-US',
        response_temperature: agentData.voiceConfig?.temperature || 0.7,
        general_prompt: agentData.systemPrompt,
        begin_message: `Hello, this is ${agentData.name}. How can I assist you today?`,
        enable_backchannel: true,
        ambient_sound: 'office',
      }),
    });

    if (!retellResponse.ok) {
      const errorText = await retellResponse.text();
      logTheatrical.error(`Retell agent creation failed: ${errorText}`);
      throw new Error(`Retell API error: ${errorText}`);
    }

    const retellAgent = await retellResponse.json();

    logTheatrical.success(`Retell agent created: ${retellAgent.agent_id}`);

    // Save agent to database
    const [newAgent] = await db.insert(voiceAgents).values({
      userId,
      retellAgentId: retellAgent.agent_id,
      name: agentData.name,
      industry: agentData.industry,
      tone: agentData.tone,
      goal: agentData.goal,
      traits: agentData.traits,
      systemPrompt: agentData.systemPrompt,
      voiceConfig: agentData.voiceConfig || {},
      isActive: true,
      deployedAt: new Date(),
    }).returning();

    logTheatrical.success(`Neural construct archived: ${newAgent.id}`);

    // Return theatrical response
    res.status(201).json(
      createTheatricalResponse({
        agent: {
          id: newAgent.id,
          retellAgentId: newAgent.retellAgentId,
          name: newAgent.name,
          status: 'DEPLOYED',
          phoneNumber: retellAgent.phone_number || 'Pending provisioning',
        },
        message: theatricalMessages.AGENT_DEPLOYED,
      }, {
        processing_nodes_activated: 73,
        neural_pathways_established: 47,
        consciousness_level: 'EMPIRE',
      })
    );

  } catch (error: any) {
    logTheatrical.error(`Agent deployment failed: ${error.message}`);

    return res.status(500).json(
      createErrorResponse(
        error.message,
        'DEPLOYMENT_FAILED',
        500
      )
    );
  }
}));

/**
 * GET /api/agents
 * List all agents for current user
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const agents = await db
    .select()
    .from(voiceAgents)
    .where(eq(voiceAgents.userId, userId))
    .orderBy(voiceAgents.deployedAt);

  logTheatrical.neural(`Retrieved ${agents.length} neural constructs`);

  res.json(
    createTheatricalResponse({
      agents: agents.map(a => ({
        id: a.id,
        retellAgentId: a.retellAgentId,
        name: a.name,
        industry: a.industry,
        tone: a.tone,
        isActive: a.isActive,
        deployedAt: a.deployedAt,
      })),
    })
  );
}));

/**
 * DELETE /api/agents/:id
 * Delete agent from both database and Retell
 */
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const agentId = req.params.id;

  // Get agent
  const [agent] = await db
    .select()
    .from(voiceAgents)
    .where(eq(voiceAgents.id, agentId))
    .limit(1);

  if (!agent || agent.userId !== userId) {
    return res.status(404).json(
      createErrorResponse('Agent not found', 'NOT_FOUND', 404)
    );
  }

  // Get user's Retell API key
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (user?.retellApiKeyEncrypted) {
    const retellApiKey = decryptApiKey(user.retellApiKeyEncrypted);

    try {
      // Delete from Retell
      await fetch(`https://api.retellai.com/v2/delete-agent/${agent.retellAgentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${retellApiKey}`,
        },
      });

      logTheatrical.success(`Agent deleted from Retell: ${agent.retellAgentId}`);
    } catch (error) {
      logTheatrical.warn(`Failed to delete from Retell, continuing with database deletion`);
    }
  }

  // Delete from database
  await db.delete(voiceAgents).where(eq(voiceAgents.id, agentId));

  logTheatrical.success(`Neural construct decommissioned: ${agentId}`);

  res.json(
    createTheatricalResponse({
      message: theatricalMessages.AGENT_DELETED,
    })
  );
}));

// Helper: Decrypt API key
function decryptApiKey(encrypted: string): string {
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return encrypted;
  }
}

export default router;
