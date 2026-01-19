// Divine Agentic Intelligence System - Context Builder Service
// Builds pre-call context for Retell dynamic variables

import { logger } from '../../utils/logger';
import {
  ClientConfig,
  CustomerContext,
  PRISMNeed,
  DynamicVariables,
} from '../../types';
import { customerService } from './customer.service';
import { conversationService } from './conversation.service';
import { prismService } from './prism.service';
import { format, formatDistanceToNow } from 'date-fns';

export interface ContextBuildResult {
  variables: Record<string, string>;
  customerContext: CustomerContext;
}

export class ContextBuilderService {
  async buildContext(
    phone: string,
    config: ClientConfig
  ): Promise<Record<string, string>> {
    const startTime = Date.now();

    try {
      const customer = await customerService.getByPhone(phone);

      if (customer) {
        const context = await this.buildReturningCustomerContext(customer, config);
        logger.debug(
          { phone, customerId: customer.id, buildTime: Date.now() - startTime },
          'Built returning customer context'
        );
        return context;
      }

      const context = this.buildNewCustomerContext(phone, config);
      logger.debug(
        { phone, buildTime: Date.now() - startTime },
        'Built new customer context'
      );
      return context;
    } catch (error) {
      logger.error({ error, phone }, 'Failed to build context, using fallback');
      return this.buildFallbackContext(phone, config);
    }
  }

  async buildFullCustomerContext(
    phone: string,
    config: ClientConfig
  ): Promise<ContextBuildResult> {
    const customer = await customerService.getByPhone(phone);

    if (!customer) {
      const variables = this.buildNewCustomerContext(phone, config);
      return {
        variables,
        customerContext: {
          isReturningCustomer: false,
          customerPhone: phone,
          areaCode: this.extractAreaCode(phone),
          preferredLanguage: 'en',
          totalCalls: 0,
          tags: [],
        },
      };
    }

    const conversations = await conversationService.getCustomerConversations(
      customer.id,
      5
    );

    const customerContext: CustomerContext = {
      isReturningCustomer: true,
      customerId: customer.id,
      customerName: customer.name || undefined,
      customerEmail: customer.email || undefined,
      customerPhone: phone,
      totalCalls: customer.totalCalls || 0,
      lastContactAt: customer.lastCallAt?.toISOString(),
      lastCallSummary: conversations[0]?.summary || undefined,
      dominantNeed: this.inferDominantNeed(customer) as PRISMNeed | undefined,
      prismScores: customer.prismCertainty
        ? {
            significance: customer.prismSignificance || 50,
            acceptance: customer.prismConnection || 50,
            approval: 50,
            intelligence: 50,
            pity: 50,
            power: 50,
          }
        : undefined,
      preferredLanguage: 'en',
      crmId: customer.crmId || undefined,
      crmProvider: customer.crmProvider as CustomerContext['crmProvider'],
      tags: (customer.tags as string[]) || [],
      notes: this.summarizeConversations(conversations),
      areaCode: this.extractAreaCode(phone),
    };

    const variables = this.contextToVariables(customerContext, config);

    return { variables, customerContext };
  }

  private async buildReturningCustomerContext(
    customer: {
      id: string;
      name: string | null;
      email: string | null;
      totalCalls: number | null;
      lastCallAt: Date | null;
      prismCertainty: number | null;
      prismVariety: number | null;
      prismSignificance: number | null;
      prismConnection: number | null;
      prismGrowth: number | null;
      prismContribution: number | null;
    },
    config: ClientConfig
  ): Promise<Record<string, string>> {
    const conversations = await conversationService.getCustomerConversations(
      customer.id,
      3
    );

    const dominantNeed = this.inferDominantNeed(customer);
    const lastContactFormatted = customer.lastCallAt
      ? formatDistanceToNow(customer.lastCallAt, { addSuffix: true })
      : 'some time ago';

    const conversationNotes = this.summarizeConversations(conversations);

    return {
      is_returning_customer: 'true',
      customer_name: customer.name || 'there',
      call_count: String(customer.totalCalls || 1),
      last_contact: lastContactFormatted,
      dominant_need: dominantNeed || 'acceptance',
      psychological_profile: this.formatPsychologicalProfile(customer),
      conversation_notes: conversationNotes,
      language: 'en',
      area_code: '',
      business_hours: this.formatBusinessHours(config),
      special_instructions: config.special_instructions || '',
    };
  }

  private buildNewCustomerContext(
    phone: string,
    config: ClientConfig
  ): Record<string, string> {
    const areaCode = this.extractAreaCode(phone);

    return {
      is_returning_customer: 'false',
      customer_name: 'there',
      call_count: '0',
      last_contact: '',
      dominant_need: '',
      psychological_profile: '',
      conversation_notes: '',
      language: 'en',
      area_code: areaCode,
      business_hours: this.formatBusinessHours(config),
      special_instructions: config.special_instructions || '',
    };
  }

