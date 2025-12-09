import {
  ExternalContent,
  ContentCache,
  NewsAPIResponse,
  CATEGORY_MECHANICS,
} from '../types/content';
import { ContentFilter } from './contentFilter';
import { GameEvent, EventOutcome } from '../game/GameContext';

// Cache configuration
const CACHE_KEY = 'contentCache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_ITEMS = 20;

// Static fallback content
const STATIC_CONTENT: ExternalContent[] = [
  {
    id: 'static-1',
    source: 'static',
    headline: 'Social Media Algorithm Changes Spark Debate',
    summary: 'Major platforms announce new content moderation policies affecting political discourse.',
    category: 'tech',
    sentiment: 'neutral',
    virality: 65,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 'static-2',
    source: 'static',
    headline: 'Viral Trend Sweeps Nation: #MovementRising',
    summary: 'Grassroots digital campaign gains unexpected mainstream attention.',
    category: 'culture',
    sentiment: 'positive',
    virality: 85,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 'static-3',
    source: 'static',
    headline: 'Economic Uncertainty Fuels Political Tensions',
    summary: 'Markets react to policy debates as citizens seek answers.',
    category: 'economy',
    sentiment: 'negative',
    virality: 70,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 'static-4',
    source: 'static',
    headline: 'Influencer Coalition Forms Around New Cause',
    summary: 'Major content creators unite to amplify emerging movement.',
    category: 'culture',
    sentiment: 'positive',
    virality: 78,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 'static-5',
    source: 'static',
    headline: 'Leaked Documents Reveal Platform Bias Claims',
    summary: 'Internal communications suggest algorithmic manipulation of trending topics.',
    category: 'tech',
    sentiment: 'negative',
    virality: 90,
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  },
];

/**
 * Content service for fetching, caching, and transforming external content
 */
export class ContentService {
  private static instance: ContentService;
  private cache: ContentCache | null = null;

  private constructor() {
    this.loadCache();
  }

  static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.lastFetch = new Date(parsed.lastFetch);
        parsed.items = parsed.items.map((item: any) => ({
          ...item,
          fetchedAt: new Date(item.fetchedAt),
          expiresAt: new Date(item.expiresAt),
        }));
        this.cache = parsed;
      }
    } catch (e) {
      console.warn('Failed to load content cache:', e);
      this.cache = null;
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    if (this.cache) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const age = Date.now() - this.cache.lastFetch.getTime();
    return age < CACHE_TTL && this.cache.items.length > 0;
  }

  /**
   * Fetch content from NewsAPI (when API key is available)
   */
  async fetchFromNewsAPI(apiKey: string): Promise<ExternalContent[]> {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data: NewsAPIResponse = await response.json();
      return this.transformNewsAPIResponse(data);
    } catch (error) {
      console.error('NewsAPI fetch failed:', error);
      return [];
    }
  }

  /**
   * Transform NewsAPI response to ExternalContent
   */
  private transformNewsAPIResponse(data: NewsAPIResponse): ExternalContent[] {
    const items: ExternalContent[] = [];

    for (const article of data.articles) {
      if (!article.title || !article.description) continue;

      const analysis = ContentFilter.analyze(article.title, article.description);

      if (!analysis.passed) continue;

      items.push({
        id: `newsapi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'newsapi',
        headline: article.title,
        summary: article.description,
        category: analysis.category,
        sentiment: analysis.sentiment,
        virality: analysis.virality,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_TTL),
        url: article.url,
        imageUrl: article.urlToImage || undefined,
      });
    }

    return items.slice(0, MAX_ITEMS);
  }

  /**
   * Get content (from cache or fetch)
   */
  async getContent(): Promise<ExternalContent[]> {
    // Return cached content if valid
    if (this.isCacheValid() && this.cache) {
      return this.cache.items.filter(item => new Date(item.expiresAt) > new Date());
    }

    // Try to fetch fresh content
    const apiKey = process.env.REACT_APP_NEWSAPI_KEY;
    let items: ExternalContent[] = [];

    if (apiKey) {
      items = await this.fetchFromNewsAPI(apiKey);
    }

    // Fall back to static content if fetch fails or no API key
    if (items.length === 0) {
      items = STATIC_CONTENT.map(item => ({
        ...item,
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_TTL),
      }));
    }

    // Update cache
    this.cache = {
      lastFetch: new Date(),
      items,
      version: (this.cache?.version || 0) + 1,
    };
    this.saveCache();

    return items;
  }

  /**
   * Get random content item
   */
  async getRandomContent(): Promise<ExternalContent | null> {
    const items = await this.getContent();
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Transform content into a game event
   */
  contentToGameEvent(content: ExternalContent): GameEvent {
    const mechanics = CATEGORY_MECHANICS[content.category];
    const sentimentModifier = content.sentiment === 'positive' ? 1.5 :
                              content.sentiment === 'negative' ? 0.5 : 1;

    // Create event options based on content
    const options = this.generateEventOptions(content, mechanics, sentimentModifier);

    return {
      title: `📰 ${content.headline}`,
      description: content.summary,
      options,
    };
  }

  /**
   * Generate event options from content
   */
  private generateEventOptions(
    content: ExternalContent,
    mechanics: typeof CATEGORY_MECHANICS[keyof typeof CATEGORY_MECHANICS],
    sentimentModifier: number
  ): { text: string; outcome: EventOutcome }[] {
    const baseSupport = mechanics.supportDelta.ALL || mechanics.supportDelta.random || 0;
    const baseRisk = mechanics.riskDelta;

    return [
      {
        text: 'Amplify this story',
        outcome: {
          supportDelta: baseSupport ? { ALL: Math.round(baseSupport * sentimentModifier) } : undefined,
          cloutDelta: Math.round(10 * sentimentModifier),
          riskDelta: Math.round(baseRisk * 1.5),
          message: `You amplified: "${content.headline}"`,
        },
      },
      {
        text: 'Counter-narrative response',
        outcome: {
          cloutDelta: 5,
          fundsDelta: -10,
          riskDelta: Math.round(baseRisk * 0.5),
          message: 'You pushed back against the narrative.',
        },
      },
      {
        text: 'Ignore and move on',
        outcome: {
          riskDelta: -2,
          message: 'You let the news cycle pass.',
        },
      },
    ];
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = null;
    localStorage.removeItem(CACHE_KEY);
  }
}

// Export singleton instance
export const contentService = ContentService.getInstance();
