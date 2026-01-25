import { customerService } from '../divine/customer.service';
import { conversationService } from '../divine/conversation.service';
import { logger } from '../../utils/logger';

export interface CustomerHistoryEntry {
  callId: string;
  summary: string | null;
  intent: string | null;
  sentiment: string | null;
  createdAt: Date | null;
}

export class CustomerMemory {
  /**
   * Get customer call history by phone number.
   * NOTE: This requires clientId for proper lookup. Without it,
   * we cannot reliably find the customer. Consider using
   * contextBuilderService.buildContext() instead.
   */
  async getHistory(phoneNumber: string, clientId?: string): Promise<CustomerHistoryEntry[]> {
    if (!clientId) {
      logger.warn(
        { phone: phoneNumber.slice(-4) },
        'CustomerMemory.getHistory called without clientId - cannot lookup customer'
      );
      return [];
    }

    try {
      const customer = await customerService.getByPhone(clientId, phoneNumber);

      if (!customer) {
        logger.debug({ phone: phoneNumber.slice(-4) }, 'No customer found for phone');
        return [];
      }

      const conversations = await conversationService.getRecentByCustomer(customer.id, 10);

      return conversations.map(conv => ({
        callId: conv.callId,
        summary: conv.summary,
        intent: conv.intent,
        sentiment: conv.sentiment,
        createdAt: conv.createdAt,
      }));
    } catch (error) {
      logger.error({ error, phone: phoneNumber.slice(-4) }, 'Failed to get customer history');
      return [];
    }
  }

  /**
   * Get full customer context. Delegates to customerService.
   */
  async getContext(customerId: string) {
    return customerService.getContext(customerId);
  }
}
