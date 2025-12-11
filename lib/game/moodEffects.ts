// moodEffects.ts - How faction moods affect gameplay outcomes
// Enthusiastic factions boost you, hostile factions sabotage you

import { GameState, EventOutcome } from './GameContext';
import { SentimentState, MoodLevel, getMoodInfo, FACTION_INTERESTS, FACTION_DISPLAY_NAMES } from './sentimentEngine';
import { SpinResult } from './spinSystem';

// ================================
// SUPPORT MODIFIER BASED ON MOOD
// ================================

/**
 * Modifies support gains based on faction sentiment
 * Enthusiastic: +30% effectiveness
 * Engaged: Normal
 * Apathetic: -30% effectiveness
 * Hostile: -60% effectiveness
 */
export function applySentimentToSupportChange(
  baseSupportDelta: Record<string, number>,
  sentiment: SentimentState,
  targetRegion?: string
): Record<string, number> {
  const modifiedDelta: Record<string, number> = {};

  // Get average mood multiplier
  const avgMultiplier = Object.values(sentiment.factions)
    .reduce((sum, f) => sum + getMoodInfo(f.mood).effectMultiplier, 0)
    / Object.keys(sentiment.factions).length;

  for (const [state, delta] of Object.entries(baseSupportDelta)) {
    // Apply mood multiplier only to positive changes
    // Negative changes (backlash) are not reduced by good mood
    if (delta > 0) {
      modifiedDelta[state] = Math.round(delta * avgMultiplier);
    } else {
      modifiedDelta[state] = delta;
    }
  }

  return modifiedDelta;
}

// ================================
// RISK MODIFIER BASED ON HOSTILE FACTIONS
// ================================

/**
 * Hostile factions increase risk of actions
 * Each hostile faction adds +2 risk to every action
 */
export function getHostileFactionRiskPenalty(sentiment: SentimentState): number {
  const hostileCount = Object.values(sentiment.factions)
    .filter(f => f.mood === 'HOSTILE').length;
  return hostileCount * 2;
}

// ================================
// COST MODIFIER BASED ON SENTIMENT
// ================================

/**
 * Enthusiastic factions can reduce costs through volunteer support
 * Returns a multiplier (e.g., 0.9 = 10% discount)
 */
export function getSentimentCostMultiplier(sentiment: SentimentState): number {
  const enthusiasticCount = Object.values(sentiment.factions)
    .filter(f => f.mood === 'ENTHUSIASTIC').length;

  // 5% discount per enthusiastic faction, max 20%
  const discount = Math.min(0.20, enthusiasticCount * 0.05);
  return 1 - discount;
}

// ================================
// CRITICAL HIT MODIFIER
// ================================

/**
 * Enthusiastic factions increase critical hit chance
 * Each enthusiastic faction adds +2% crit chance
 */
export function getSentimentCritBonus(sentiment: SentimentState): number {
  const enthusiasticCount = Object.values(sentiment.factions)
    .filter(f => f.mood === 'ENTHUSIASTIC').length;
  return enthusiasticCount * 2;
}

// ================================
// COMBO MODIFIER BASED ON FACTION ALIGNMENT
// ================================

/**
 * If a spin targets themes a faction loves and they're enthusiastic,
 * bonus multiplier to combo effects
 */
export function getFactionAlignmentBonus(
  spinResult: SpinResult,
  sentiment: SentimentState
): { bonus: number; reason: string | null } {
  const allTags = [
    ...spinResult.action.tags,
    ...spinResult.modifier.tags,
    ...spinResult.target.tags,
  ];

  let maxBonus = 0;
  let bonusFaction: string | null = null;

  for (const [factionId, interests] of Object.entries(FACTION_INTERESTS)) {
    const faction = sentiment.factions[factionId];
    if (!faction || faction.mood !== 'ENTHUSIASTIC') continue;

    // Count how many "loved" tags are in this spin
    const lovedCount = allTags.filter(tag => interests.loves.includes(tag)).length;

    if (lovedCount >= 2 && lovedCount > maxBonus) {
      maxBonus = lovedCount;
      bonusFaction = factionId;
    }
  }

  if (maxBonus >= 2 && bonusFaction) {
    const factionName = FACTION_DISPLAY_NAMES[bonusFaction] || bonusFaction;
    return {
      bonus: 0.25 * (maxBonus - 1), // +25% per extra loved tag above 2
      reason: `${factionName} LOVES this approach! (+${Math.round(25 * (maxBonus - 1))}% bonus)`,
    };
  }

  return { bonus: 0, reason: null };
}

