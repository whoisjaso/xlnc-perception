import { logger } from '../../utils/logger';

export interface PRISMScores {
  certainty: number; // Need for security, stability, predictability
  variety: number; // Need for change, stimulation, challenge
  significance: number; // Need to feel important, special, unique
  connection: number; // Need for love, bonding, belonging
  growth: number; // Need for learning, expanding, developing
  contribution: number; // Need to give, help, make a difference
}

export interface PRISMAnalysis {
  scores: PRISMScores;
  dominantNeeds: string[];
  communicationStyle: string;
  calibrationGuide: string;
}

const PRISM_INDICATORS: Record<keyof PRISMScores, { positive: string[]; negative: string[] }> = {
  certainty: {
    positive: [
      'guarantee',
      'secure',
      'safe',
      'reliable',
      'consistent',
      'proven',
      'stable',
      'always',
      'definitely',
      'promise',
    ],
    negative: ['risk', 'uncertain', 'maybe', 'might', 'possibly', 'depends'],
  },
  variety: {
    positive: [
      'new',
      'different',
      'exciting',
      'adventure',
      'change',
      'unique',
      'surprise',
      'innovative',
      'fresh',
    ],
    negative: ['boring', 'same', 'routine', 'usual', 'typical'],
  },
  significance: {
    positive: [
      'best',
      'exclusive',
      'special',
      'premium',
      'elite',
      'VIP',
      'important',
      'recognized',
      'unique',
    ],
    negative: ['ordinary', 'common', 'everyone', 'basic', 'standard'],
  },
  connection: {
    positive: [
      'together',
      'family',
      'team',
      'community',
      'relationship',
      'trust',
      'partner',
      'care',
      'support',
    ],
    negative: ['alone', 'separate', 'individual', 'independent'],
  },
  growth: {
    positive: [
      'learn',
      'improve',
      'develop',
      'grow',
      'better',
      'progress',
      'advance',
      'master',
      'skill',
    ],
    negative: ['stuck', 'stagnant', 'limit', 'ceiling'],
  },
  contribution: {
    positive: [
      'help',
      'give',
      'impact',
      'difference',
      'community',
      'legacy',
      'purpose',
      'meaning',
      'serve',
    ],
    negative: ['selfish', 'take', 'only me'],
  },
};

const CALIBRATION_GUIDES: Record<keyof PRISMScores, string> = {
  certainty: `Emphasize guarantees, warranties, and proven track records. Use phrases like "You can count on..." and "We guarantee..."`,
  variety: `Highlight new features, unique experiences, and exciting possibilities. Use phrases like "You'll love this new..." and "Imagine the possibilities..."`,
  significance: `Make them feel special and recognized. Use phrases like "As a valued customer..." and "You deserve the best..."`,
  connection: `Build rapport and emphasize relationships. Use phrases like "We're in this together..." and "Our community..."`,
  growth: `Focus on learning and improvement opportunities. Use phrases like "You'll master this..." and "This will help you grow..."`,
  contribution: `Emphasize impact and purpose. Use phrases like "You'll be making a difference..." and "Your contribution matters..."`,
};

export class PRISMService {
  analyzeTranscript(transcript: string): PRISMAnalysis {
    const lowerTranscript = transcript.toLowerCase();
    const scores: PRISMScores = {
      certainty: 50,
      variety: 50,
      significance: 50,
      connection: 50,
      growth: 50,
      contribution: 50,
    };

    // Analyze each need dimension
    for (const [need, indicators] of Object.entries(PRISM_INDICATORS)) {
      const needKey = need as keyof PRISMScores;
      let positiveCount = 0;
      let negativeCount = 0;

      for (const word of indicators.positive) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerTranscript.match(regex);
        positiveCount += matches?.length || 0;
      }

      for (const word of indicators.negative) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerTranscript.match(regex);
        negativeCount += matches?.length || 0;
      }

