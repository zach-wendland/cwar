// sentimentEngine.ts - Dynamic faction mood system
// Factions react to player actions with shifting sentiment that affects gameplay

import { GameState } from './GameContext';
import { SpinResult } from './spinSystem';
import { ReelItem } from './reelConfigs';

// ================================
// SENTIMENT TYPES
// ================================

export type MoodLevel = 'ENTHUSIASTIC' | 'ENGAGED' | 'APATHETIC' | 'HOSTILE';

export interface FactionSentiment {
  mood: MoodLevel;
  momentum: number; // -100 to 100, affects mood transitions
  recentActions: SentimentAction[]; // Last 5 actions affecting this faction
  turnsInCurrentMood: number;
  lastMoodChange: number; // Turn number
}

export interface SentimentAction {
  turn: number;
  actionName: string;
  impact: number; // -20 to +20
  reason: string;
}

export interface SentimentState {
  factions: Record<string, FactionSentiment>;
  globalMomentum: number; // Overall campaign energy
  volatility: number; // How quickly moods can shift
  lastUpdate: number;
}

// ================================
// MOOD THRESHOLDS & EFFECTS
// ================================

export const MOOD_THRESHOLDS = {
  ENTHUSIASTIC: { min: 60, effectMultiplier: 1.3, color: '#22c55e', icon: '🔥', label: 'Fired Up!' },
  ENGAGED: { min: 20, effectMultiplier: 1.0, color: '#3b82f6', icon: '👍', label: 'Engaged' },
  APATHETIC: { min: -20, effectMultiplier: 0.7, color: '#6b7280', icon: '😐', label: 'Apathetic' },
  HOSTILE: { min: -100, effectMultiplier: 0.4, color: '#ef4444', icon: '😤', label: 'Hostile' },
} as const;

export function getMoodFromMomentum(momentum: number): MoodLevel {
  if (momentum >= MOOD_THRESHOLDS.ENTHUSIASTIC.min) return 'ENTHUSIASTIC';
  if (momentum >= MOOD_THRESHOLDS.ENGAGED.min) return 'ENGAGED';
  if (momentum >= MOOD_THRESHOLDS.APATHETIC.min) return 'APATHETIC';
  return 'HOSTILE';
}

export function getMoodInfo(mood: MoodLevel) {
  return MOOD_THRESHOLDS[mood];
}

// ================================
// FACTION SENTIMENT TRIGGERS
// ================================

// What each faction cares about (tags that affect their sentiment)
export const FACTION_INTERESTS: Record<string, {
  loves: string[];      // +15 sentiment
  likes: string[];      // +8 sentiment
  dislikes: string[];   // -8 sentiment
  hates: string[];      // -15 sentiment
  description: string;
}> = {
  'tech-elite': {
    loves: ['digital', 'viral', 'innovation', 'coastal'],
    likes: ['corporate', 'mainstream', 'urban'],
    dislikes: ['grassroots', 'rural', 'traditional'],
    hates: ['underground', 'populist'],
    description: 'Silicon Valley technocrats who believe algorithms can solve everything',
  },
  'rural-heartland': {
    loves: ['grassroots', 'rural', 'traditional', 'midwest'],
    likes: ['populist', 'underground', 'authentic'],
    dislikes: ['corporate', 'coastal', 'elite'],
    hates: ['digital', 'astroturf'],
    description: 'Salt-of-the-earth Americans suspicious of coastal elites',
  },
  'urban-progressive': {
    loves: ['grassroots', 'youth', 'urban', 'activism'],
    likes: ['viral', 'digital', 'coastal'],
    dislikes: ['corporate', 'traditional', 'mainstream'],
    hates: ['astroturf', 'establishment'],
    description: 'City-dwelling progressives fighting for change',
  },
  'corporate-establishment': {
    loves: ['corporate', 'mainstream', 'establishment', 'legal'],
    likes: ['coastal', 'traditional', 'moderate'],
    dislikes: ['grassroots', 'underground', 'populist'],
    hates: ['radical', 'disruptive', 'risky'],
    description: 'Fortune 500 executives who prefer stability over disruption',
  },
  'media-influencers': {
    loves: ['viral', 'digital', 'mainstream', 'celebrity'],
    likes: ['urban', 'coastal', 'youth'],
    dislikes: ['underground', 'traditional', 'rural'],
    hates: ['boring', 'establishment', 'slow'],
    description: 'Content creators and talking heads who live for engagement',
  },
  'grassroots-activists': {
    loves: ['grassroots', 'activism', 'populist', 'underground'],
    likes: ['youth', 'urban', 'authentic'],
    dislikes: ['corporate', 'mainstream', 'establishment'],
    hates: ['astroturf', 'sellout', 'moderate'],
    description: 'True believers who organize door-to-door',
  },
};

