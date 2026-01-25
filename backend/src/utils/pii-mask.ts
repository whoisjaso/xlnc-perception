/**
 * PII Masking Utilities
 * Masks personally identifiable information in logs for compliance.
 * Per CONTEXT.md: Show last 4 digits of phone, redact names in logs.
 */

/**
 * Mask a phone number, showing only last 4 digits.
 * Example: +15551234567 -> ***4567
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '[no phone]';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '***' + digits.slice(-4);
}

/**
 * Mask an email address.
 * Example: john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '[no email]';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.length > 1 ? local[0] + '***' : '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Redact a name completely.
 * Example: John Doe -> [name redacted]
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return '[no name]';
  return '[name redacted]';
}

/**
 * Known PII field patterns to mask automatically
 */
const PII_PATTERNS: Record<string, (value: unknown) => string> = {
  phone: (v) => maskPhone(String(v)),
  from_number: (v) => maskPhone(String(v)),
  to_number: (v) => maskPhone(String(v)),
  fromnumber: (v) => maskPhone(String(v)),
  tonumber: (v) => maskPhone(String(v)),
  customerphone: (v) => maskPhone(String(v)),
  email: (v) => maskEmail(String(v)),
  customeremail: (v) => maskEmail(String(v)),
  name: (v) => maskName(String(v)),
  customername: (v) => maskName(String(v)),
  customer_name: (v) => maskName(String(v)),
};

/**
 * Recursively mask PII in an object.
 * Creates a deep copy with all PII fields masked.
 */
export function maskPII<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if this is a known PII field
    const lowerKey = key.toLowerCase();
    const maskFn = PII_PATTERNS[lowerKey];

    if (maskFn && value != null) {
      result[key] = maskFn(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? maskPII(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskPII(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Create a safe log object with PII masked.
 * Use this when logging webhook payloads or customer data.
 *
 * @example
 * logger.info(createSafeLogObject({ phone: '+15551234567', name: 'John' }), 'Customer data');
 * // Logs: { phone: '***4567', name: '[name redacted]' }
 */
export function createSafeLogObject<T extends Record<string, unknown>>(
  obj: T,
  additionalFields?: Record<string, unknown>
): Record<string, unknown> {
  const masked = maskPII(obj);
  return additionalFields ? { ...masked, ...additionalFields } : masked;
}

/**
 * Type-safe wrapper for logging with PII masking.
 * Ensures phone and name fields are always masked.
 */
export interface SafeLogFields {
  phone?: string;
  from_number?: string;
  to_number?: string;
  name?: string;
  customerName?: string;
  email?: string;
  [key: string]: unknown;
}

export function safeLog(fields: SafeLogFields): Record<string, unknown> {
  return maskPII(fields as Record<string, unknown>);
}
