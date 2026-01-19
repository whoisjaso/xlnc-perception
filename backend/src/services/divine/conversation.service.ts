import { db } from '../../config/database';
import { conversations, Conversation, NewConversation } from '../../db/schema/conversations';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { logger } from '../../utils/logger';

export interface TranscriptEntry {
  role: 'agent' | 'user';
  content: string;
  timestamp?: string;
}

export class ConversationService {
  async create(data: NewConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();

    logger.info({ conversationId: conversation.id, callId: data.callId }, 'Conversation created');

    return conversation;
  }

  async getById(id: string): Promise<Conversation | null> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0] || null;
  }

  async getByCallId(callId: string): Promise<Conversation | null> {
    const result = await db.select().from(conversations).where(eq(conversations.callId, callId)).limit(1);
    return result[0] || null;
  }

  async update(id: string, data: Partial<NewConversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();

    return updated;
  }

  async endConversation(
    callId: string,
    data: {
      status: string;
      durationMs?: number;
      transcript?: TranscriptEntry[];
      summary?: string;
      intent?: string;
      sentiment?: string;
      extractedData?: Record<string, unknown>;
    }
  ): Promise<Conversation | null> {
    const conversation = await this.getByCallId(callId);
    if (!conversation) {
      logger.warn({ callId }, 'Conversation not found for call end');
      return null;
    }

    return this.update(conversation.id, {
      status: data.status,
      durationMs: data.durationMs,
      transcript: data.transcript,
      summary: data.summary,
      intent: data.intent,
      sentiment: data.sentiment,
      extractedData: data.extractedData,
      endedAt: new Date(),
    });
  }

  async getRecentByCustomer(customerId: string, limit: number = 10): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.customerId, customerId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  }

  async getRecentByClient(clientId: string, limit: number = 50): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.clientId, clientId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  }

  async getStats(clientId: string, hours: number = 24): Promise<{
    total: number;
    byIntent: Record<string, number>;
    bySentiment: Record<string, number>;
    avgDuration: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentConversations = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.clientId, clientId), gte(conversations.createdAt, since)));

    const byIntent: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    let totalDuration = 0;

    for (const conv of recentConversations) {
      if (conv.intent) {
        byIntent[conv.intent] = (byIntent[conv.intent] || 0) + 1;
      }
      if (conv.sentiment) {
        bySentiment[conv.sentiment] = (bySentiment[conv.sentiment] || 0) + 1;
      }
      if (conv.durationMs) {
        totalDuration += conv.durationMs;
      }
    }

    return {
      total: recentConversations.length,
      byIntent,
      bySentiment,
      avgDuration: recentConversations.length > 0 ? totalDuration / recentConversations.length : 0,
    };
  }

  async markFollowUpSent(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        followUpScheduled: true,
        followUpSentAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async startConversation(data: {
    customerId: string;
    clientId: string;
    callId: string;
    direction: string;
    phone: string;
  }): Promise<Conversation> {
    return this.create({
      customerId: data.customerId,
      clientId: data.clientId,
      callId: data.callId,
      direction: data.direction,
      status: 'in_progress',
    });
  }

  async getCustomerConversations(customerId: string, limit: number = 10): Promise<Conversation[]> {
    return this.getRecentByCustomer(customerId, limit);
  }

  async updateFromRetellAnalysis(
    callId: string,
    analysis: {
      summary?: string;
      sentiment?: string;
      successful?: boolean;
      customData?: Record<string, unknown>;
    }
  ): Promise<Conversation | null> {
    const conversation = await this.getByCallId(callId);
    if (!conversation) {
      logger.warn({ callId }, 'Conversation not found for Retell analysis update');
      return null;
    }

    const updateData: Partial<NewConversation> = {};
    if (analysis.summary) updateData.summary = analysis.summary;
    if (analysis.sentiment) updateData.sentiment = analysis.sentiment;
    if (analysis.customData) {
      updateData.extractedData = {
        ...(conversation.extractedData as Record<string, unknown> || {}),
        retellAnalysis: analysis.customData,
        callSuccessful: analysis.successful,
      };
    }

    return this.update(conversation.id, updateData);
  }

  async addBookingToConversation(
    callId: string,
    booking: {
      eventId: string;
      appointmentTime: string;
      customerName?: string;
    }
  ): Promise<void> {
    const conversation = await this.getByCallId(callId);
    if (!conversation) return;

    const existingData = (conversation.extractedData as Record<string, unknown>) || {};

    await this.update(conversation.id, {
      extractedData: {
        ...existingData,
        booking: {
          eventId: booking.eventId,
          appointmentTime: booking.appointmentTime,
          customerName: booking.customerName,
          bookedAt: new Date().toISOString(),
        },
      },
    });
  }

  async addNoteToConversation(
    callId: string,
    note: Record<string, unknown>
  ): Promise<void> {
    const conversation = await this.getByCallId(callId);
    if (!conversation) return;

    const existingData = (conversation.extractedData as Record<string, unknown>) || {};
    const notes = (existingData.notes as Record<string, unknown>[]) || [];

    await this.update(conversation.id, {
      extractedData: {
        ...existingData,
        notes: [...notes, { ...note, timestamp: new Date().toISOString() }],
      },
    });
  }

  async addDataToConversation(
    callId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const conversation = await this.getByCallId(callId);
    if (!conversation) return;

    const existingData = (conversation.extractedData as Record<string, unknown>) || {};

    await this.update(conversation.id, {
      extractedData: {
        ...existingData,
        collectedInfo: {
          ...(existingData.collectedInfo as Record<string, unknown> || {}),
          ...data,
        },
      },
    });
  }
}

export const conversationService = new ConversationService();
