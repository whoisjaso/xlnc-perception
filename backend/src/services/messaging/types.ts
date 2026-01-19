export interface SMSMessage {
    to: string;
    body: string;
    clientId?: string;
    metadata?: Record<string, any>;
}

export interface SMSResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    providerResponse?: any;
}

export interface IMessagingProvider {
    sendSMS(message: SMSMessage): Promise<SMSResponse>;
    name: string;
}
