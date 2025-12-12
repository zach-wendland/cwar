// seasonalEvents.ts - Time-limited seasonal events and FOMO mechanics
// Breaking news, election cycles, and community goals

import { GameState, EventOutcome } from './GameContext';

// ================================
// TYPES
// ================================

export type SeasonType = 'election' | 'scandal' | 'holiday' | 'crisis' | 'special';

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  type: SeasonType;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  icon: string;
  themeColor: string;
  modifiers: SeasonModifier[];
  goals: CommunityGoal[];
  rewards: SeasonReward[];
}

export interface SeasonModifier {
  type: 'support_multiplier' | 'risk_multiplier' | 'funds_multiplier' | 'clout_multiplier' | 'special_actions';
  value: number;
  description: string;
}

export interface CommunityGoal {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: SeasonReward;
  completed: boolean;
}

export interface SeasonReward {
  type: 'prestige' | 'clout' | 'funds' | 'title' | 'cosmetic';
  value: number | string;
  name: string;
}

export interface BreakingNews {
  id: string;
  headline: string;
  description: string;
  duration: number;  // Hours remaining
  effect: EventOutcome;
  icon: string;
}

// ================================
// SEASONAL EVENT TEMPLATES
// ================================

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'winter-2025',
    name: 'Holiday Campaign Rush',
    description: 'The holiday season brings heightened attention to campaigns. Donations surge but so does scrutiny!',
    type: 'holiday',
    startDate: '2025-12-15',
    endDate: '2025-12-31',
    icon: '🎄',
    themeColor: '#dc2626',
    modifiers: [
      { type: 'funds_multiplier', value: 1.5, description: '+50% fundraising' },
      { type: 'risk_multiplier', value: 1.25, description: '+25% risk from actions' },
    ],
    goals: [
      {
        id: 'winter-donations',
        description: 'Community raises $1M in donations',
        target: 1000000,
        current: 0,
        reward: { type: 'prestige', value: 50, name: 'Holiday Hero' },
        completed: false,
      },
    ],
    rewards: [
      { type: 'title', value: 'Holiday Campaigner', name: 'Seasonal Title' },
      { type: 'prestige', value: 100, name: 'Season Completion Bonus' },
    ],
  },
  {
    id: 'election-2026',
    name: 'Midterm Madness',
    description: 'The 2026 midterms are heating up! Every action counts double as the nation watches.',
    type: 'election',
    startDate: '2025-10-01',
    endDate: '2025-11-05',
    icon: '🗳️',
    themeColor: '#3b82f6',
    modifiers: [
      { type: 'support_multiplier', value: 2.0, description: '2x support changes' },
      { type: 'risk_multiplier', value: 1.5, description: '+50% risk from actions' },
    ],
    goals: [
      {
        id: 'election-victories',
        description: 'Community achieves 10,000 campaign victories',
        target: 10000,
        current: 0,
        reward: { type: 'prestige', value: 100, name: 'Victory Stampede' },
        completed: false,
      },
    ],
    rewards: [
      { type: 'title', value: 'Midterm Master', name: 'Seasonal Title' },
      { type: 'prestige', value: 200, name: 'Election Champion' },
    ],
  },
  {
    id: 'scandal-week',
    name: 'Scandal Season',
    description: 'A wave of political scandals hits Washington. High risk, high reward!',
    type: 'scandal',
    startDate: '2025-12-08',
    endDate: '2025-12-14',
    icon: '📰',
    themeColor: '#f59e0b',
    modifiers: [
      { type: 'clout_multiplier', value: 2.0, description: '2x clout gains/losses' },
      { type: 'risk_multiplier', value: 2.0, description: '2x risk from actions' },
    ],
    goals: [
      {
        id: 'scandal-survivors',
        description: 'Community completes 1,000 low-risk victories',
        target: 1000,
        current: 0,
        reward: { type: 'prestige', value: 75, name: 'Scandal Survivor' },
        completed: false,
      },
    ],
    rewards: [
      { type: 'title', value: 'Scandal Survivor', name: 'Seasonal Title' },
    ],
  },
  {
    id: 'crisis-event',
    name: 'National Crisis',
    description: 'A major crisis demands attention. Public sentiment is volatile!',
    type: 'crisis',
    startDate: '2025-12-01',
    endDate: '2025-12-07',
    icon: '🚨',
    themeColor: '#ef4444',
    modifiers: [
      { type: 'support_multiplier', value: 1.5, description: '+50% support volatility' },
      { type: 'special_actions', value: 1, description: 'Crisis actions unlocked' },
    ],
    goals: [],
    rewards: [
      { type: 'prestige', value: 50, name: 'Crisis Manager' },
    ],
  },
];