// ================================
// SENTIMENT CALCULATION
// ================================

export function calculateActionSentimentImpact(
  factionId: string,
  spinResult: SpinResult,
  comboMultiplier: number = 1
): { impact: number; reason: string } {
  const interests = FACTION_INTERESTS[factionId];
  if (!interests) return { impact: 0, reason: 'Unknown faction' };

  // Gather all tags from the spin result
  const allTags = [
    ...spinResult.action.tags,
    ...spinResult.modifier.tags,
    ...spinResult.target.tags,
  ];

  let totalImpact = 0;
  const reasons: string[] = [];

  // Check each tag against faction interests
  for (const tag of allTags) {
    if (interests.loves.includes(tag)) {
      totalImpact += 15;
      reasons.push(`Loves "${tag}"`);
    } else if (interests.likes.includes(tag)) {
      totalImpact += 8;
      reasons.push(`Likes "${tag}"`);
    } else if (interests.dislikes.includes(tag)) {
      totalImpact -= 8;
      reasons.push(`Dislikes "${tag}"`);
    } else if (interests.hates.includes(tag)) {
      totalImpact -= 15;
      reasons.push(`Hates "${tag}"`);
    }
  }

  // Apply combo multiplier (big combos = bigger sentiment swings)
  totalImpact = Math.round(totalImpact * comboMultiplier);

  // Cap impact per action
  totalImpact = Math.max(-30, Math.min(30, totalImpact));

  const reason = reasons.length > 0
    ? reasons.slice(0, 3).join(', ')
    : 'Neutral action';

  return { impact: totalImpact, reason };
}

// ================================
// SENTIMENT STATE MANAGEMENT
// ================================

export function initializeSentimentState(): SentimentState {
  const factions: Record<string, FactionSentiment> = {};

  for (const factionId of Object.keys(FACTION_INTERESTS)) {
    factions[factionId] = {
      mood: 'ENGAGED',
      momentum: 30, // Start slightly positive
      recentActions: [],
      turnsInCurrentMood: 0,
      lastMoodChange: 0,
    };
  }

  return {
    factions,
    globalMomentum: 50,
    volatility: 1.0,
    lastUpdate: 0,
  };
}

export function updateFactionSentiment(
  sentiment: SentimentState,
  factionId: string,
  impact: number,
  actionName: string,
  reason: string,
  currentTurn: number
): SentimentState {
  const faction = sentiment.factions[factionId];
  if (!faction) return sentiment;

  // Calculate new momentum
  const decay = 0.95; // Sentiment decays slightly each update
  let newMomentum = faction.momentum * decay + impact;
  newMomentum = Math.max(-100, Math.min(100, newMomentum));

  // Determine new mood
  const newMood = getMoodFromMomentum(newMomentum);
  const moodChanged = newMood !== faction.mood;

  // Track recent action
  const newAction: SentimentAction = {
    turn: currentTurn,
    actionName,
    impact,
    reason,
  };

  const recentActions = [newAction, ...faction.recentActions].slice(0, 5);

  return {
    ...sentiment,
    factions: {
      ...sentiment.factions,
      [factionId]: {
        mood: newMood,
        momentum: newMomentum,
        recentActions,
        turnsInCurrentMood: moodChanged ? 0 : faction.turnsInCurrentMood + 1,
        lastMoodChange: moodChanged ? currentTurn : faction.lastMoodChange,
      },
    },
    lastUpdate: currentTurn,
  };
}

export function processSpinSentiment(
  sentiment: SentimentState,
  spinResult: SpinResult,
  comboMultiplier: number,
  currentTurn: number
): { newSentiment: SentimentState; reactions: FactionReaction[] } {
  let newSentiment = { ...sentiment };
  const reactions: FactionReaction[] = [];

  const actionName = `${spinResult.action.name} + ${spinResult.modifier.name} → ${spinResult.target.name}`;

  for (const factionId of Object.keys(FACTION_INTERESTS)) {
    const { impact, reason } = calculateActionSentimentImpact(factionId, spinResult, comboMultiplier);

    if (impact !== 0) {
      const oldMood = newSentiment.factions[factionId].mood;
      newSentiment = updateFactionSentiment(
        newSentiment,
        factionId,
        impact,
        actionName,
        reason,
        currentTurn
      );
      const newMood = newSentiment.factions[factionId].mood;

      // Generate reaction message
      const reaction = generateFactionReaction(factionId, impact, oldMood, newMood, reason);
      if (reaction) {
        reactions.push(reaction);
      }
    }
  }

  // Update global momentum
  const avgMomentum = Object.values(newSentiment.factions)
    .reduce((sum, f) => sum + f.momentum, 0) / Object.keys(newSentiment.factions).length;
  newSentiment.globalMomentum = avgMomentum;

  return { newSentiment, reactions };
}

