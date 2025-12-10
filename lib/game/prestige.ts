// prestige.ts - Prestige/rebirth system for meta-progression

import { GameState } from './GameContext';

// Legacy Points calculation based on final game stats
export interface LegacyCalculation {
  basePoints: number;         // Base for winning
  turnBonus: number;          // Bonus for fast wins
  streakBonus: number;        // Bonus for high streak
  criticalBonus: number;      // Bonus for critical hits
  riskBonus: number;          // Bonus for low ending risk
  factionBonus: number;       // Bonus for faction support
  total: number;
}

// Prestige unlocks that can be purchased
export interface PrestigeUnlock {
  id: string;
  name: string;
  description: string;
  cost: number;               // Legacy points to unlock
  effect: PrestigeEffect;
  icon: string;
}

// Types of prestige effects
export type PrestigeEffect =
  | { type: 'starting_clout'; amount: number }
  | { type: 'starting_funds'; amount: number }
  | { type: 'starting_support'; amount: number }
  | { type: 'action_cost_reduction'; actionId: string; percent: number }
  | { type: 'critical_chance_bonus'; percent: number }
  | { type: 'streak_bonus_increase'; percent: number }
  | { type: 'risk_reduction'; percent: number }
  | { type: 'faction_bonus'; factionId: string; percent: number };

// Persistent prestige data (stored in localStorage)
export interface PrestigeData {
  totalLegacyPoints: number;
  spentLegacyPoints: number;
  totalVictories: number;
  fastestVictory: number;
  highestStreak: number;
  unlockedUpgrades: string[];
  prestigeLevel: number;      // Total number of prestiges
}

// Default prestige data for new players
export const defaultPrestigeData: PrestigeData = {
  totalLegacyPoints: 0,
  spentLegacyPoints: 0,
  totalVictories: 0,
  fastestVictory: Infinity,
  highestStreak: 0,
  unlockedUpgrades: [],
  prestigeLevel: 0,
};

// Calculate legacy points earned from a victory
export function calculateLegacyPoints(state: GameState): LegacyCalculation {
  const basePoints = 100;  // Base for any victory

  // Turn bonus: faster wins earn more (max 100 bonus for < 10 turns)
  let turnBonus = 0;
  if (state.turn < 10) turnBonus = 100;
  else if (state.turn < 15) turnBonus = 75;
  else if (state.turn < 20) turnBonus = 50;
  else if (state.turn < 30) turnBonus = 25;
  else turnBonus = Math.max(0, 50 - state.turn);

  // Streak bonus: high streaks earn more (5 points per streak level)
  const streakBonus = state.highestStreak * 5;

  // Critical hit bonus: 10 points per critical hit
  const criticalBonus = state.totalCriticalHits * 10;

  // Risk bonus: lower ending risk earns more (up to 50)
  const riskBonus = Math.max(0, 50 - Math.floor(state.risk / 2));

  // Faction bonus: average faction support over 50 earns bonus
  const factionValues = Object.values(state.factionSupport || {});
  const avgFaction = factionValues.length > 0
    ? factionValues.reduce((a, b) => a + b, 0) / factionValues.length
    : 50;
  const factionBonus = Math.max(0, Math.floor((avgFaction - 50) * 2));

  const total = basePoints + turnBonus + streakBonus + criticalBonus + riskBonus + factionBonus;

  return {
    basePoints,
    turnBonus,
    streakBonus,
    criticalBonus,
    riskBonus,
    factionBonus,
    total,
  };
}

