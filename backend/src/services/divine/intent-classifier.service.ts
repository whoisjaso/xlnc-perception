// Divine Agentic Intelligence System - Intent Classifier Service
// AI-powered intent classification and entity extraction

import { logger } from '../../utils/logger';
import {
  IntentCategory,
  IntentClassification,
  ConversationAnalysis,
  PsychologicalProfile,
} from '../../types';
import { claudeService } from './claude.service';
import { prismService } from './prism.service';

export interface ClassificationResult {
  intent: IntentClassification;
  confidence: number;
  processingTimeMs: number;
}

export interface FullAnalysisResult {
  analysis: ConversationAnalysis;
  processingTimeMs: number;
}

const INTENT_CLASSIFICATION_PROMPT = `You are an expert intent classifier for a voice AI system handling business calls.

Analyze the following conversation transcript and extract:
1. Primary intent (one of: booking_request, information_inquiry, pricing_question, callback_request, complaint, compliment, transfer_request, cancellation, general_inquiry, sales_opportunity, support_request, other)
2. Confidence score (0.0 to 1.0)
3. Relevant entities (names, dates, times, products, services mentioned)
4. Sub-intent if applicable
5. Whether immediate action is required
6. Urgency level (low, medium, high, critical)

Respond ONLY in valid JSON format:
{
  "intent": "string",
  "confidence": number,
  "entities": { "key": "value" },
  "subIntent": "string or null",
  "actionRequired": boolean,
  "urgency": "low|medium|high|critical"
}

TRANSCRIPT:
`;

const FULL_ANALYSIS_PROMPT = `You are an expert conversation analyst for a voice AI system.

Analyze the following conversation transcript comprehensively. Extract:

1. Intent Classification:
   - Primary intent
   - Confidence score
   - Relevant entities

2. Sentiment Analysis:
   - Overall sentiment (positive, negative, neutral, mixed)
   - Sentiment score (-1.0 to 1.0)

3. Topics Discussed:
   - List main topics covered

4. Customer Questions:
   - Questions the customer asked

5. Agent Commitments:
   - Any promises or commitments made by the AI

6. Next Best Action:
   - Recommended follow-up action

7. Summary:
   - 1-2 sentence summary of the call

Respond ONLY in valid JSON format:
{
  "intent": {
    "intent": "string",
    "confidence": number,
    "entities": {},
    "subIntent": null,
    "actionRequired": boolean,
    "urgency": "string"
  },
  "sentiment": "string",
  "sentimentScore": number,
  "topicsDiscussed": ["string"],
  "keyEntities": {},
  "customerQuestions": ["string"],
  "agentCommitments": ["string"],
  "nextBestAction": "string",
  "summary": "string"
}

TRANSCRIPT:
`;

