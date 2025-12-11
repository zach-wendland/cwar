// politicalFactions.ts - 3 playable political factions for multiplayer
// MAGA vs America First vs Liberals

export type PoliticalFactionId = 'maga' | 'america_first' | 'liberal';

export interface PoliticalFaction {
  id: PoliticalFactionId;
  name: string;
  fullName: string;
  description: string;
  color: string;
  icon: string;

  // Starting resources
  startingClout: number;
  startingFunds: number;
  startingRisk: number;

  // Stronghold states (start with bonus support)
  strongholdStates: string[];
  strongholdBonus: number;

  // Action modifiers: { costMultiplier, effectMultiplier, riskMultiplier }
  // < 1.0 = cheaper/better, > 1.0 = more expensive/worse
  actionModifiers: {
    [actionId: string]: {
      costMultiplier: number;
      effectMultiplier: number;
      riskMultiplier: number;
    };
  };

  // Unique faction abilities
  abilities: FactionAbility[];

  // Victory conditions (first to meet any wins)
  victoryConditions: VictoryCondition[];
}

export interface FactionAbility {
  id: string;
  name: string;
  description: string;
  cooldownTurns: number;
  unlockThreshold: number; // Min average support to unlock
  effect: AbilityEffect;
}

export type AbilityEffect =
  | { type: 'support_boost'; states: 'random' | 'stronghold' | 'all'; amount: number; count?: number }
  | { type: 'sabotage'; target: 'opponent' | 'leader'; effect: 'steal_support' | 'increase_risk' | 'drain_clout'; amount: number }
  | { type: 'buff'; duration: number; effect: 'double_gains' | 'half_risk' | 'immunity' };

export interface VictoryCondition {
  type: 'support_threshold' | 'state_count' | 'economic';
  requirement: number;
  description: string;
}

// ================================
// THE THREE FACTIONS
// ================================

export const MAGA: PoliticalFaction = {
  id: 'maga',
  name: 'MAGA',
  fullName: 'Make America Great Again',
  description: 'Rally-focused populists who energize the base through direct action and high-energy events.',
  color: '#dc2626', // red-600
  icon: '🦅',

  startingClout: 60,
  startingFunds: 80,
  startingRisk: 10,

  strongholdStates: [
    'TX', 'FL', 'OH', 'TN', 'KY', 'WV', 'OK', 'AL', 'MS', 'LA',
    'AR', 'MO', 'KS', 'NE', 'SD', 'ND', 'WY', 'ID', 'MT', 'SC'
  ],
  strongholdBonus: 25,

  actionModifiers: {
    // Strengths
    rally: { costMultiplier: 0.7, effectMultiplier: 1.5, riskMultiplier: 0.8 },
    meme_campaign: { costMultiplier: 1.0, effectMultiplier: 1.3, riskMultiplier: 1.0 },
    debate: { costMultiplier: 1.0, effectMultiplier: 1.2, riskMultiplier: 0.8 },
    fundraise: { costMultiplier: 1.0, effectMultiplier: 1.2, riskMultiplier: 1.0 },
    // Weaknesses
    legal_fund: { costMultiplier: 1.5, effectMultiplier: 0.7, riskMultiplier: 1.0 },
    platform_hop: { costMultiplier: 1.3, effectMultiplier: 0.7, riskMultiplier: 1.2 },
    hashtag: { costMultiplier: 1.2, effectMultiplier: 0.9, riskMultiplier: 1.0 },
    // Neutral
    podcast: { costMultiplier: 1.0, effectMultiplier: 1.1, riskMultiplier: 1.0 },
    canvass: { costMultiplier: 1.1, effectMultiplier: 0.9, riskMultiplier: 1.0 },
    influencer: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
    bot_army: { costMultiplier: 0.9, effectMultiplier: 1.1, riskMultiplier: 1.1 },
  },

  abilities: [
    {
      id: 'rally_surge',
      name: 'Rally Surge',
      description: 'Trigger spontaneous rallies in 5 random states, gaining +15% support each.',
      cooldownTurns: 5,
      unlockThreshold: 40,
      effect: { type: 'support_boost', states: 'random', amount: 15, count: 5 }
    },
    {
      id: 'energize_base',
      name: 'Energize the Base',
      description: 'Double all support gains in stronghold states for 3 turns.',
      cooldownTurns: 8,
      unlockThreshold: 55,
      effect: { type: 'buff', duration: 3, effect: 'double_gains' }
    }
  ],

  victoryConditions: [
    { type: 'support_threshold', requirement: 65, description: 'Achieve 65% average national support' },
    { type: 'state_count', requirement: 30, description: 'Control 30+ states (plurality support)' }
  ]
};