// ================================
// HOSTILE FACTION SABOTAGE EVENTS
// ================================

export interface SabotageEvent {
  factionId: string;
  factionName: string;
  type: 'leak' | 'protest' | 'smear' | 'boycott';
  title: string;
  description: string;
  outcome: EventOutcome;
}

const SABOTAGE_EVENTS: Record<string, SabotageEvent[]> = {
  'tech-elite': [
    {
      factionId: 'tech-elite',
      factionName: 'Tech Elite',
      type: 'leak',
      title: 'Data Leak!',
      description: 'Silicon Valley insiders leaked embarrassing internal campaign data. Your digital strategy is exposed.',
      outcome: { riskDelta: 12, cloutDelta: -15 },
    },
    {
      factionId: 'tech-elite',
      factionName: 'Tech Elite',
      type: 'boycott',
      title: 'Tech Boycott',
      description: 'Major tech platforms are "deprioritizing" your content. Reach is down significantly.',
      outcome: { supportDelta: { random: -5 }, cloutDelta: -10 },
    },
  ],
  'rural-heartland': [
    {
      factionId: 'rural-heartland',
      factionName: 'Rural Heartland',
      type: 'protest',
      title: 'Heartland Protest',
      description: 'Angry farmers and rural workers are blocking your campaign events. Local news is covering it extensively.',
      outcome: { riskDelta: 10, supportDelta: { random: -8 } },
    },
  ],
  'urban-progressive': [
    {
      factionId: 'urban-progressive',
      factionName: 'Urban Progressives',
      type: 'smear',
      title: 'Progressive Backlash',
      description: 'Activist groups are running a coordinated social media campaign against you. #Cancelled is trending.',
      outcome: { cloutDelta: -20, riskDelta: 8 },
    },
  ],
  'corporate-establishment': [
    {
      factionId: 'corporate-establishment',
      factionName: 'Corporate Establishment',
      type: 'boycott',
      title: 'Donor Revolt',
      description: 'Major donors are pulling funding and redirecting to your opponents.',
      outcome: { fundsDelta: -50, cloutDelta: -10 },
    },
  ],
  'media-influencers': [
    {
      factionId: 'media-influencers',
      factionName: 'Media Influencers',
      type: 'smear',
      title: 'Influencer Pile-On',
      description: 'Coordinated negative coverage from influencers. Your messaging is being mocked everywhere.',
      outcome: { cloutDelta: -25, supportDelta: { random: -5 } },
    },
  ],
  'grassroots-activists': [
    {
      factionId: 'grassroots-activists',
      factionName: 'Grassroots Activists',
      type: 'protest',
      title: 'Activist Disruption',
      description: 'Former supporters are now disrupting your events and organizing counter-protests.',
      outcome: { riskDelta: 15, cloutDelta: -10 },
    },
  ],
};

/**
 * Check if a hostile faction triggers a sabotage event
 * 10% chance per turn per hostile faction (after 2+ turns hostile)
 */
export function checkForSabotage(sentiment: SentimentState): SabotageEvent | null {
  for (const [factionId, faction] of Object.entries(sentiment.factions)) {
    if (faction.mood === 'HOSTILE' && faction.turnsInCurrentMood >= 2) {
      if (Math.random() < 0.10) {
        const events = SABOTAGE_EVENTS[factionId];
        if (events && events.length > 0) {
          return events[Math.floor(Math.random() * events.length)];
        }
      }
    }
  }
  return null;
}

// ================================
// ENTHUSIASTIC FACTION BONUSES
// ================================

export interface FactionBonus {
  factionId: string;
  factionName: string;
  type: 'volunteers' | 'donations' | 'viral' | 'endorsement';
  title: string;
  description: string;
  outcome: EventOutcome;
}