// ================================
// FACTION REACTIONS (UI FEEDBACK)
// ================================

export interface FactionReaction {
  factionId: string;
  factionName: string;
  message: string;
  impact: number;
  moodChange?: { from: MoodLevel; to: MoodLevel };
  icon: string;
}

export const FACTION_DISPLAY_NAMES: Record<string, string> = {
  'tech-elite': 'Tech Elite',
  'rural-heartland': 'Rural Heartland',
  'urban-progressive': 'Urban Progressives',
  'corporate-establishment': 'Corporate Establishment',
  'media-influencers': 'Media Influencers',
  'grassroots-activists': 'Grassroots Activists',
};

const POSITIVE_REACTIONS = [
  "This is exactly what we needed!",
  "Now we're talking!",
  "Finally, someone who gets it.",
  "Our people are energized!",
  "The momentum is building!",
  "This resonates with our base.",
];

const NEGATIVE_REACTIONS = [
  "This is a betrayal of our values.",
  "We're losing faith in this campaign.",
  "Our supporters are walking away.",
  "This isn't what we signed up for.",
  "The base is furious.",
  "We can't support this direction.",
];

const MOOD_CHANGE_MESSAGES: Record<string, string> = {
  'ENGAGED_to_ENTHUSIASTIC': "🔥 {faction} is FIRED UP!",
  'APATHETIC_to_ENGAGED': "👍 {faction} is back in the game!",
  'HOSTILE_to_APATHETIC': "😐 {faction} is cooling down.",
  'ENTHUSIASTIC_to_ENGAGED': "📉 {faction} enthusiasm is fading.",
  'ENGAGED_to_APATHETIC': "😐 {faction} is losing interest.",
  'APATHETIC_to_HOSTILE': "😤 {faction} has turned HOSTILE!",
};

function generateFactionReaction(
  factionId: string,
  impact: number,
  oldMood: MoodLevel,
  newMood: MoodLevel,
  reason: string
): FactionReaction | null {
  // Only generate reactions for significant impacts
  if (Math.abs(impact) < 5) return null;

  const factionName = FACTION_DISPLAY_NAMES[factionId] || factionId;
  const isPositive = impact > 0;
  const moodInfo = getMoodInfo(newMood);

  let message: string;
  let moodChange: { from: MoodLevel; to: MoodLevel } | undefined;

  if (oldMood !== newMood) {
    // Mood changed - use special message
    const transitionKey = `${oldMood}_to_${newMood}`;
    message = MOOD_CHANGE_MESSAGES[transitionKey]?.replace('{faction}', factionName)
      || `${factionName}'s mood shifted to ${newMood}`;
    moodChange = { from: oldMood, to: newMood };
  } else {
    // Regular reaction
    const reactions = isPositive ? POSITIVE_REACTIONS : NEGATIVE_REACTIONS;
    message = `${factionName}: "${reactions[Math.floor(Math.random() * reactions.length)]}"`;
  }

  return {
    factionId,
    factionName,
    message,
    impact,
    moodChange,
    icon: moodInfo.icon,
  };
}

// ================================
// MOOD EFFECTS ON GAMEPLAY
// ================================

export function getSentimentEffectMultiplier(
  sentiment: SentimentState,
  targetFactionId?: string
): number {
  if (targetFactionId) {
    const faction = sentiment.factions[targetFactionId];
    if (faction) {
      return getMoodInfo(faction.mood).effectMultiplier;
    }
  }

  // Average across all factions
  const multipliers = Object.values(sentiment.factions)
    .map(f => getMoodInfo(f.mood).effectMultiplier);
  return multipliers.reduce((a, b) => a + b, 0) / multipliers.length;
}

export function getHostileFactions(sentiment: SentimentState): string[] {
  return Object.entries(sentiment.factions)
    .filter(([_, f]) => f.mood === 'HOSTILE')
    .map(([id, _]) => id);
}

export function getEnthusiasticFactions(sentiment: SentimentState): string[] {
  return Object.entries(sentiment.factions)
    .filter(([_, f]) => f.mood === 'ENTHUSIASTIC')
    .map(([id, _]) => id);
}