export const AMERICA_FIRST: PoliticalFaction = {
  id: 'america_first',
  name: 'America First',
  fullName: 'America First Coalition',
  description: 'Strategic coalition builders who excel at swing state targeting and grassroots organization.',
  color: '#1d4ed8', // blue-700
  icon: '🎯',

  startingClout: 50,
  startingFunds: 120,
  startingRisk: 5,

  strongholdStates: [
    'PA', 'MI', 'WI', 'AZ', 'GA', 'NC', 'NV', 'NH', 'IA', 'ME',
    'CO', 'VA', 'MN'
  ],
  strongholdBonus: 20,

  actionModifiers: {
    // Strengths
    canvass: { costMultiplier: 0.6, effectMultiplier: 1.4, riskMultiplier: 0.7 },
    podcast: { costMultiplier: 0.8, effectMultiplier: 1.3, riskMultiplier: 0.9 },
    influencer: { costMultiplier: 0.9, effectMultiplier: 1.2, riskMultiplier: 0.9 },
    legal_fund: { costMultiplier: 0.8, effectMultiplier: 1.3, riskMultiplier: 1.0 },
    // Weaknesses
    bot_army: { costMultiplier: 1.2, effectMultiplier: 0.8, riskMultiplier: 1.3 },
    meme_campaign: { costMultiplier: 1.1, effectMultiplier: 0.9, riskMultiplier: 1.0 },
    // Neutral
    rally: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
    hashtag: { costMultiplier: 1.0, effectMultiplier: 1.1, riskMultiplier: 1.0 },
    debate: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
    fundraise: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
    platform_hop: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
  },

  abilities: [
    {
      id: 'swing_state_blitz',
      name: 'Swing State Blitz',
      description: 'Triple support gains in all stronghold (swing) states for 2 turns.',
      cooldownTurns: 6,
      unlockThreshold: 35,
      effect: { type: 'buff', duration: 2, effect: 'double_gains' } // Actually triples for strongholds
    },
    {
      id: 'coalition_builder',
      name: 'Coalition Builder',
      description: 'Steal 5% support from the leading opponent in contested states.',
      cooldownTurns: 7,
      unlockThreshold: 50,
      effect: { type: 'sabotage', target: 'leader', effect: 'steal_support', amount: 5 }
    }
  ],

  victoryConditions: [
    { type: 'support_threshold', requirement: 60, description: 'Achieve 60% average national support' },
    { type: 'state_count', requirement: 26, description: 'Control 26+ states (electoral majority)' }
  ]
};