const FACTION_BONUSES: Record<string, FactionBonus[]> = {
  'tech-elite': [
    {
      factionId: 'tech-elite',
      factionName: 'Tech Elite',
      type: 'viral',
      title: 'Tech Boost!',
      description: 'Tech insiders are signal-boosting your content. Algorithmic reach is through the roof!',
      outcome: { cloutDelta: 20, supportDelta: { random: 5 } },
    },
  ],
  'rural-heartland': [
    {
      factionId: 'rural-heartland',
      factionName: 'Rural Heartland',
      type: 'volunteers',
      title: 'Heartland Volunteers',
      description: 'Rural communities are organizing massive canvassing efforts. Word of mouth is spreading!',
      outcome: { supportDelta: { midwest: 10 }, cloutDelta: 10 },
    },
  ],
  'urban-progressive': [
    {
      factionId: 'urban-progressive',
      factionName: 'Urban Progressives',
      type: 'viral',
      title: 'Progressive Surge',
      description: 'Urban activists are dominating social media discourse. Your message is everywhere!',
      outcome: { cloutDelta: 15, supportDelta: { coastal: 8 } },
    },
  ],
  'corporate-establishment': [
    {
      factionId: 'corporate-establishment',
      factionName: 'Corporate Establishment',
      type: 'donations',
      title: 'Corporate Support',
      description: 'Major donors are opening their checkbooks. The war chest is growing!',
      outcome: { fundsDelta: 75, cloutDelta: 10 },
    },
  ],
  'media-influencers': [
    {
      factionId: 'media-influencers',
      factionName: 'Media Influencers',
      type: 'endorsement',
      title: 'Influencer Endorsements',
      description: 'Major influencers are promoting your campaign. Engagement is skyrocketing!',
      outcome: { cloutDelta: 30, supportDelta: { random: 5 } },
    },
  ],
  'grassroots-activists': [
    {
      factionId: 'grassroots-activists',
      factionName: 'Grassroots Activists',
      type: 'volunteers',
      title: 'Grassroots Mobilization',
      description: 'True believers are knocking on doors across the country. The movement is spreading organically!',
      outcome: { supportDelta: { random: 10 }, riskDelta: -5 },
    },
  ],
};

/**
 * Check if an enthusiastic faction provides a bonus event
 * 15% chance per turn per enthusiastic faction (after 3+ turns enthusiastic)
 */
export function checkForFactionBonus(sentiment: SentimentState): FactionBonus | null {
  for (const [factionId, faction] of Object.entries(sentiment.factions)) {
    if (faction.mood === 'ENTHUSIASTIC' && faction.turnsInCurrentMood >= 3) {
      if (Math.random() < 0.15) {
        const bonuses = FACTION_BONUSES[factionId];
        if (bonuses && bonuses.length > 0) {
          return bonuses[Math.floor(Math.random() * bonuses.length)];
        }
      }
    }
  }
  return null;
}

// ================================
// SENTIMENT SUMMARY FOR UI
// ================================

export interface SentimentSummary {
  overallMood: 'positive' | 'neutral' | 'negative';
  enthusiasticCount: number;
  hostileCount: number;
  effectMultiplier: number;
  costMultiplier: number;
  riskPenalty: number;
  critBonus: number;
  warnings: string[];
}

export function getSentimentSummary(sentiment: SentimentState): SentimentSummary {
  const factions = Object.values(sentiment.factions);
  const enthusiasticCount = factions.filter(f => f.mood === 'ENTHUSIASTIC').length;
  const hostileCount = factions.filter(f => f.mood === 'HOSTILE').length;
  const apatheticCount = factions.filter(f => f.mood === 'APATHETIC').length;

  let overallMood: 'positive' | 'neutral' | 'negative';
  if (enthusiasticCount >= 2 && hostileCount === 0) {
    overallMood = 'positive';
  } else if (hostileCount >= 2 || sentiment.globalMomentum < -20) {
    overallMood = 'negative';
  } else {
    overallMood = 'neutral';
  }

  const avgMultiplier = factions
    .reduce((sum, f) => sum + getMoodInfo(f.mood).effectMultiplier, 0) / factions.length;

  const warnings: string[] = [];
  if (hostileCount > 0) {
    warnings.push(`${hostileCount} faction${hostileCount > 1 ? 's' : ''} hostile - expect sabotage!`);
  }
  if (apatheticCount >= 3) {
    warnings.push('Multiple factions losing interest - diversify your approach!');
  }

  return {
    overallMood,
    enthusiasticCount,
    hostileCount,
    effectMultiplier: avgMultiplier,
    costMultiplier: getSentimentCostMultiplier(sentiment),
    riskPenalty: getHostileFactionRiskPenalty(sentiment),
    critBonus: getSentimentCritBonus(sentiment),
    warnings,
  };
}
