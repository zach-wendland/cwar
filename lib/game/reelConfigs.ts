// reelConfigs.ts - Configuration for the 3-reel spin system
// Reel 1: Actions, Reel 2: Modifiers, Reel 3: Targets

// ================================
// REEL ITEM TYPES
// ================================

export interface ReelEffects {
  supportDelta?: { [key: string]: number };
  fundsDelta?: number;
  cloutDelta?: number;
  riskDelta?: number;
  supportMultiplier?: number;
  riskMultiplier?: number;
  costMultiplier?: number;
}

export interface ReelItem {
  id: string;
  name: string;
  emoji: string;
  tags: string[];  // Theme tags for combo matching
  effects: ReelEffects;
  cost?: { funds?: number; clout?: number };
  weight?: number;  // Spawn probability (default 1)
  requiresUnlock?: boolean;  // Prestige unlock
  riskThreshold?: number;  // Max risk to use
  targetStates?: string[] | 'ALL';  // For target reels
}

// ================================
// THEME TAGS (for emergent combos)
// ================================
// When tags match across reels, bonuses apply
// 2-tag match = 1.5x, 3-tag match = 2x, Named combo = 2.5-3x

export const THEME_TAGS = {
  // Media type
  DIGITAL: 'digital',
  GRASSROOTS: 'grassroots',
  BROADCAST: 'broadcast',

  // Tone
  AGGRESSIVE: 'aggressive',
  SAFE: 'safe',
  RISKY: 'risky',

  // Demographic
  YOUTH: 'youth',
  SUBURBAN: 'suburban',
  RURAL: 'rural',
  URBAN: 'urban',

  // Regional
  MIDWEST: 'midwest',
  COASTAL: 'coastal',
  SOUTH: 'south',
  SWING: 'swing',

  // Strategy
  VIRAL: 'viral',
  STEADY: 'steady',
  BLITZ: 'blitz',
} as const;

// ================================
// REEL 1: ACTIONS
// ================================

