// Divine Agentic Intelligence System - Client Configuration Service
// Multi-tenant client configuration management

import { logger } from '../../utils/logger';
import { ClientConfig, ClientConfigSchema, BusinessHours } from '../../types';
import { db } from '../../config/database';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// In-memory cache for client configs
const configCache = new Map<string, { config: ClientConfig; loadedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Default business hours
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { start: '09:00', end: '17:00' },
  tuesday: { start: '09:00', end: '17:00' },
  wednesday: { start: '09:00', end: '17:00' },
  thursday: { start: '09:00', end: '17:00' },
  friday: { start: '09:00', end: '17:00' },
  saturday: { start: '10:00', end: '14:00' },
  sunday: { start: '00:00', end: '00:00', closed: true },
};

// Default client configuration
const DEFAULT_CONFIG: Partial<ClientConfig> = {
  timezone: 'America/New_York',
  business_hours: DEFAULT_BUSINESS_HOURS,
  sms_provider: 'txt180',
  email_provider: 'sendgrid',
  sms_enabled: true,
  email_enabled: true,
  ai_followup_enabled: true,
  prism_analysis_enabled: true,
  appointment_booking_enabled: true,
  inventory_check_enabled: false,
  human_transfer_enabled: true,
};

export class ClientConfigService {
  private readonly configDir: string;

  constructor() {
    // Config directory path - can be overridden via env
    this.configDir = process.env.CLIENT_CONFIG_DIR || path.join(__dirname, '../../../config/clients');
  }

  async getConfig(clientId: string): Promise<ClientConfig | null> {
    // Check cache first
    const cached = configCache.get(clientId);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return cached.config;
    }