export class IntentClassifierService {
  async classify(transcript: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    // If Claude is not configured, use rule-based classification
    if (!claudeService.isConfigured()) {
      const result = this.classifyWithRules(transcript);
      return {
        intent: result,
        confidence: result.confidence,
        processingTimeMs: Date.now() - startTime,
      };
    }

    try {
      const response = await claudeService.complete(
        INTENT_CLASSIFICATION_PROMPT,
        [{ role: 'user', content: transcript }],
        { temperature: 0.1, maxTokens: 500 }
      );

      const parsed = JSON.parse(response.content);

      const classification: IntentClassification = {
        intent: this.validateIntent(parsed.intent),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        entities: parsed.entities || {},
        subIntent: parsed.subIntent || undefined,
        actionRequired: parsed.actionRequired ?? false,
        urgency: this.validateUrgency(parsed.urgency),
      };

      logger.debug(
        {
          intent: classification.intent,
          confidence: classification.confidence,
          processingTime: Date.now() - startTime,
        },
        'Intent classified'
      );

      return {
        intent: classification,
        confidence: classification.confidence,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error({ error }, 'AI intent classification failed, using rules');
      const result = this.classifyWithRules(transcript);
      return {
        intent: result,
        confidence: result.confidence,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  async analyzeConversation(transcript: string): Promise<FullAnalysisResult> {
    const startTime = Date.now();

    // Perform PRISM analysis in parallel
    const prismAnalysis = prismService.analyzeTranscript(transcript);

    // If Claude is not configured, use rule-based analysis
    if (!claudeService.isConfigured()) {
      const ruleBasedIntent = this.classifyWithRules(transcript);
      const sentiment = this.analyzeSentimentWithRules(transcript);

      const analysis: ConversationAnalysis = {
        intent: ruleBasedIntent,
        prismProfile: {
          dominantNeed: prismAnalysis.dominantNeed,
          secondaryNeed: prismAnalysis.secondaryNeed,
          prismScores: prismAnalysis.scores,
          confidenceLevel: 0.5,
          analysisTimestamp: new Date().toISOString(),
        },
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        topicsDiscussed: this.extractTopics(transcript),
        keyEntities: ruleBasedIntent.entities,
        customerQuestions: this.extractQuestions(transcript),
        agentCommitments: [],
        nextBestAction: this.determineNextAction(ruleBasedIntent),
        summary: this.generateRuleSummary(transcript, ruleBasedIntent),
      };

      return {
        analysis,
        processingTimeMs: Date.now() - startTime,
      };
    }

    try {
      const response = await claudeService.complete(
        FULL_ANALYSIS_PROMPT,
        [{ role: 'user', content: transcript }],
        { temperature: 0.2, maxTokens: 1500 }
      );

      const parsed = JSON.parse(response.content);

      const analysis: ConversationAnalysis = {
        intent: {
          intent: this.validateIntent(parsed.intent?.intent),
          confidence: parsed.intent?.confidence || 0.5,
          entities: parsed.intent?.entities || {},
          subIntent: parsed.intent?.subIntent,
          actionRequired: parsed.intent?.actionRequired ?? false,
          urgency: this.validateUrgency(parsed.intent?.urgency),
        },
        prismProfile: {
          dominantNeed: prismAnalysis.dominantNeed,
          secondaryNeed: prismAnalysis.secondaryNeed,
          prismScores: prismAnalysis.scores,
          confidenceLevel: 0.7,
          analysisTimestamp: new Date().toISOString(),
        },
        sentiment: this.validateSentiment(parsed.sentiment),
        sentimentScore: Math.min(1, Math.max(-1, parsed.sentimentScore || 0)),
        topicsDiscussed: Array.isArray(parsed.topicsDiscussed)
          ? parsed.topicsDiscussed
          : [],
        keyEntities: parsed.keyEntities || {},
        customerQuestions: Array.isArray(parsed.customerQuestions)
          ? parsed.customerQuestions
          : [],
        agentCommitments: Array.isArray(parsed.agentCommitments)
          ? parsed.agentCommitments
          : [],
        nextBestAction: parsed.nextBestAction || 'No action required',
        summary: parsed.summary || 'Call completed',
      };

      logger.info(
        {
          intent: analysis.intent.intent,
          sentiment: analysis.sentiment,
          processingTime: Date.now() - startTime,
        },
        'Conversation analyzed'
      );

      return {
        analysis,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error({ error }, 'AI conversation analysis failed, using rules');

      const ruleBasedIntent = this.classifyWithRules(transcript);
      const sentiment = this.analyzeSentimentWithRules(transcript);

      return {
        analysis: {
          intent: ruleBasedIntent,
          prismProfile: {
            dominantNeed: prismAnalysis.dominantNeed,
            secondaryNeed: prismAnalysis.secondaryNeed,
            prismScores: prismAnalysis.scores,
            confidenceLevel: 0.5,
            analysisTimestamp: new Date().toISOString(),
          },
          sentiment: sentiment.label,
          sentimentScore: sentiment.score,
          topicsDiscussed: this.extractTopics(transcript),
          keyEntities: ruleBasedIntent.entities,
          customerQuestions: this.extractQuestions(transcript),
          agentCommitments: [],
          nextBestAction: this.determineNextAction(ruleBasedIntent),
          summary: this.generateRuleSummary(transcript, ruleBasedIntent),
        },
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  // ============================================
  // RULE-BASED CLASSIFICATION (Fallback)
  // ============================================

  private classifyWithRules(transcript: string): IntentClassification {
    const lower = transcript.toLowerCase();
    const entities: Record<string, string> = {};

    // Extract common entities
    const emailMatch = transcript.match(
      /[\w.-]+@[\w.-]+\.\w+/i
    );
    if (emailMatch) entities.email = emailMatch[0];

    const phoneMatch = transcript.match(
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
    );
    if (phoneMatch) entities.phone = phoneMatch[0];

    const nameMatch = transcript.match(
      /(?:my name is|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    );
    if (nameMatch) entities.name = nameMatch[1];

    // Intent patterns
    const patterns: Array<{
      intent: IntentCategory;
      keywords: string[];
      urgency: 'low' | 'medium' | 'high' | 'critical';
    }> = [
      {
        intent: 'booking_request',
        keywords: ['appointment', 'schedule', 'book', 'reserve', 'available'],
        urgency: 'medium',
      },
      {
        intent: 'pricing_question',
        keywords: ['price', 'cost', 'how much', 'rate', 'fee', 'quote'],
        urgency: 'low',
      },
      {
        intent: 'complaint',
        keywords: ['upset', 'angry', 'frustrated', 'problem', 'issue', 'wrong', 'terrible'],
        urgency: 'high',
      },
      {
        intent: 'callback_request',
        keywords: ['call me back', 'call back', 'return my call', 'reach me'],
        urgency: 'medium',
      },
      {
        intent: 'transfer_request',
        keywords: ['speak to someone', 'talk to a person', 'human', 'manager', 'supervisor'],
        urgency: 'high',
      },
      {
        intent: 'cancellation',
        keywords: ['cancel', 'cancellation', 'stop', 'end my'],
        urgency: 'high',
      },
      {
        intent: 'information_inquiry',
        keywords: ['information', 'tell me about', 'what is', 'how does', 'explain'],
        urgency: 'low',
      },
      {
        intent: 'sales_opportunity',
        keywords: ['interested', 'want to buy', 'looking for', 'need', 'purchase'],
        urgency: 'medium',
      },
      {
        intent: 'support_request',
        keywords: ['help', 'support', 'assist', 'fix', 'repair'],
        urgency: 'medium',
      },
      {
        intent: 'compliment',
        keywords: ['thank you', 'great service', 'excellent', 'wonderful', 'appreciate'],
        urgency: 'low',
      },
    ];

    for (const pattern of patterns) {
      const matches = pattern.keywords.filter((k) => lower.includes(k));
      if (matches.length > 0) {
        return {
          intent: pattern.intent,
          confidence: Math.min(0.9, 0.5 + matches.length * 0.15),
          entities,
          actionRequired: ['complaint', 'transfer_request', 'cancellation'].includes(
            pattern.intent
          ),
          urgency: pattern.urgency,
        };
      }
    }

    return {
      intent: 'general_inquiry',
      confidence: 0.4,
      entities,
      actionRequired: false,
      urgency: 'low',
    };
  }

  private analyzeSentimentWithRules(
    transcript: string
  ): { label: 'positive' | 'negative' | 'neutral' | 'mixed'; score: number } {
    const lower = transcript.toLowerCase();

    const positiveWords = [
      'thank', 'great', 'excellent', 'wonderful', 'perfect', 'happy',
      'love', 'appreciate', 'amazing', 'fantastic', 'helpful',
    ];
    const negativeWords = [
      'angry', 'upset', 'frustrated', 'terrible', 'horrible', 'hate',
      'awful', 'disappointed', 'annoyed', 'worst', 'bad',
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lower.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { label: 'neutral', score: 0 };
    }

    const score = (positiveCount - negativeCount) / total;

    if (positiveCount > 0 && negativeCount > 0) {
      return { label: 'mixed', score };
    }

    if (score > 0.3) return { label: 'positive', score };
    if (score < -0.3) return { label: 'negative', score };
    return { label: 'neutral', score };
  }

  private extractTopics(transcript: string): string[] {
    const topics: string[] = [];
    const lower = transcript.toLowerCase();

    const topicPatterns: Record<string, string[]> = {
      'Appointments': ['appointment', 'schedule', 'booking', 'calendar'],
      'Pricing': ['price', 'cost', 'fee', 'rate', 'quote'],
      'Products': ['product', 'item', 'inventory', 'vehicle', 'car'],
      'Services': ['service', 'repair', 'maintenance', 'support'],
      'Account': ['account', 'profile', 'information', 'details'],
      'Complaints': ['complaint', 'issue', 'problem', 'concern'],
    };

    for (const [topic, keywords] of Object.entries(topicPatterns)) {
      if (keywords.some((k) => lower.includes(k))) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ['General'];
  }

  private extractQuestions(transcript: string): string[] {
    const questions: string[] = [];
    const sentences = transcript.split(/[.!?\n]+/);

    for (const sentence of sentences) {
      if (
        sentence.includes('?') ||
        /^(what|when|where|who|why|how|can|could|would|is|are|do|does)/i.test(
          sentence.trim()
        )
      ) {
        const cleaned = sentence.trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          questions.push(cleaned);
        }
      }
    }

    return questions.slice(0, 5);
  }

  private determineNextAction(intent: IntentClassification): string {
    const actionMap: Record<IntentCategory, string> = {
      booking_request: 'Follow up on appointment if not booked',
      information_inquiry: 'Send relevant information via email',
      pricing_question: 'Send detailed pricing information',
      callback_request: 'Schedule callback within 1 hour',
      complaint: 'Escalate to manager for resolution',
      compliment: 'Share positive feedback with team',
      transfer_request: 'Ensure successful transfer occurred',
      cancellation: 'Process cancellation and send confirmation',
      general_inquiry: 'No specific follow-up required',
      sales_opportunity: 'Add to sales pipeline for follow-up',
      support_request: 'Create support ticket if issue unresolved',
      other: 'Review call for proper handling',
    };

    return actionMap[intent.intent] || 'Review call recording';
  }

  private generateRuleSummary(
    transcript: string,
    intent: IntentClassification
  ): string {
    const intentDescriptions: Record<IntentCategory, string> = {
      booking_request: 'Customer inquired about scheduling an appointment',
      information_inquiry: 'Customer requested information',
      pricing_question: 'Customer asked about pricing',
      callback_request: 'Customer requested a callback',
      complaint: 'Customer expressed a complaint',
      compliment: 'Customer provided positive feedback',
      transfer_request: 'Customer requested to speak with someone',
      cancellation: 'Customer inquired about cancellation',
      general_inquiry: 'General customer inquiry',
      sales_opportunity: 'Customer showed interest in services',
      support_request: 'Customer needed support assistance',
      other: 'Customer call for general purposes',
    };

    return intentDescriptions[intent.intent] || 'Customer call completed';
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  private validateIntent(intent: string): IntentCategory {
    const validIntents: IntentCategory[] = [
      'booking_request',
      'information_inquiry',
      'pricing_question',
      'callback_request',
      'complaint',
      'compliment',
      'transfer_request',
      'cancellation',
      'general_inquiry',
      'sales_opportunity',
      'support_request',
      'other',
    ];

    return validIntents.includes(intent as IntentCategory)
      ? (intent as IntentCategory)
      : 'other';
  }

  private validateUrgency(
    urgency: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const valid = ['low', 'medium', 'high', 'critical'];
    return valid.includes(urgency)
      ? (urgency as 'low' | 'medium' | 'high' | 'critical')
      : 'medium';
  }

  private validateSentiment(
    sentiment: string
  ): 'positive' | 'negative' | 'neutral' | 'mixed' {
    const valid = ['positive', 'negative', 'neutral', 'mixed'];
    return valid.includes(sentiment)
      ? (sentiment as 'positive' | 'negative' | 'neutral' | 'mixed')
      : 'neutral';
  }
}

export const intentClassifierService = new IntentClassifierService();