// ================================
// BREAKING NEWS TEMPLATES
// ================================

const BREAKING_NEWS_POOL: Omit<BreakingNews, 'id' | 'duration'>[] = [
  {
    headline: 'BREAKING: Major Policy Announcement!',
    description: 'A significant policy shift creates opportunities for agile campaigns.',
    effect: { cloutDelta: 15 },
    icon: '📣',
  },
  {
    headline: 'VIRAL: Political Meme Takes Over Internet',
    description: 'A viral moment gives all digital campaigns a temporary boost.',
    effect: { supportDelta: { random: 5 } },
    icon: '🔥',
  },
  {
    headline: 'SCANDAL: Opponent Faces Backlash',
    description: 'A competitor stumbles, creating an opening.',
    effect: { riskDelta: -10, cloutDelta: 10 },
    icon: '😱',
  },
  {
    headline: 'ECONOMY: Markets React to Political News',
    description: 'Economic concerns dominate the news cycle.',
    effect: { fundsDelta: 25 },
    icon: '📈',
  },
  {
    headline: 'WEATHER: Storm Disrupts Campaign Events',
    description: 'Bad weather forces a pivot to digital strategies.',
    effect: { riskDelta: 5 },
    icon: '🌧️',
  },
  {
    headline: 'CELEBRITY: Major Endorsement Incoming!',
    description: 'A high-profile figure is about to make waves.',
    effect: { cloutDelta: 20, supportDelta: { random: 3 } },
    icon: '⭐',
  },
];

// ================================
// CORE FUNCTIONS
// ================================

/**
 * Get the current date key
 */
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Check if a date is within a range
 */
function isDateInRange(dateKey: string, start: string, end: string): boolean {
  return dateKey >= start && dateKey <= end;
}

/**
 * Get current active seasonal event, if any
 */
export function getCurrentSeason(dateKey?: string): SeasonalEvent | null {
  const today = dateKey || getTodayKey();

  for (const event of SEASONAL_EVENTS) {
    if (isDateInRange(today, event.startDate, event.endDate)) {
      return event;
    }
  }

  return null;
}

/**
 * Get upcoming seasonal events
 */
export function getUpcomingSeasons(limit: number = 3): SeasonalEvent[] {
  const today = getTodayKey();

  return SEASONAL_EVENTS
    .filter(event => event.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}

/**
 * Apply seasonal modifiers to an outcome
 */
export function applySeasonalModifiers(
  outcome: EventOutcome,
  season: SeasonalEvent | null
): EventOutcome {
  if (!season) return outcome;

  const modified = { ...outcome };

  for (const mod of season.modifiers) {
    switch (mod.type) {
      case 'support_multiplier':
        if (modified.supportDelta) {
          if (typeof modified.supportDelta === 'object') {
            const scaled: Record<string, number> = {};
            for (const [key, value] of Object.entries(modified.supportDelta)) {
              if (typeof value === 'number') {
                scaled[key] = Math.round(value * mod.value);
              }
            }
            modified.supportDelta = scaled;
          }
        }
        break;

      case 'risk_multiplier':
        if (modified.riskDelta) {
          modified.riskDelta = Math.round(modified.riskDelta * mod.value);
        }
        break;

      case 'funds_multiplier':
        if (modified.fundsDelta) {
          modified.fundsDelta = Math.round(modified.fundsDelta * mod.value);
        }
        break;

      case 'clout_multiplier':
        if (modified.cloutDelta) {
          modified.cloutDelta = Math.round(modified.cloutDelta * mod.value);
        }
        break;
    }
  }

  return modified;
}

/**
 * Get remaining time for seasonal event
 */
export function getSeasonRemainingTime(season: SeasonalEvent): { days: number; hours: number } {
  const now = new Date();
  const end = new Date(season.endDate + 'T23:59:59');
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours };
}