// Available prestige upgrades
export const prestigeUpgrades: PrestigeUnlock[] = [
  // Starting Resources
  {
    id: 'extra_clout_1',
    name: 'Veteran Speaker',
    description: 'Start with +15 Clout',
    cost: 50,
    effect: { type: 'starting_clout', amount: 15 },
    icon: '🎤',
  },
  {
    id: 'extra_clout_2',
    name: 'Media Darling',
    description: 'Start with +30 Clout',
    cost: 150,
    effect: { type: 'starting_clout', amount: 30 },
    icon: '📺',
  },
  {
    id: 'extra_funds_1',
    name: 'Seed Money',
    description: 'Start with +$50 Funds',
    cost: 50,
    effect: { type: 'starting_funds', amount: 50 },
    icon: '💵',
  },
  {
    id: 'extra_funds_2',
    name: 'PAC Connections',
    description: 'Start with +$100 Funds',
    cost: 150,
    effect: { type: 'starting_funds', amount: 100 },
    icon: '💰',
  },
  {
    id: 'extra_support_1',
    name: 'Name Recognition',
    description: 'Start with +3% support in all states',
    cost: 100,
    effect: { type: 'starting_support', amount: 3 },
    icon: '📢',
  },
  {
    id: 'extra_support_2',
    name: 'Grassroots Network',
    description: 'Start with +5% support in all states',
    cost: 250,
    effect: { type: 'starting_support', amount: 5 },
    icon: '🌱',
  },

  // Action Improvements
  {
    id: 'cheaper_memes',
    name: 'Meme Factory',
    description: 'Meme Campaign costs 20% less clout',
    cost: 75,
    effect: { type: 'action_cost_reduction', actionId: 'meme_campaign', percent: 20 },
    icon: '🖼️',
  },
  {
    id: 'cheaper_rallies',
    name: 'Event Planner',
    description: 'Rally costs 20% less funds',
    cost: 75,
    effect: { type: 'action_cost_reduction', actionId: 'rally', percent: 20 },
    icon: '📋',
  },
  {
    id: 'cheaper_influencer',
    name: 'Industry Contacts',
    description: 'Influencer Partnership costs 25% less',
    cost: 100,
    effect: { type: 'action_cost_reduction', actionId: 'influencer', percent: 25 },
    icon: '🤝',
  },

  // Luck & Bonuses
  {
    id: 'lucky_1',
    name: 'Lucky Star',
    description: '+3% critical hit chance',
    cost: 100,
    effect: { type: 'critical_chance_bonus', percent: 3 },
    icon: '⭐',
  },
  {
    id: 'lucky_2',
    name: 'Fortune Favors',
    description: '+5% critical hit chance',
    cost: 200,
    effect: { type: 'critical_chance_bonus', percent: 5 },
    icon: '🍀',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Streak bonuses are 25% stronger',
    cost: 150,
    effect: { type: 'streak_bonus_increase', percent: 25 },
    icon: '🔥',
  },

  // Risk Management
  {
    id: 'risk_reducer_1',
    name: 'PR Training',
    description: 'All risk increases reduced by 10%',
    cost: 125,
    effect: { type: 'risk_reduction', percent: 10 },
    icon: '🛡️',
  },
  {
    id: 'risk_reducer_2',
    name: 'Crisis Management',
    description: 'All risk increases reduced by 20%',
    cost: 300,
    effect: { type: 'risk_reduction', percent: 20 },
    icon: '🏰',
  },

  // Faction Bonuses
  {
    id: 'tech_friend',
    name: 'Tech Insider',
    description: '+15% starting support with Tech Workers',
    cost: 100,
    effect: { type: 'faction_bonus', factionId: 'tech_workers', percent: 15 },
    icon: '💻',
  },
  {
    id: 'rural_friend',
    name: 'Heartland Roots',
    description: '+15% starting support with Rural Voters',
    cost: 100,
    effect: { type: 'faction_bonus', factionId: 'rural_voters', percent: 15 },
    icon: '🌾',
  },
  {
    id: 'youth_friend',
    name: 'Youth Appeal',
    description: '+15% starting support with Young Activists',
    cost: 100,
    effect: { type: 'faction_bonus', factionId: 'young_activists', percent: 15 },
    icon: '✊',
  },
  {
    id: 'moderate_friend',
    name: 'Bridge Builder',
    description: '+15% starting support with Moderates',
    cost: 100,
    effect: { type: 'faction_bonus', factionId: 'moderates', percent: 15 },
    icon: '⚖️',
  },
  {
    id: 'business_friend',
    name: 'Corporate Backing',
    description: '+15% starting support with Business Class',
    cost: 100,
    effect: { type: 'faction_bonus', factionId: 'business_class', percent: 15 },
    icon: '💼',
  },
];

// Load prestige data from localStorage
export function loadPrestigeData(): PrestigeData {
  if (typeof window === 'undefined') {
    return defaultPrestigeData;
  }
  const saved = localStorage.getItem('prestigeData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultPrestigeData, ...parsed };
    } catch {
      return defaultPrestigeData;
    }
  }
  return defaultPrestigeData;
}

// Save prestige data to localStorage
export function savePrestigeData(data: PrestigeData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('prestigeData', JSON.stringify(data));
}

// Purchase an upgrade
export function purchaseUpgrade(upgradeId: string, data: PrestigeData): PrestigeData | null {
  const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
  if (!upgrade) return null;

  const availablePoints = data.totalLegacyPoints - data.spentLegacyPoints;
  if (availablePoints < upgrade.cost) return null;

  if (data.unlockedUpgrades.includes(upgradeId)) return null;

  const newData: PrestigeData = {
    ...data,
    spentLegacyPoints: data.spentLegacyPoints + upgrade.cost,
    unlockedUpgrades: [...data.unlockedUpgrades, upgradeId],
  };

  savePrestigeData(newData);
  return newData;
}

// Process a prestige (after victory)
export function processPrestige(state: GameState, data: PrestigeData): PrestigeData {
  const legacy = calculateLegacyPoints(state);

  const newData: PrestigeData = {
    ...data,
    totalLegacyPoints: data.totalLegacyPoints + legacy.total,
    totalVictories: data.totalVictories + 1,
    fastestVictory: Math.min(data.fastestVictory, state.turn),
    highestStreak: Math.max(data.highestStreak, state.highestStreak),
    prestigeLevel: data.prestigeLevel + 1,
  };

  savePrestigeData(newData);
  return newData;
}

// Get active effects from unlocked upgrades
export function getActiveEffects(data: PrestigeData): PrestigeEffect[] {
  return data.unlockedUpgrades
    .map(id => prestigeUpgrades.find(u => u.id === id))
    .filter((u): u is PrestigeUnlock => u !== undefined)
    .map(u => u.effect);
}

// Calculate starting bonuses from prestige
export function getStartingBonuses(data: PrestigeData): {
  clout: number;
  funds: number;
  support: number;
  factionBonuses: { [factionId: string]: number };
} {
  const effects = getActiveEffects(data);
  let clout = 0;
  let funds = 0;
  let support = 0;
  const factionBonuses: { [factionId: string]: number } = {};

  effects.forEach(effect => {
    switch (effect.type) {
      case 'starting_clout':
        clout += effect.amount;
        break;
      case 'starting_funds':
        funds += effect.amount;
        break;
      case 'starting_support':
        support += effect.amount;
        break;
      case 'faction_bonus':
        factionBonuses[effect.factionId] = (factionBonuses[effect.factionId] || 0) + effect.percent;
        break;
    }
  });

  return { clout, funds, support, factionBonuses };
}

// Get prestige level title
export function getPrestigeTitle(level: number): string {
  if (level === 0) return 'Newcomer';
  if (level === 1) return 'Apprentice';
  if (level < 5) return 'Campaigner';
  if (level < 10) return 'Strategist';
  if (level < 20) return 'Mastermind';
  if (level < 50) return 'Legend';
  return 'Culture Deity';
}