// ================================
// SENTIMENT-BASED EVENTS
// ================================

export interface SentimentEvent {
  id: string;
  title: string;
  description: string;
  trigger: 'hostile_faction' | 'enthusiastic_faction' | 'all_apathetic' | 'momentum_crash';
  factionId?: string;
  outcome: {
    supportDelta?: Record<string, number>;
    cloutDelta?: number;
    fundsDelta?: number;
    riskDelta?: number;
  };
}

export function checkSentimentEvents(sentiment: SentimentState, currentTurn: number): SentimentEvent | null {
  const hostileFactions = getHostileFactions(sentiment);
  const enthusiasticFactions = getEnthusiasticFactions(sentiment);

  // Hostile faction rebellion (happens after 3+ turns hostile)
  for (const factionId of hostileFactions) {
    const faction = sentiment.factions[factionId];
    if (faction.turnsInCurrentMood >= 3 && Math.random() < 0.3) {
      const factionName = FACTION_DISPLAY_NAMES[factionId];
      return {
        id: `hostile-rebellion-${factionId}`,
        title: `${factionName} Rebellion!`,
        description: `The ${factionName} have had enough. They're organizing against you, spreading negative press and pulling support.`,
        trigger: 'hostile_faction',
        factionId,
        outcome: {
          supportDelta: { random: -10 },
          riskDelta: 15,
          cloutDelta: -10,
        },
      };
    }
  }

  // Enthusiastic faction rally (bonus after 3+ turns enthusiastic)
  for (const factionId of enthusiasticFactions) {
    const faction = sentiment.factions[factionId];
    if (faction.turnsInCurrentMood >= 3 && Math.random() < 0.25) {
      const factionName = FACTION_DISPLAY_NAMES[factionId];
      return {
        id: `enthusiastic-rally-${factionId}`,
        title: `${factionName} Rally!`,
        description: `The ${factionName} are on fire! They're organizing spontaneous rallies and bringing in new supporters.`,
        trigger: 'enthusiastic_faction',
        factionId,
        outcome: {
          supportDelta: { random: 8 },
          cloutDelta: 15,
          fundsDelta: 25,
        },
      };
    }
  }

  // Momentum crash warning
  if (sentiment.globalMomentum < -30) {
    return {
      id: 'momentum-crash',
      title: 'Campaign Stalling!',
      description: 'Your coalition is fracturing. Multiple factions are losing faith in your movement.',
      trigger: 'momentum_crash',
      outcome: {
        riskDelta: 10,
      },
    };
  }

  return null;
}

// ================================
// ADVISOR WARNINGS
// ================================

export function generateSentimentWarnings(sentiment: SentimentState): string[] {
  const warnings: string[] = [];

  for (const [factionId, faction] of Object.entries(sentiment.factions)) {
    const factionName = FACTION_DISPLAY_NAMES[factionId];

    if (faction.mood === 'HOSTILE') {
      warnings.push(`⚠️ ${factionName} is HOSTILE - they may sabotage your campaign!`);
    } else if (faction.mood === 'APATHETIC' && faction.turnsInCurrentMood >= 2) {
      warnings.push(`😐 ${factionName} is losing interest - engage them soon!`);
    } else if (faction.momentum < -50) {
      warnings.push(`📉 ${factionName} momentum is crashing - consider their priorities.`);
    }
  }

  if (sentiment.globalMomentum < 0) {
    warnings.push(`🌡️ Overall campaign momentum is negative. Rally your base!`);
  }

  return warnings;
}

// ================================
// DECAY OVER TIME
// ================================

export function applySentimentDecay(sentiment: SentimentState, currentTurn: number): SentimentState {
  // Sentiment naturally drifts toward neutral (ENGAGED) over time
  const decayRate = 0.02; // 2% drift per turn
  let newSentiment = { ...sentiment };

  for (const [factionId, faction] of Object.entries(sentiment.factions)) {
    const targetMomentum = 30; // Neutral-positive
    const drift = (targetMomentum - faction.momentum) * decayRate;
    const newMomentum = faction.momentum + drift;
    const newMood = getMoodFromMomentum(newMomentum);

    newSentiment = {
      ...newSentiment,
      factions: {
        ...newSentiment.factions,
        [factionId]: {
          ...faction,
          momentum: newMomentum,
          mood: newMood,
          turnsInCurrentMood: newMood === faction.mood
            ? faction.turnsInCurrentMood + 1
            : 0,
        },
      },
    };
  }

  return newSentiment;
}
