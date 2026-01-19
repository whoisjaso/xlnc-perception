import { db } from '../config/database';
import { callLogs, NewCallLog } from '../db/schema/calls';
import { eq, and, desc, gte, lte, or, like, sql } from 'drizzle-orm';
import { logger, logTheatrical } from '../utils/logger';

const RETELL_API_URL = 'https://api.retellai.com';
const CORS_PROXY = 'https://corsproxy.io/?';

interface RetellCallResponse {
  call_id: string;
  agent_id?: string;
  from_number?: string;
  to_number?: string;
  duration_ms?: number;
  call_status?: string;
  call_analysis?: {
    call_outcome?: string;
    call_summary?: string;
    user_sentiment?: string;
    call_sentiment?: string;
  };
  transcript_object?: any[];
  start_timestamp?: string;
  end_timestamp?: string;
  recording_url?: string;
  cost_metadata?: {
    total_cost?: number;
  };
}

export class RetellService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  /**
   * Fetch calls from Retell API
   */
  async fetchCallsFromRetell(agentId?: string, limit: number = 100): Promise<RetellCallResponse[]> {
    const url = new URL(`${RETELL_API_URL}/v2/list-calls`);
    if (agentId) {
      url.searchParams.append('filter_agent_id', agentId.trim());
    }
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('sort_order', 'descending');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Invalid Retell API key');
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Retell API error: ${errorText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data.calls || []);
    } catch (error: any) {
      // Fallback to CORS proxy if direct fetch fails
      if (error.message?.includes('fetch')) {
        logTheatrical.warn('Direct Retell API call failed, attempting CORS proxy...');
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;
        const proxyResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!proxyResponse.ok) {
          throw new Error(`Retell API error via proxy: ${proxyResponse.statusText}`);
        }

        const data = await proxyResponse.json();
        return Array.isArray(data) ? data : (data.calls || []);
      }

      throw error;
    }
  }

  /**
   * Sync calls from Retell to database
   */
  async syncCallsToDatabase(userId: string, agentId?: string): Promise<number> {
    logTheatrical.neural(`Synchronizing consciousness transmissions for user: ${userId}`);

    const retellCalls = await this.fetchCallsFromRetell(agentId);
    let syncedCount = 0;

    for (const call of retellCalls) {
      try {
        const mappedCall = this.mapRetellCallToDatabase(call, userId);

        // Upsert call (insert or update if exists)
        await db
          .insert(callLogs)
          .values(mappedCall)
          .onConflictDoUpdate({
            target: callLogs.retellCallId,
            set: {
              callStatus: mappedCall.callStatus,
              callOutcome: mappedCall.callOutcome,
              callSummary: mappedCall.callSummary,
              userSentiment: mappedCall.userSentiment,
              transcript: mappedCall.transcript,
              endTimestamp: mappedCall.endTimestamp,
              recordingUrl: mappedCall.recordingUrl,
            },
          });

        syncedCount++;
      } catch (error) {
        logger.error(`Failed to sync call ${call.call_id}:`, error);
      }
    }

    logTheatrical.success(`Neural sync complete: ${syncedCount} transmissions archived`);
    return syncedCount;
  }

  /**
   * Map Retell API response to database schema
   */
  private mapRetellCallToDatabase(call: RetellCallResponse, userId: string): NewCallLog {
    const analysis = call.call_analysis || {};
    const sentiment = this.determineSentiment(analysis.user_sentiment || analysis.call_sentiment);

    return {
      userId,
      retellCallId: call.call_id,
      agentId: call.agent_id,
      fromNumber: call.from_number || call.to_number || 'Unknown',
      toNumber: call.to_number,
      callStatus: call.call_status || 'PROCESSING',
      callOutcome: analysis.call_outcome,
      callSummary: analysis.call_summary || 'Processing neural transcript...',
      userSentiment: sentiment.toString(),
      durationMs: call.duration_ms || 0,
      costCents: call.cost_metadata?.total_cost || 0,
      recordingUrl: call.recording_url,
      transcript: this.mapTranscript(call.transcript_object),
      metadata: {
        raw_sentiment: analysis.user_sentiment || analysis.call_sentiment,
      },
      startTimestamp: call.start_timestamp ? new Date(call.start_timestamp) : new Date(),
      endTimestamp: call.end_timestamp ? new Date(call.end_timestamp) : null,
    };
  }

  /**
   * Determine sentiment score from Retell analysis
   */
  private determineSentiment(sentimentStr: any): number {
    const s = String(sentimentStr || '').toLowerCase();
    if (s.includes('positive') || s.includes('happy') || s.includes('excited')) return 0.9;
    if (s.includes('negative') || s.includes('angry') || s.includes('frustrated')) return -0.8;
    if (s.includes('neutral')) return 0.0;
    return 0.1; // Default slightly positive
  }

  /**
   * Map Retell transcript to our format
   */
  private mapTranscript(transcriptObj: any): any {
    if (Array.isArray(transcriptObj)) {
      return transcriptObj.map((t: any, i: number) => ({
        speaker: (t.role === 'agent' || t.role === 'ai_agent') ? 'AI' : 'USER',
        text: t.content,
        time: `Turn ${i + 1}`,
      }));
    }
    if (typeof transcriptObj === 'string') {
      return [{ speaker: 'AI', text: transcriptObj, time: 'Full Text' }];
    }
    return [];
  }
}

/**
 * Get calls from database with filters
 */
export interface CallFilters {
  search?: string;
  outcome?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  minDuration?: number;
  maxDuration?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getCallsFromDatabase = async (userId: string, filters: CallFilters = {}) => {
  const {
    search,
    outcome,
    sentiment,
    minDuration,
    maxDuration,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  let query = db.select().from(callLogs).where(eq(callLogs.userId, userId)).$dynamic();

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        like(callLogs.fromNumber, `%${search}%`),
        like(callLogs.callSummary, `%${search}%`)
      )
    );
  }

  // Apply outcome filter
  if (outcome) {
    query = query.where(eq(callLogs.callOutcome, outcome));
  }

  // Apply sentiment filter
  if (sentiment === 'positive') {
    query = query.where(gte(callLogs.userSentiment, '0.5'));
  } else if (sentiment === 'negative') {
    query = query.where(lte(callLogs.userSentiment, '0'));
  } else if (sentiment === 'neutral') {
    query = query.where(and(
      gte(callLogs.userSentiment, '0'),
      lte(callLogs.userSentiment, '0.5')
    ));
  }

  // Apply duration filters
  if (minDuration) {
    query = query.where(gte(callLogs.durationMs, minDuration * 1000));
  }
  if (maxDuration) {
    query = query.where(lte(callLogs.durationMs, maxDuration * 1000));
  }

  // Apply date range filters
  if (startDate) {
    query = query.where(gte(callLogs.startTimestamp, new Date(startDate)));
  }
  if (endDate) {
    query = query.where(lte(callLogs.startTimestamp, new Date(endDate)));
  }

  // Get total count for pagination
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(callLogs)
    .where(eq(callLogs.userId, userId));

  const total = Number(totalResult[0]?.count || 0);

  // Apply pagination
  const offset = (page - 1) * limit;
  const calls = await query
    .orderBy(desc(callLogs.startTimestamp))
    .limit(limit)
    .offset(offset);

  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
