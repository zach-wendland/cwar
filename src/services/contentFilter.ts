import {
  ContentFilterResult,
  ContentCategory,
  ContentSentiment,
  BLOCKED_KEYWORDS,
  CATEGORY_KEYWORDS,
} from '../types/content';

/**
 * Content filtering service for safety and categorization
 */
export class ContentFilter {
  /**
   * Check if content passes safety filters
   */
  static isSafe(text: string): ContentFilterResult {
    const lowerText = text.toLowerCase();

    // Check for blocked keywords
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        return {
          passed: false,
          reason: `Contains blocked keyword: ${keyword}`,
        };
      }
    }

    // Check for personally identifiable information patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/;

    if (emailPattern.test(text) || phonePattern.test(text) || ssnPattern.test(text)) {
      return {
        passed: false,
        reason: 'Contains personally identifiable information',
      };
    }

    return { passed: true };
  }

  /**
   * Detect content category based on keywords
   */
  static detectCategory(text: string): ContentCategory {
    const lowerText = text.toLowerCase();
    const scores: Record<ContentCategory, number> = {
      politics: 0,
      tech: 0,
      culture: 0,
      economy: 0,
    };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          scores[category as ContentCategory]++;
        }
      }
    }

    // Find category with highest score
    let maxCategory: ContentCategory = 'culture';
    let maxScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category as ContentCategory;
      }
    }

    return maxCategory;
  }

  /**
   * Analyze sentiment of text (simplified)
   */
  static analyzeSentiment(text: string): ContentSentiment {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'success', 'win', 'growth', 'boost', 'rise', 'gain',
      'breakthrough', 'celebrate', 'achieve', 'improve', 'surge',
    ];

    const negativeWords = [
      'fail', 'loss', 'decline', 'drop', 'crash', 'crisis',
      'problem', 'concern', 'fear', 'warning', 'threat',
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveScore++;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeScore++;
    }

    if (positiveScore > negativeScore + 1) return 'positive';
    if (negativeScore > positiveScore + 1) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate virality score (0-100)
   */
  static calculateVirality(headline: string): number {
    let score = 50; // Base score

    // Viral indicators
    const viralPhrases = [
      { phrase: 'breaking', boost: 15 },
      { phrase: 'viral', boost: 20 },
      { phrase: 'trending', boost: 15 },
      { phrase: 'exclusive', boost: 10 },
      { phrase: 'shocking', boost: 15 },
      { phrase: 'just in', boost: 12 },
      { phrase: '!', boost: 5 },
    ];

    const lowerHeadline = headline.toLowerCase();

    for (const { phrase, boost } of viralPhrases) {
      if (lowerHeadline.includes(phrase)) {
        score += boost;
      }
    }

    // Length penalty for very short/long headlines
    if (headline.length < 30) score -= 10;
    if (headline.length > 150) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Full content analysis
   */
  static analyze(headline: string, summary?: string): ContentFilterResult & {
    category: ContentCategory;
    sentiment: ContentSentiment;
    virality: number;
  } {
    const fullText = `${headline} ${summary || ''}`;
    const safetyResult = this.isSafe(fullText);

    if (!safetyResult.passed) {
      return {
        ...safetyResult,
        category: 'culture',
        sentiment: 'neutral',
        virality: 0,
      };
    }

    return {
      passed: true,
      category: this.detectCategory(fullText),
      sentiment: this.analyzeSentiment(fullText),
      virality: this.calculateVirality(headline),
    };
  }
}