    try {
      // Try to load from database first (for dynamic configs)
      const dbConfig = await this.loadFromDatabase(clientId);
      if (dbConfig) {
        this.cacheConfig(clientId, dbConfig);
        return dbConfig;
      }

      // Fall back to file-based config
      const fileConfig = await this.loadFromFile(clientId);
      if (fileConfig) {
        this.cacheConfig(clientId, fileConfig);
        return fileConfig;
      }

      logger.warn({ clientId }, 'Client configuration not found');
      return null;
    } catch (error) {
      logger.error({ error, clientId }, 'Error loading client configuration');
      return null;
    }
  }

  async getConfigOrDefault(clientId: string): Promise<ClientConfig> {
    const config = await this.getConfig(clientId);
    if (config) return config;

    // Return a minimal default config
    return {
      client_id: clientId,
      business_name: 'Business',
      owner_name: 'Owner',
      industry: 'General',
      phone: '',
      email: '',
      address: '',
      ...DEFAULT_CONFIG,
    } as ClientConfig;
  }

  async saveConfig(config: ClientConfig): Promise<void> {
    // Validate config
    const result = ClientConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    // Save to file
    const filePath = path.join(this.configDir, `${config.client_id}.json`);

    // Ensure directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));

    // Update cache
    this.cacheConfig(config.client_id, config);

    logger.info({ clientId: config.client_id }, 'Client configuration saved');
  }

  async updateConfig(clientId: string, updates: Partial<ClientConfig>): Promise<ClientConfig | null> {
    const existing = await this.getConfig(clientId);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, ...updates };
    await this.saveConfig(updated);

    return updated;
  }

  async listClients(): Promise<string[]> {
    const clients: string[] = [];

    // From files
    if (fs.existsSync(this.configDir)) {
      const files = fs.readdirSync(this.configDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          clients.push(file.replace('.json', ''));
        }
      }
    }

    return [...new Set(clients)];
  }

  async getAllConfigs(): Promise<ClientConfig[]> {
    const clientIds = await this.listClients();
    const configs: ClientConfig[] = [];

    for (const clientId of clientIds) {
      const config = await this.getConfig(clientId);
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  }

  clearCache(clientId?: string): void {
    if (clientId) {
      configCache.delete(clientId);
    } else {
      configCache.clear();
    }
  }

  // ============================================
  // CONFIGURATION HELPERS
  // ============================================

  isFeatureEnabled(config: ClientConfig, feature: string): boolean {
    const featureMap: Record<string, keyof ClientConfig> = {
      sms: 'sms_enabled',
      email: 'email_enabled',
      ai_followup: 'ai_followup_enabled',
      prism: 'prism_analysis_enabled',
      booking: 'appointment_booking_enabled',
      inventory: 'inventory_check_enabled',
      transfer: 'human_transfer_enabled',
      zoho_crm: 'zoho_crm_enabled',
    };

    const key = featureMap[feature];
    return key ? Boolean(config[key]) : false;
  }

  getBusinessHoursForDay(
    config: ClientConfig,
    day: string
  ): { start: string; end: string; closed: boolean } | null {
    const dayKey = day.toLowerCase() as keyof BusinessHours;
    const hours = config.business_hours[dayKey];

    if (!hours) return null;

    return {
      start: hours.start,
      end: hours.end,
      closed: hours.closed || false,
    };
  }

  isBusinessOpen(config: ClientConfig, date: Date = new Date()): boolean {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = days[date.getDay()] as keyof BusinessHours;
    const hours = config.business_hours[dayKey];

    if (!hours || hours.closed) return false;

    const [startHour, startMin] = hours.start.split(':').map(Number);
    const [endHour, endMin] = hours.end.split(':').map(Number);

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async loadFromDatabase(clientId: string): Promise<ClientConfig | null> {
    // Future: Load from a client_configs table
    // For now, return null to fall back to file-based config
    return null;
  }

  private async loadFromFile(clientId: string): Promise<ClientConfig | null> {
    const filePath = path.join(this.configDir, `${clientId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      // Merge with defaults
      const config = {
        ...DEFAULT_CONFIG,
        ...parsed,
        client_id: clientId,
        business_hours: {
          ...DEFAULT_BUSINESS_HOURS,
          ...parsed.business_hours,
        },
      };

      // Validate
      const result = ClientConfigSchema.safeParse(config);
      if (!result.success) {
        logger.error(
          { clientId, error: result.error },
          'Invalid client configuration file'
        );
        return null;
      }

      return result.data;
    } catch (error) {
      logger.error({ error, clientId, filePath }, 'Error reading client config file');
      return null;
    }
  }

  private cacheConfig(clientId: string, config: ClientConfig): void {
    configCache.set(clientId, {
      config,
      loadedAt: Date.now(),
    });
  }
}

export const clientConfigService = new ClientConfigService();

// ============================================
// SAMPLE CLIENT CONFIG TEMPLATE
// ============================================

export const SAMPLE_CLIENT_CONFIG: ClientConfig = {
  client_id: 'sample-client',
  business_name: 'Sample Business',
  owner_name: 'John Smith',
  industry: 'Automotive',
  phone: '+18325551234',
  email: 'contact@samplebusiness.com',
  address: '123 Main St, Houston, TX 77001',
  timezone: 'America/Chicago',

  business_hours: {
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '18:00' },
    friday: { start: '09:00', end: '18:00' },
    saturday: { start: '10:00', end: '15:00' },
    sunday: { start: '00:00', end: '00:00', closed: true },
  },

  retell_agent_id: 'agent_xxx',
  zoho_calendar_id: 'calendar_xxx',
  zoho_crm_enabled: true,

  sms_provider: 'txt180',
  email_provider: 'sendgrid',
  sms_enabled: true,
  email_enabled: true,

  ai_followup_enabled: true,
  prism_analysis_enabled: true,

  appointment_booking_enabled: true,
  inventory_check_enabled: false,
  human_transfer_enabled: true,

  greeting_override: undefined,
  special_instructions: 'Always mention our current promotion: 10% off first service.',
};
