export interface Intent {
    name: string;
    confidence: number;
    appointment_booked: boolean;
    new_customer: boolean;
    extracted_data: any;
}

export class IntentClassifier {
    async classify(_transcript: string | undefined): Promise<Intent> {
        // Placeholder
        return {
            name: 'unknown',
            confidence: 0,
            appointment_booked: false,
            new_customer: false,
            extracted_data: {}
        };
    }
}