      // Calculate score adjustment
      const adjustment = (positiveCount - negativeCount) * 5;
      scores[needKey] = Math.min(100, Math.max(0, 50 + adjustment));
    }

    // Identify dominant needs (top 2)
    const sortedNeeds = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([need]) => need);

    // Generate communication style recommendation
    const communicationStyle = this.generateCommunicationStyle(sortedNeeds as (keyof PRISMScores)[]);

    // Generate calibration guide
    const calibrationGuide = sortedNeeds
      .map((need) => CALIBRATION_GUIDES[need as keyof PRISMScores])
      .join('\n\n');

    return {
      scores,
      dominantNeeds: sortedNeeds,
      communicationStyle,
      calibrationGuide,
    };
  }

  private generateCommunicationStyle(dominantNeeds: (keyof PRISMScores)[]): string {
    const styles: Record<keyof PRISMScores, string> = {
      certainty: 'factual and reassuring',
      variety: 'dynamic and enthusiastic',
      significance: 'respectful and validating',
      connection: 'warm and relational',
      growth: 'educational and encouraging',
      contribution: 'purposeful and impactful',
    };

    if (dominantNeeds.length === 0) {
      return 'balanced and professional';
    }

    if (dominantNeeds.length === 1) {
      return styles[dominantNeeds[0]];
    }

    return `${styles[dominantNeeds[0]]} with ${styles[dominantNeeds[1]]} elements`;
  }

  mergeScores(existing: PRISMScores, newScores: PRISMScores, weight: number = 0.3): PRISMScores {
    const merged: PRISMScores = {
      certainty: 0,
      variety: 0,
      significance: 0,
      connection: 0,
      growth: 0,
      contribution: 0,
    };

    for (const key of Object.keys(merged) as (keyof PRISMScores)[]) {
      merged[key] = Math.round(existing[key] * (1 - weight) + newScores[key] * weight);
    }

    return merged;
  }

  /**
   * Get dominant and secondary needs from PRISM scores
   */
  getDominantNeeds(scores: PRISMScores): { dominantNeed: string; secondaryNeed?: string } {
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    return {
      dominantNeed: sorted[0][0],
      secondaryNeed: sorted[1]?.[0],
    };
  }

  /**
   * Get response calibration based on psychological need
   * Based on Chase Hughes' Six Psychological Needs framework
   */
  getResponseCalibration(need: string): {
    opener: string;
    valueFrame: string;
    closeFrame: string;
    avoidPhrases: string[];
    usePhrases: string[];
  } {
    const calibrations: Record<string, {
      opener: string;
      valueFrame: string;
      closeFrame: string;
      avoidPhrases: string[];
      usePhrases: string[];
    }> = {
      significance: {
        opener: "What you're building matters",
        valueFrame: "This amplifies your impact",
        closeFrame: "People like you lead the way",
        avoidPhrases: ["simple", "easy", "basic", "standard"],
        usePhrases: ["strategic", "legacy", "difference", "recognized", "exclusive"],
      },
      acceptance: {
        opener: "Join others who understand this",
        valueFrame: "Be part of the families who...",
        closeFrame: "Your family will benefit when...",
        avoidPhrases: ["individual", "alone", "just you", "separate"],
        usePhrases: ["together", "community", "families like yours", "we", "us"],
      },
      approval: {
        opener: "You're making the right call",
        valueFrame: "This proves what I already see in you",
        closeFrame: "I knew you'd be someone who...",
        avoidPhrases: ["risky", "uncertain", "maybe", "might"],
        usePhrases: ["smart choice", "right decision", "good instinct", "definitely"],
      },
      intelligence: {
        opener: "You clearly understand the situation",
        valueFrame: "Most people miss this — you get it",
        closeFrame: "Smart move",
        avoidPhrases: ["trust me", "just believe", "don't worry about"],
        usePhrases: ["the data shows", "specifically", "here's exactly how", "research indicates"],
      },
      pity: {
        opener: "After everything you've handled...",
        valueFrame: "You deserve to have this solved",
        closeFrame: "It's time things worked for you",
        avoidPhrases: ["tough luck", "that's life", "everyone struggles"],
        usePhrases: ["you've been through enough", "you deserve", "finally", "it's your turn"],
      },
      power: {
        opener: "You're in control here",
        valueFrame: "This puts you in command",
        closeFrame: "The decision is yours",
        avoidPhrases: ["you have to", "you must", "you need to", "required"],
        usePhrases: ["your choice", "you decide", "your call", "options", "you control"],
      },
      // Map PRISM needs to psychological needs
      certainty: {
        opener: "You can count on this",
        valueFrame: "This is proven and reliable",
        closeFrame: "You'll have peace of mind",
        avoidPhrases: ["risk", "uncertain", "maybe", "might"],
        usePhrases: ["guaranteed", "proven", "reliable", "secure", "stable"],
      },
      variety: {
        opener: "Here's something exciting",
        valueFrame: "This brings fresh possibilities",
        closeFrame: "Imagine the new experiences",
        avoidPhrases: ["same", "usual", "routine", "typical"],
        usePhrases: ["new", "exciting", "different", "innovative", "fresh"],
      },
      connection: {
        opener: "We're here for you",
        valueFrame: "You're part of our community",
        closeFrame: "We're in this together",
        avoidPhrases: ["alone", "individual", "separate"],
        usePhrases: ["together", "family", "community", "relationship", "trust"],
      },
      growth: {
        opener: "This will help you grow",
        valueFrame: "You'll learn and improve",
        closeFrame: "You're on the path to mastery",
        avoidPhrases: ["stuck", "stagnant", "limit"],
        usePhrases: ["learn", "grow", "develop", "improve", "progress"],
      },
      contribution: {
        opener: "You're making a difference",
        valueFrame: "Your impact matters",
        closeFrame: "You're leaving a legacy",
        avoidPhrases: ["selfish", "just for you"],
        usePhrases: ["impact", "difference", "help others", "legacy", "purpose"],
      },
    };

    return calibrations[need] || calibrations.acceptance;
  }

  /**
   * Map PRISM scores to the six psychological needs format
   */
  mapToPsychologicalNeeds(prismScores: PRISMScores): {
    significance: number;
    acceptance: number;
    approval: number;
    intelligence: number;
    pity: number;
    power: number;
  } {
    return {
      significance: prismScores.significance,
      acceptance: prismScores.connection,
      approval: prismScores.certainty,
      intelligence: prismScores.growth,
      pity: prismScores.contribution,
      power: prismScores.variety,
    };
  }
}

export const prismService = new PRISMService();
