import { logger } from '../../utils/logger';
import env from '../../config/env';
import { oauthTokenService } from './oauth-token.service';

export interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  company?: string;
  leadSource?: string;
  description?: string;
  customFields?: Record<string, unknown>;
}

export interface ZohoLead {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string;
  company: string | null;
  leadSource: string | null;
  leadStatus: string | null;
  createdTime: Date;
  modifiedTime: Date;
}

export interface ZohoCRMCredentials {
  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
}

export class ZohoCRMService {
  private readonly baseUrl = 'https://www.zohoapis.com/crm/v3';
  private readonly module = 'Leads';

  private readonly serviceClientId: string; // For multi-tenant token lookup
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;

  constructor(credentials?: ZohoCRMCredentials, clientId: string = 'default') {
    this.serviceClientId = clientId;
    // Use provided credentials, fall back to env vars
    this.clientId = credentials?.clientId || env.ZOHO_CLIENT_ID || env.ZOHO_CRM_CLIENT_ID || '';
    this.clientSecret = credentials?.clientSecret || env.ZOHO_CLIENT_SECRET || env.ZOHO_CRM_CLIENT_SECRET || '';
    this.refreshToken = credentials?.refreshToken || env.ZOHO_REFRESH_TOKEN || env.ZOHO_CRM_REFRESH_TOKEN || '';
  }

  /**
   * Create a service instance for a specific client config
   */
  static forClient(clientConfig: {
    zoho_client_id?: string | null;
    zoho_client_secret?: string | null;
    zoho_refresh_token?: string | null;
  }, clientId: string = 'default'): ZohoCRMService {
    return new ZohoCRMService({
      clientId: clientConfig.zoho_client_id,
      clientSecret: clientConfig.zoho_client_secret,
      refreshToken: clientConfig.zoho_refresh_token,
    }, clientId);
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken);
  }

  async getAccessToken(): Promise<string> {
    // Use OAuthTokenService for database-backed tokens
    return oauthTokenService.getAccessToken(
      this.serviceClientId,
      'zoho_crm',
      { clientId: this.clientId, clientSecret: this.clientSecret }
    );
  }

  async findByPhone(phone: string): Promise<ZohoLead | null> {
    if (!this.isConfigured()) return null;

    const token = await this.getAccessToken();
    const normalizedPhone = phone.replace(/\D/g, '');

    const response = await fetch(
      `${this.baseUrl}/${this.module}/search?phone=${encodeURIComponent(normalizedPhone)}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );

    if (response.status === 204) return null;

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText, phone }, 'Failed to search lead by phone');
      throw new Error(`Failed to search lead: ${response.status}`);
    }

    const data = (await response.json()) as { data?: Record<string, unknown>[] };
    const record = data.data?.[0];

    if (!record) return null;

    return this.mapToLead(record);
  }

  async createLead(leadData: LeadData): Promise<ZohoLead> {
    const token = await this.getAccessToken();

    const record: Record<string, unknown> = { Phone: leadData.phone };

    if (leadData.firstName) record.First_Name = leadData.firstName;
    if (leadData.lastName) record.Last_Name = leadData.lastName;
    if (leadData.email) record.Email = leadData.email;
    if (leadData.company) record.Company = leadData.company;
    if (leadData.leadSource) record.Lead_Source = leadData.leadSource;
    if (leadData.description) record.Description = leadData.description;

    if (leadData.customFields) {
      for (const [key, value] of Object.entries(leadData.customFields)) {
        record[key] = value;
      }
    }

    const response = await fetch(`${this.baseUrl}/${this.module}`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [record],
        trigger: ['workflow', 'blueprint'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText, leadData }, 'Failed to create lead');
      throw new Error(`Failed to create lead: ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: { status: string; message?: string; details?: { id: string } }[];
    };
    const result = data.data?.[0];

    if (!result || result.status !== 'success') {
      throw new Error(`Failed to create lead: ${result?.message || 'Unknown error'}`);
    }

    logger.info({ leadId: result.details?.id, phone: leadData.phone }, 'Lead created in Zoho CRM');

    return this.getById(result.details!.id);
  }

  async updateLead(id: string, leadData: Partial<LeadData>): Promise<ZohoLead> {
    const token = await this.getAccessToken();

    const record: Record<string, unknown> = { id };

    if (leadData.firstName) record.First_Name = leadData.firstName;
    if (leadData.lastName) record.Last_Name = leadData.lastName;
    if (leadData.email) record.Email = leadData.email;
    if (leadData.phone) record.Phone = leadData.phone;
    if (leadData.company) record.Company = leadData.company;
    if (leadData.leadSource) record.Lead_Source = leadData.leadSource;
    if (leadData.description) record.Description = leadData.description;

    if (leadData.customFields) {
      for (const [key, value] of Object.entries(leadData.customFields)) {
        record[key] = value;
      }
    }

    const response = await fetch(`${this.baseUrl}/${this.module}`, {
      method: 'PUT',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [record],
        trigger: ['workflow', 'blueprint'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText, id }, 'Failed to update lead');
      throw new Error(`Failed to update lead: ${response.status}`);
    }

    logger.info({ leadId: id }, 'Lead updated in Zoho CRM');

    return this.getById(id);
  }

  async getById(id: string): Promise<ZohoLead> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/${this.module}/${id}`, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText, id }, 'Failed to get lead');
      throw new Error(`Failed to get lead: ${response.status}`);
    }

    const data = (await response.json()) as { data?: Record<string, unknown>[] };
    const record = data.data?.[0];

    if (!record) {
      throw new Error(`Lead ${id} not found`);
    }

    return this.mapToLead(record);
  }

  async addNote(leadId: string, noteContent: string, noteTitle?: string): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/Notes`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            Note_Title: noteTitle || 'Call Note',
            Note_Content: noteContent,
            Parent_Id: leadId,
            se_module: this.module,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText, leadId }, 'Failed to add note to lead');
      throw new Error(`Failed to add note: ${response.status}`);
    }

    logger.info({ leadId }, 'Note added to lead in Zoho CRM');
  }

  async getOrCreateByPhone(phone: string, defaultData?: Partial<LeadData>): Promise<ZohoLead> {
    const existing = await this.findByPhone(phone);
    if (existing) return existing;

    return this.createLead({ phone, ...defaultData });
  }

  private mapToLead(record: Record<string, unknown>): ZohoLead {
    return {
      id: record.id as string,
      firstName: (record.First_Name as string) || null,
      lastName: (record.Last_Name as string) || null,
      email: (record.Email as string) || null,
      phone: record.Phone as string,
      company: (record.Company as string) || null,
      leadSource: (record.Lead_Source as string) || null,
      leadStatus: (record.Lead_Status as string) || null,
      createdTime: new Date(record.Created_Time as string),
      modifiedTime: new Date(record.Modified_Time as string),
    };
  }
}

export const zohoCRMService = new ZohoCRMService();