export const ACTION_REELS: ReelItem[] = [
  // Core Actions
  {
    id: 'meme',
    name: 'Meme Campaign',
    emoji: '🎭',
    tags: [THEME_TAGS.DIGITAL, THEME_TAGS.VIRAL, THEME_TAGS.YOUTH, THEME_TAGS.RISKY],
    effects: {
      supportDelta: { 'ALL': 5 },
      riskDelta: 5,
    },
    cost: { clout: 10 },
    weight: 1.2,
  },
  {
    id: 'rally',
    name: 'Rally',
    emoji: '📢',
    tags: [THEME_TAGS.GRASSROOTS, THEME_TAGS.AGGRESSIVE, THEME_TAGS.RURAL, THEME_TAGS.BLITZ],
    effects: {
      supportDelta: { 'ALL': 8 },
      riskDelta: 4,
    },
    cost: { funds: 35 },
    weight: 1.0,
  },
  {
    id: 'fundraise',
    name: 'Fundraise',
    emoji: '💰',
    tags: [THEME_TAGS.DIGITAL, THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    effects: {
      fundsDelta: 40,
      riskDelta: 3,
    },
    cost: {},
    weight: 1.3,
  },
  {
    id: 'podcast',
    name: 'Podcast',
    emoji: '🎙️',
    tags: [THEME_TAGS.BROADCAST, THEME_TAGS.SAFE, THEME_TAGS.SUBURBAN, THEME_TAGS.STEADY],
    effects: {
      cloutDelta: 10,
      supportDelta: { 'ALL': 2 },
      riskDelta: 2,
    },
    cost: { funds: 20 },
    weight: 1.1,
  },
  {
    id: 'canvass',
    name: 'Canvass',
    emoji: '🚶',
    tags: [THEME_TAGS.GRASSROOTS, THEME_TAGS.SAFE, THEME_TAGS.SUBURBAN, THEME_TAGS.STEADY],
    effects: {
      supportDelta: { 'ALL': 4 },
      cloutDelta: 2,
      riskDelta: 1,
    },
    cost: { funds: 40 },
    weight: 1.0,
  },
  {
    id: 'debate',
    name: 'Debate',
    emoji: '🎯',
    tags: [THEME_TAGS.BROADCAST, THEME_TAGS.AGGRESSIVE, THEME_TAGS.RISKY, THEME_TAGS.BLITZ],
    effects: {
      supportDelta: { 'ALL': 6 },
      cloutDelta: 15,
      riskDelta: 7,
    },
    cost: { funds: 30, clout: 15 },
    weight: 0.7,
  },
  {
    id: 'botarmy',
    name: 'Bot Army',
    emoji: '🤖',
    tags: [THEME_TAGS.DIGITAL, THEME_TAGS.RISKY, THEME_TAGS.AGGRESSIVE, THEME_TAGS.VIRAL],
    effects: {
      supportDelta: { 'ALL': 4 },
      riskDelta: 12,
    },
    cost: { funds: 25, clout: 8 },
    weight: 0.6,
    riskThreshold: 75,
  },
  {
    id: 'influencer',
    name: 'Influencer',
    emoji: '⭐',
    tags: [THEME_TAGS.DIGITAL, THEME_TAGS.YOUTH, THEME_TAGS.VIRAL, THEME_TAGS.URBAN],
    effects: {
      supportDelta: { 'ALL': 4 },
      cloutDelta: 12,
      riskDelta: 5,
    },
    cost: { funds: 55, clout: 18 },
    weight: 0.8,
  },
  {
    id: 'legal',
    name: 'Legal Team',
    emoji: '⚖️',
    tags: [THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    effects: {
      riskDelta: -12,
      cloutDelta: 3,
    },
    cost: { funds: 120 },
    weight: 0.5,
  },
];

// ================================
// REEL 2: MODIFIERS
// ================================

export const MODIFIER_REELS: ReelItem[] = [
  {
    id: 'viral',
    name: 'Viral',
    emoji: '🔥',
    tags: [THEME_TAGS.VIRAL, THEME_TAGS.DIGITAL, THEME_TAGS.RISKY],
    effects: {
      supportMultiplier: 1.5,
      riskDelta: 3,
    },
    weight: 0.8,
  },
  {
    id: 'grassroots',
    name: 'Grassroots',
    emoji: '🌱',
    tags: [THEME_TAGS.GRASSROOTS, THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    effects: {
      supportMultiplier: 0.8,
      riskMultiplier: 0.5,
    },
    weight: 1.0,
  },
  {
    id: 'corporate',
    name: 'Corporate',
    emoji: '🏢',
    tags: [THEME_TAGS.SUBURBAN, THEME_TAGS.STEADY, THEME_TAGS.SAFE],
    effects: {
      fundsDelta: 20,
      supportMultiplier: 0.9,
    },
    weight: 0.9,
  },
  {
    id: 'underground',
    name: 'Underground',
    emoji: '🕵️',
    tags: [THEME_TAGS.RISKY, THEME_TAGS.URBAN, THEME_TAGS.AGGRESSIVE],
    effects: {
      supportMultiplier: 1.3,
      riskDelta: 5,
      costMultiplier: 0.7,
    },
    weight: 0.7,
  },
  {
    id: 'mainstream',
    name: 'Mainstream',
    emoji: '📺',
    tags: [THEME_TAGS.BROADCAST, THEME_TAGS.SUBURBAN, THEME_TAGS.SAFE],
    effects: {
      cloutDelta: 5,
      supportMultiplier: 1.1,
    },
    weight: 1.1,
  },
  {
    id: 'blitz',
    name: 'Blitz',
    emoji: '⚡',
    tags: [THEME_TAGS.BLITZ, THEME_TAGS.AGGRESSIVE, THEME_TAGS.RISKY],
    effects: {
      supportMultiplier: 1.4,
      riskDelta: 4,
      costMultiplier: 1.3,
    },
    weight: 0.6,
  },
  {
    id: 'stealth',
    name: 'Stealth',
    emoji: '👻',
    tags: [THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    effects: {
      riskMultiplier: 0.3,
      supportMultiplier: 0.7,
    },
    weight: 0.8,
  },
  {
    id: 'astroturf',
    name: 'Astroturf',
    emoji: '🎪',
    tags: [THEME_TAGS.DIGITAL, THEME_TAGS.RISKY, THEME_TAGS.VIRAL],
    effects: {
      supportMultiplier: 1.6,
      riskDelta: 8,
    },
    weight: 0.5,
    riskThreshold: 80,
  },
];

// ================================
// REEL 3: TARGETS
// ================================

// State groupings by region
const MIDWEST_STATES = ['OH', 'MI', 'WI', 'MN', 'IA', 'IN', 'IL', 'MO', 'KS', 'NE', 'ND', 'SD'];
const COASTAL_STATES = ['CA', 'WA', 'OR', 'NY', 'MA', 'CT', 'RI', 'NJ', 'MD', 'DE'];
const SOUTH_STATES = ['TX', 'FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY'];
const SWING_STATES = ['PA', 'MI', 'WI', 'AZ', 'GA', 'NV', 'NC'];

export const TARGET_REELS: ReelItem[] = [
  {
    id: 'national',
    name: 'National',
    emoji: '🇺🇸',
    tags: [THEME_TAGS.BROADCAST, THEME_TAGS.STEADY],
    effects: {},
    targetStates: 'ALL',
    weight: 1.2,
  },
  {
    id: 'midwest',
    name: 'Midwest',
    emoji: '🌾',
    tags: [THEME_TAGS.MIDWEST, THEME_TAGS.RURAL, THEME_TAGS.GRASSROOTS],
    effects: {
      supportMultiplier: 1.5,
    },
    targetStates: MIDWEST_STATES,
    weight: 1.0,
  },
  {
    id: 'coastal',
    name: 'Coastal',
    emoji: '🌊',
    tags: [THEME_TAGS.COASTAL, THEME_TAGS.URBAN, THEME_TAGS.DIGITAL],
    effects: {
      supportMultiplier: 1.5,
    },
    targetStates: COASTAL_STATES,
    weight: 1.0,
  },
  {
    id: 'south',
    name: 'South',
    emoji: '🌴',
    tags: [THEME_TAGS.SOUTH, THEME_TAGS.RURAL, THEME_TAGS.GRASSROOTS],
    effects: {
      supportMultiplier: 1.5,
    },
    targetStates: SOUTH_STATES,
    weight: 1.0,
  },
  {
    id: 'swing',
    name: 'Swing States',
    emoji: '🎯',
    tags: [THEME_TAGS.SWING, THEME_TAGS.BLITZ, THEME_TAGS.AGGRESSIVE],
    effects: {
      supportMultiplier: 1.8,
      riskDelta: 2,
    },
    targetStates: SWING_STATES,
    weight: 0.7,
  },
  {
    id: 'youth',
    name: 'Youth Vote',
    emoji: '🎓',
    tags: [THEME_TAGS.YOUTH, THEME_TAGS.DIGITAL, THEME_TAGS.URBAN],
    effects: {
      supportMultiplier: 1.4,
      cloutDelta: 3,
    },
    targetStates: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'MI', 'GA', 'NC'],
    weight: 0.9,
  },
  {
    id: 'suburban',
    name: 'Suburbs',
    emoji: '🏡',
    tags: [THEME_TAGS.SUBURBAN, THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    effects: {
      supportMultiplier: 1.3,
      riskMultiplier: 0.8,
    },
    targetStates: ['PA', 'GA', 'AZ', 'MI', 'WI', 'NC', 'VA', 'CO', 'NV', 'NH'],
    weight: 1.0,
  },
  {
    id: 'rural',
    name: 'Rural',
    emoji: '🚜',
    tags: [THEME_TAGS.RURAL, THEME_TAGS.GRASSROOTS, THEME_TAGS.MIDWEST],
    effects: {
      supportMultiplier: 1.4,
      fundsDelta: -10, // Costs more to reach
    },
    targetStates: ['WY', 'MT', 'ND', 'SD', 'NE', 'KS', 'OK', 'ID', 'WV', 'AR'],
    weight: 0.8,
  },
];

// ================================
// REEL HELPERS
// ================================

export function getReelItemById(reelType: 'action' | 'modifier' | 'target', id: string): ReelItem | undefined {
  const reel = reelType === 'action' ? ACTION_REELS :
               reelType === 'modifier' ? MODIFIER_REELS : TARGET_REELS;
  return reel.find(item => item.id === id);
}

export function getAllTags(): string[] {
  return Object.values(THEME_TAGS);
}