// ================================
// BREAKING NEWS FUNCTIONS
// ================================

let activeBreakingNews: BreakingNews | null = null;
let lastNewsCheck: number = 0;

/**
 * Check for and potentially trigger breaking news
 * Called on each turn - 5% chance per turn if no active news
 */
export function checkBreakingNews(): BreakingNews | null {
  const now = Date.now();

  // Expire old news (every 2 hours = 7200000ms)
  if (activeBreakingNews && (now - lastNewsCheck) > 7200000) {
    activeBreakingNews = null;
  }

  // If there's active news, return it
  if (activeBreakingNews) {
    return activeBreakingNews;
  }

  // 5% chance to trigger new breaking news
  if (Math.random() < 0.05) {
    const template = BREAKING_NEWS_POOL[Math.floor(Math.random() * BREAKING_NEWS_POOL.length)];
    activeBreakingNews = {
      ...template,
      id: `news-${now}`,
      duration: Math.floor(Math.random() * 12) + 1, // 1-12 hours
    };
    lastNewsCheck = now;
    return activeBreakingNews;
  }

  return null;
}

/**
 * Clear active breaking news
 */
export function clearBreakingNews(): void {
  activeBreakingNews = null;
}

/**
 * Get active breaking news without triggering check
 */
export function getActiveBreakingNews(): BreakingNews | null {
  return activeBreakingNews;
}

// ================================
// COMMUNITY GOAL FUNCTIONS
// ================================

/**
 * Update a community goal progress
 * In a real app, this would sync with a server
 */
export function updateCommunityGoal(
  season: SeasonalEvent,
  goalId: string,
  increment: number
): SeasonalEvent {
  const updatedGoals = season.goals.map(goal => {
    if (goal.id === goalId && !goal.completed) {
      const newCurrent = goal.current + increment;
      return {
        ...goal,
        current: newCurrent,
        completed: newCurrent >= goal.target,
      };
    }
    return goal;
  });

  return { ...season, goals: updatedGoals };
}

/**
 * Calculate progress percentage for a goal
 */
export function getGoalProgress(goal: CommunityGoal): number {
  return Math.min(100, Math.round((goal.current / goal.target) * 100));
}

// ================================
// SEASON TYPE HELPERS
// ================================

export function getSeasonTypeIcon(type: SeasonType): string {
  switch (type) {
    case 'election': return '🗳️';
    case 'scandal': return '📰';
    case 'holiday': return '🎄';
    case 'crisis': return '🚨';
    case 'special': return '⭐';
  }
}

export function getSeasonTypeLabel(type: SeasonType): string {
  switch (type) {
    case 'election': return 'Election Event';
    case 'scandal': return 'Scandal Season';
    case 'holiday': return 'Holiday Event';
    case 'crisis': return 'Crisis Event';
    case 'special': return 'Special Event';
  }
}

// ================================
// STORAGE
// ================================

const SEASON_PROGRESS_KEY = 'seasonProgress';

interface SeasonProgress {
  seasonId: string;
  goalsContributed: Record<string, number>;
  rewardsClaimed: string[];
}

export function loadSeasonProgress(): SeasonProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(SEASON_PROGRESS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveSeasonProgress(progress: SeasonProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEASON_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable
  }
}
