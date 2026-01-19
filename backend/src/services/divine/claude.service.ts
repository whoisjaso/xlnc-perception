import { logger } from '../../utils/logger';
import env from '../../config/env';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class ClaudeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly model = 'claude-3-haiku-20240307';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.ANTHROPIC_API_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async complete(
    systemPrompt: string,
    messages: ClaudeMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<ClaudeResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const { maxTokens = 1024, temperature = 0.7 } = options;

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Claude API error');
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content.find((c) => c.type === 'text');

    return {
      content: textContent?.text || '',
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }

  async classifyIntent(transcript: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, string>;
  }> {
    const systemPrompt = `You are an intent classifier for voice AI calls. Analyze the transcript and return JSON with:
- intent: one of [booking_request, information_inquiry, complaint, follow_up, pricing_question, cancellation, reschedule, general_greeting, callback_request, transfer_request, confirmation, objection, positive_feedback, other]
- confidence: 0-1 score
- entities: extracted key entities (dates, times, names, services, etc.)

Return ONLY valid JSON, no explanation.`;

    const response = await this.complete(systemPrompt, [{ role: 'user', content: transcript }], {
      maxTokens: 500,
      temperature: 0.3,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { intent: 'other', confidence: 0.5, entities: {} };
    }
  }

  async generateFollowUp(
    context: {
      customerName?: string;
      intent: string;
      summary: string;
      businessName: string;
    },
    channel: 'sms' | 'email'
  ): Promise<{ subject?: string; body: string }> {
    const systemPrompt = `You are a follow-up message writer for ${context.businessName}.
Write a professional, warm ${channel === 'sms' ? 'SMS (max 160 chars)' : 'email'} follow-up based on the call.
${channel === 'email' ? 'Return JSON with "subject" and "body".' : 'Return JSON with just "body".'}
Be concise, actionable, and maintain brand voice.`;

    const userMessage = `Customer: ${context.customerName || 'Valued Customer'}
Intent: ${context.intent}
Call Summary: ${context.summary}`;

    const response = await this.complete(systemPrompt, [{ role: 'user', content: userMessage }], {
      maxTokens: channel === 'sms' ? 100 : 500,
      temperature: 0.7,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { body: response.content };
    }
  }
}

export const claudeService = new ClaudeService();
