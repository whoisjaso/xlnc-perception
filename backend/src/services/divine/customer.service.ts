import { db } from '../../config/database';
import { customers, Customer, NewCustomer } from '../../db/schema/customers';
import { conversations, Conversation, NewConversation } from '../../db/schema/conversations';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { prismService, PRISMScores } from './prism.service';

export interface CustomerContext {
  customer: Customer;
  recentConversations: Conversation[];
  prismProfile: {
    scores: PRISMScores;
    dominantNeeds: string[];
    communicationStyle: string;
  };
}

export class CustomerService {
  async getOrCreate(clientId: string, phone: string, data?: Partial<NewCustomer>): Promise<Customer> {
    // Try to find existing customer
    const existing = await db
      .select()
      .from(customers)
      .where(and(eq(customers.clientId, clientId), eq(customers.phone, phone)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        clientId,
        phone,
        ...data,
      })
      .returning();

    logger.info({ customerId: newCustomer.id, phone: phone.slice(-4) }, 'New customer created');

    return newCustomer;
  }

  async getById(id: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0] || null;
  }

  async getByPhone(clientId: string, phone: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(and(eq(customers.clientId, clientId), eq(customers.phone, phone)))
      .limit(1);
    return result[0] || null;
  }

  async update(id: string, data: Partial<NewCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    return updated;
  }

  async updatePRISMScores(id: string, newScores: PRISMScores): Promise<Customer> {
    const customer = await this.getById(id);
    if (!customer) {
      throw new Error(`Customer ${id} not found`);
    }

    // Merge with existing scores
    const existingScores: PRISMScores = {
      certainty: customer.prismCertainty || 50,
      variety: customer.prismVariety || 50,
      significance: customer.prismSignificance || 50,
      connection: customer.prismConnection || 50,
      growth: customer.prismGrowth || 50,
      contribution: customer.prismContribution || 50,
    };

    const merged = prismService.mergeScores(existingScores, newScores);

    return this.update(id, {
      prismCertainty: merged.certainty,
      prismVariety: merged.variety,
      prismSignificance: merged.significance,
      prismConnection: merged.connection,
      prismGrowth: merged.growth,
      prismContribution: merged.contribution,
    });
  }

  async incrementCallCount(id: string): Promise<void> {
    await db
      .update(customers)
      .set({
        totalCalls: sql`${customers.totalCalls} + 1`,
        lastCallAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));
  }

  async getContext(customerId: string): Promise<CustomerContext | null> {
    const customer = await this.getById(customerId);
    if (!customer) return null;

    const recentConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.customerId, customerId))
      .orderBy(desc(conversations.createdAt))
      .limit(5);

    const prismScores: PRISMScores = {
      certainty: customer.prismCertainty || 50,
      variety: customer.prismVariety || 50,
      significance: customer.prismSignificance || 50,
      connection: customer.prismConnection || 50,
      growth: customer.prismGrowth || 50,
      contribution: customer.prismContribution || 50,
    };

    // Get dominant needs
    const sortedNeeds = Object.entries(prismScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([need]) => need);

    return {
      customer,
      recentConversations,
      prismProfile: {
        scores: prismScores,
        dominantNeeds: sortedNeeds,
        communicationStyle: this.getCommunicationStyle(sortedNeeds),
      },
    };
  }

  private getCommunicationStyle(dominantNeeds: string[]): string {
    const styles: Record<string, string> = {
      certainty: 'factual and reassuring',
      variety: 'dynamic and enthusiastic',
      significance: 'respectful and validating',
      connection: 'warm and relational',
      growth: 'educational and encouraging',
      contribution: 'purposeful and impactful',
    };

    if (dominantNeeds.length === 0) return 'balanced and professional';
    if (dominantNeeds.length === 1) return styles[dominantNeeds[0]] || 'professional';
    return `${styles[dominantNeeds[0]]} with ${styles[dominantNeeds[1]]} elements`;
  }

  async getCustomersByClient(clientId: string, limit: number = 100): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.clientId, clientId))
      .orderBy(desc(customers.lastCallAt))
      .limit(limit);
  }
}

export const customerService = new CustomerService();