  private buildFallbackContext(
    phone: string,
    config: ClientConfig
  ): Record<string, string> {
    return {
      is_returning_customer: 'unknown',
      customer_name: 'there',
      call_count: '0',
      last_contact: '',
      dominant_need: '',
      psychological_profile: '',
      conversation_notes: '',
      language: 'en',
      area_code: this.extractAreaCode(phone),
      business_hours: this.formatBusinessHours(config),
      special_instructions: config.special_instructions || '',
    };
  }

  private contextToVariables(
    context: CustomerContext,
    config: ClientConfig
  ): Record<string, string> {
    return {
      is_returning_customer: String(context.isReturningCustomer),
      customer_name: context.customerName || 'there',
      call_count: String(context.totalCalls),
      last_contact: context.lastContactAt
        ? formatDistanceToNow(new Date(context.lastContactAt), { addSuffix: true })
        : '',
      dominant_need: context.dominantNeed || '',
      psychological_profile: context.prismScores
        ? this.formatPRISMScores(context.prismScores)
        : '',
      conversation_notes: context.notes || '',
      language: context.preferredLanguage,
      area_code: context.areaCode || '',
      business_hours: this.formatBusinessHours(config),
      special_instructions: config.special_instructions || '',
    };
  }

  private inferDominantNeed(customer: {
    prismCertainty: number | null;
    prismVariety: number | null;
    prismSignificance: number | null;
    prismConnection: number | null;
    prismGrowth: number | null;
    prismContribution: number | null;
  }): PRISMNeed | null {
    const scores: Record<string, number> = {
      significance: customer.prismSignificance || 0,
      acceptance: customer.prismConnection || 0,
      approval: customer.prismCertainty || 0,
      intelligence: customer.prismGrowth || 0,
      pity: customer.prismContribution || 0,
      power: customer.prismVariety || 0,
    };

    let maxScore = 0;
    let dominantNeed: PRISMNeed | null = null;

    for (const [need, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantNeed = need as PRISMNeed;
      }
    }

    // Only return if we have meaningful scores
    return maxScore > 30 ? dominantNeed : null;
  }

  private formatPsychologicalProfile(customer: {
    prismCertainty: number | null;
    prismVariety: number | null;
    prismSignificance: number | null;
    prismConnection: number | null;
    prismGrowth: number | null;
    prismContribution: number | null;
  }): string {
    const dominant = this.inferDominantNeed(customer);
    if (!dominant) return '';

    const needDescriptions: Record<string, string> = {
      significance: 'Values being recognized and feeling important',
      acceptance: 'Values belonging and connection with others',
      approval: 'Seeks validation and reassurance',
      intelligence: 'Values being seen as knowledgeable',
      pity: 'Has experienced hardship, values empathy',
      power: 'Values control and autonomy in decisions',
    };

    return needDescriptions[dominant] || '';
  }

  private formatPRISMScores(scores: {
    significance: number;
    acceptance: number;
    approval: number;
    intelligence: number;
    pity: number;
    power: number;
  }): string {
    const entries = Object.entries(scores)
      .filter(([_, value]) => value > 40)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    if (entries.length === 0) return '';

    return entries.map(([need]) => need).join(', ');
  }

  private summarizeConversations(
    conversations: Array<{
      intent: string | null;
      summary: string | null;
      createdAt: Date | null;
    }>
  ): string {
    if (conversations.length === 0) return '';

    const summaries = conversations
      .filter((c) => c.summary || c.intent)
      .slice(0, 3)
      .map((c) => {
        const date = c.createdAt ? format(c.createdAt, 'MMM d') : '';
        const content = c.summary || c.intent || '';
        return date ? `${date}: ${content}` : content;
      });

    return summaries.join('. ');
  }

  private formatBusinessHours(config: ClientConfig): string {
    const today = format(new Date(), 'EEEE').toLowerCase() as keyof typeof config.business_hours;
    const hours = config.business_hours[today];

    if (!hours || hours.closed) {
      return 'Currently closed';
    }

    return `${hours.start} - ${hours.end}`;
  }

  private extractAreaCode(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    // US phone number with country code
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return cleaned.slice(1, 4);
    }

    // US phone number without country code
    if (cleaned.length === 10) {
      return cleaned.slice(0, 3);
    }

    return '';
  }

  getResponseCalibration(
    dominantNeed: PRISMNeed
  ): {
    opener: string;
    valueFrame: string;
    closeFrame: string;
    avoidPhrases: string[];
    usePhrases: string[];
  } {
    return prismService.getResponseCalibration(dominantNeed);
  }
}

export const contextBuilderService = new ContextBuilderService();