export const LIBERAL: PoliticalFaction = {
  id: 'liberal',
  name: 'Liberals',
  fullName: 'Progressive Alliance',
  description: 'Tech-savvy progressives who dominate social media and coastal urban centers.',
  color: '#7c3aed', // violet-600
  icon: '🌊',

  startingClout: 70,
  startingFunds: 100,
  startingRisk: 15,

  strongholdStates: [
    'CA', 'NY', 'WA', 'OR', 'MA', 'CT', 'NJ', 'IL', 'MD', 'VT',
    'HI', 'DE', 'RI', 'NM'
  ],
  strongholdBonus: 30,

  actionModifiers: {
    // Strengths
    meme_campaign: { costMultiplier: 0.7, effectMultiplier: 1.4, riskMultiplier: 0.9 },
    hashtag: { costMultiplier: 0.6, effectMultiplier: 1.5, riskMultiplier: 0.8 },
    bot_army: { costMultiplier: 0.8, effectMultiplier: 1.3, riskMultiplier: 1.0 },
    platform_hop: { costMultiplier: 0.7, effectMultiplier: 1.2, riskMultiplier: 0.8 },
    influencer: { costMultiplier: 0.8, effectMultiplier: 1.3, riskMultiplier: 0.9 },
    // Weaknesses
    rally: { costMultiplier: 1.3, effectMultiplier: 0.8, riskMultiplier: 1.2 },
    canvass: { costMultiplier: 1.2, effectMultiplier: 0.8, riskMultiplier: 1.0 },
    fundraise: { costMultiplier: 1.1, effectMultiplier: 0.9, riskMultiplier: 1.0 },
    // Neutral
    podcast: { costMultiplier: 1.0, effectMultiplier: 1.1, riskMultiplier: 1.0 },
    debate: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
    legal_fund: { costMultiplier: 1.0, effectMultiplier: 1.0, riskMultiplier: 1.0 },
  },

  abilities: [
    {
      id: 'viral_moment',
      name: 'Viral Moment',
      description: 'A post goes mega-viral! +10% support in all coastal stronghold states.',
      cooldownTurns: 5,
      unlockThreshold: 35,
      effect: { type: 'support_boost', states: 'stronghold', amount: 10 }
    },
    {
      id: 'cancel_campaign',
      name: 'Cancel Campaign',
      description: 'Target an opponent: increase their risk by 20% and drain 30 clout.',
      cooldownTurns: 8,
      unlockThreshold: 50,
      effect: { type: 'sabotage', target: 'opponent', effect: 'increase_risk', amount: 20 }
    }
  ],

  victoryConditions: [
    { type: 'support_threshold', requirement: 60, description: 'Achieve 60% average national support' },
    { type: 'economic', requirement: 500, description: 'Accumulate 500+ funds while maintaining 50% support' }
  ]
};

// All factions array for iteration
export const POLITICAL_FACTIONS: PoliticalFaction[] = [MAGA, AMERICA_FIRST, LIBERAL];

// Lookup by ID
export const POLITICAL_FACTIONS_MAP: Record<PoliticalFactionId, PoliticalFaction> = {
  maga: MAGA,
  america_first: AMERICA_FIRST,
  liberal: LIBERAL,
};

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Get faction by ID
 */
export function getPoliticalFaction(id: PoliticalFactionId): PoliticalFaction {
  return POLITICAL_FACTIONS_MAP[id];
}

/**
 * Get action modifiers for a faction's action
 */
export function getActionModifiers(
  factionId: PoliticalFactionId,
  actionId: string
): { costMultiplier: number; effectMultiplier: number; riskMultiplier: number } {
  const faction = getPoliticalFaction(factionId);
  return faction.actionModifiers[actionId] || {
    costMultiplier: 1.0,
    effectMultiplier: 1.0,
    riskMultiplier: 1.0,
  };
}

/**
 * Calculate adjusted action cost for a faction
 */
export function getAdjustedCost(
  factionId: PoliticalFactionId,
  actionId: string,
  baseCost: { funds?: number; clout?: number }
): { funds?: number; clout?: number } {
  const modifiers = getActionModifiers(factionId, actionId);
  return {
    funds: baseCost.funds ? Math.round(baseCost.funds * modifiers.costMultiplier) : undefined,
    clout: baseCost.clout ? Math.round(baseCost.clout * modifiers.costMultiplier) : undefined,
  };
}

/**
 * Check if a state is in a faction's stronghold
 */
export function isStrongholdState(factionId: PoliticalFactionId, stateCode: string): boolean {
  const faction = getPoliticalFaction(factionId);
  return faction.strongholdStates.includes(stateCode);
}

/**
 * Get all swing states (appear in America First's strongholds)
 */
export function getSwingStates(): string[] {
  return AMERICA_FIRST.strongholdStates;
}

/**
 * Initialize territory support for 3-faction game
 */
