/**
 * Perception Architecture Response Formatter
 * Adds theatrical metadata to API responses to maintain the XLNC aesthetic
 */

interface TheatricalMetadata {
  processing_nodes_activated?: number;
  neural_pathways_established?: number;
  consciousness_level?: 'INITIATE' | 'SOVEREIGN' | 'EMPIRE' | 'TRANSCENDENT';
  latency_ms?: number;
  timestamp?: string;
  quantum_signature?: string;
}

export const createTheatricalResponse = <T>(
  data: T,
  metadata?: Partial<TheatricalMetadata>
) => {
  return {
    success: true,
    data,
    metadata: {
      processing_nodes_activated: Math.floor(Math.random() * 50) + 20,
      neural_pathways_established: Math.floor(Math.random() * 30) + 10,
      consciousness_level: 'SOVEREIGN',
      latency_ms: Math.floor(Math.random() * 30) + 10,
      timestamp: new Date().toISOString(),
      quantum_signature: generateQuantumSignature(),
      ...metadata,
    },
  };
};

export const createErrorResponse = (
  message: string,
  errorCode?: string,
  statusCode = 500
) => {
  const theatricalErrors: Record<string, string> = {
    AUTHENTICATION_FAILED: 'Identity verification failed. Security protocol engaged.',
    INVALID_CREDENTIALS: 'Sovereign credentials rejected. Access denied.',
    TOKEN_EXPIRED: 'Neural link expired. Re-authentication required.',
    RATE_LIMIT_EXCEEDED: 'Bandwidth capacity exceeded. Throttling active.',
    DATABASE_ERROR: 'Neural core disruption detected. System stabilizing.',
    VALIDATION_ERROR: 'Input parameters corrupted. Transmission rejected.',
    UNAUTHORIZED: 'Clearance level insufficient. Access denied.',
    NOT_FOUND: 'Resource not found in neural registry.',
    CONFLICT: 'Consciousness collision detected. Operation aborted.',
  };

  const displayMessage = errorCode && theatricalErrors[errorCode]
    ? theatricalErrors[errorCode]
    : message;

  return {
    success: false,
    error: displayMessage,
    metadata: {
      error_code: errorCode || 'SYSTEM_FAILURE',
      original_message: message,
      timestamp: new Date().toISOString(),
      status_code: statusCode,
    },
  };
};

const generateQuantumSignature = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let signature = 'QS-';
  for (let i = 0; i < 12; i++) {
    signature += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return signature;
};

export const theatricalMessages = {
  USER_REGISTERED: 'Sovereign identity established. Neural matrix initialized.',
  USER_LOGGED_IN: 'Identity verified. Consciousness link activated.',
  USER_LOGGED_OUT: 'Neural session terminated. Consciousness archived.',
  TOKEN_REFRESHED: 'Quantum credentials regenerated. Link sustained.',
  AGENT_DEPLOYED: 'Neural construct activated. Dominion established.',
  AGENT_DELETED: 'Construct decommissioned. Neural pathways severed.',
  CALL_SYNCED: 'Transmission intercepted. Data archived in neural core.',
  ALERT_TRIGGERED: 'Alert protocol activated. Transmission sent.',
  WORKFLOW_TRIGGERED: 'Automation sequence initiated. n8n matrix engaged.',
};
