// Content types for real-world content integration

export type ContentSource = 'newsapi' | 'reddit' | 'rss' | 'static';
export type ContentCategory = 'politics' | 'tech' | 'culture' | 'economy';
export type ContentSentiment = 'positive' | 'negative' | 'neutral';

export interface ExternalContent {
  id: string;
  source: ContentSource;
  headline: string;
  summary: string;
  category: ContentCategory;
  sentiment: ContentSentiment;
  virality: number; // 0-100 score
  fetchedAt: Date;
  expiresAt: Date;
  url?: string;
  imageUrl?: string;
  gameEventTemplate?: string;
}

export interface ContentCache {
  lastFetch: Date;
  items: ExternalContent[];
  version: number;
}

export interface ContentFilterResult {
  passed: boolean;
  reason?: string;
  category?: ContentCategory;
  sentiment?: ContentSentiment;
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

export interface NewsAPIArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// Category to game mechanics mapping
export const CATEGORY_MECHANICS: Record<ContentCategory, {
  supportDelta: { ALL?: number; random?: number };
  cloutDelta?: number;
  fundsDelta?: number;
  riskDelta: number;
}> = {
  politics: { supportDelta: { random: 5 }, riskDelta: 3 },
  tech: { cloutDelta: 10, supportDelta: {}, riskDelta: 1 },
  culture: { supportDelta: { ALL: 2 }, fundsDelta: 20, riskDelta: 2 },
  economy: { fundsDelta: 50, supportDelta: {}, riskDelta: 2 },
};

// Blocked keywords for content filtering
export const BLOCKED_KEYWORDS = [
  'death', 'killed', 'murder', 'suicide', 'terrorist',
  'shooting', 'massacre', 'rape', 'abuse', 'graphic',
];

// Category detection keywords
export const CATEGORY_KEYWORDS: Record<ContentCategory, string[]> = {
  politics: ['election', 'congress', 'senate', 'president', 'vote', 'bill', 'policy', 'republican', 'democrat', 'legislation'],
  tech: ['ai', 'technology', 'startup', 'crypto', 'bitcoin', 'social media', 'app', 'software', 'silicon valley', 'elon'],
  culture: ['celebrity', 'movie', 'music', 'viral', 'trend', 'influencer', 'tiktok', 'youtube', 'entertainment', 'cancel'],
  economy: ['stock', 'market', 'inflation', 'economy', 'jobs', 'unemployment', 'federal reserve', 'recession', 'gdp', 'trade'],
};