export function initializeMultiplayerTerritories(): Record<string, TerritorySupport> {
  const allStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const territories: Record<string, TerritorySupport> = {};

  allStates.forEach(stateCode => {
    // Calculate starting support based on strongholds
    let magaSupport = 33;
    let afSupport = 33;
    let libSupport = 34;

    if (MAGA.strongholdStates.includes(stateCode)) {
      magaSupport += MAGA.strongholdBonus;
      afSupport -= 10;
      libSupport -= 15;
    }
    if (AMERICA_FIRST.strongholdStates.includes(stateCode)) {
      afSupport += AMERICA_FIRST.strongholdBonus;
      magaSupport -= 8;
      libSupport -= 12;
    }
    if (LIBERAL.strongholdStates.includes(stateCode)) {
      libSupport += LIBERAL.strongholdBonus;
      magaSupport -= 15;
      afSupport -= 10;
    }

    // Normalize to ensure non-negative
    magaSupport = Math.max(5, magaSupport);
    afSupport = Math.max(5, afSupport);
    libSupport = Math.max(5, libSupport);

    territories[stateCode] = {
      maga: magaSupport,
      america_first: afSupport,
      liberal: libSupport,
    };
  });

  return territories;
}

export interface TerritorySupport {
  maga: number;
  america_first: number;
  liberal: number;
}

/**
 * Determine who controls a state (plurality winner)
 */
export function getStateController(
  support: TerritorySupport
): PoliticalFactionId | 'contested' {
  const max = Math.max(support.maga, support.america_first, support.liberal);
  const margin = 5; // Must lead by 5% to "control"

  if (support.maga >= max && support.maga - support.america_first >= margin && support.maga - support.liberal >= margin) {
    return 'maga';
  }
  if (support.america_first >= max && support.america_first - support.maga >= margin && support.america_first - support.liberal >= margin) {
    return 'america_first';
  }
  if (support.liberal >= max && support.liberal - support.maga >= margin && support.liberal - support.america_first >= margin) {
    return 'liberal';
  }

  return 'contested';
}

/**
 * Count states controlled by each faction
 */
export function countControlledStates(
  territories: Record<string, TerritorySupport>
): Record<PoliticalFactionId | 'contested', number> {
  const counts: Record<PoliticalFactionId | 'contested', number> = {
    maga: 0,
    america_first: 0,
    liberal: 0,
    contested: 0,
  };

  Object.values(territories).forEach(support => {
    const controller = getStateController(support);
    counts[controller]++;
  });

  return counts;
}

/**
 * Calculate average national support for a faction
 */
export function getAverageSupport(
  factionId: PoliticalFactionId,
  territories: Record<string, TerritorySupport>
): number {
  const values = Object.values(territories).map(t => t[factionId]);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Check if a faction has met any victory condition
 */
export function checkVictoryCondition(
  factionId: PoliticalFactionId,
  territories: Record<string, TerritorySupport>,
  funds: number
): VictoryCondition | null {
  const faction = getPoliticalFaction(factionId);
  const avgSupport = getAverageSupport(factionId, territories);
  const controlledCount = countControlledStates(territories)[factionId];

  for (const condition of faction.victoryConditions) {
    switch (condition.type) {
      case 'support_threshold':
        if (avgSupport >= condition.requirement) return condition;
        break;
      case 'state_count':
        if (controlledCount >= condition.requirement) return condition;
        break;
      case 'economic':
        if (funds >= condition.requirement && avgSupport >= 50) return condition;
        break;
    }
  }

  return null;
}

/**
 * Get trilinear color blend for a state based on faction support
 */
export function getTerritoryColor(support: TerritorySupport): string {
  const total = support.maga + support.america_first + support.liberal;
  if (total === 0) return 'rgb(128, 128, 128)';

  const mW = support.maga / total;
  const aW = support.america_first / total;
  const lW = support.liberal / total;

  // MAGA: Red (#dc2626 = 220, 38, 38)
  // AF: Blue (#1d4ed8 = 29, 78, 216)
  // Liberal: Purple (#7c3aed = 124, 58, 237)
  const r = Math.round(220 * mW + 29 * aW + 124 * lW);
  const g = Math.round(38 * mW + 78 * aW + 58 * lW);
  const b = Math.round(38 * mW + 216 * aW + 237 * lW);

  return `rgb(${r}, ${g}, ${b})`;
}
