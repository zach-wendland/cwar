// dailyChallenge.ts - Daily challenge system with login streaks
// Deterministic daily challenges with constraints and rewards

import { GameState } from './GameContext';
import { SpinResult } from './spinSystem';
import { ComboResult } from './comboEngine';

// ================================
// TYPES
// ================================

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'brutal';

export type ConstraintType =
  | 'banned_tags'      // Cannot use spins with these tags
  | 'required_tags'    // Every spin must include one of these tags
  | 'max_risk'         // Cannot exceed this risk level
  | 'min_combos'       // Must achieve X combos
  | 'no_rerolls'       // Cannot reroll
  | 'speed_run'        // Must win within X turns
  | 'limited_funds'    // Start with reduced funds
  | 'limited_clout';   // Start with reduced clout

export type GoalType =
  | 'victory'              // Win the game
  | 'support_threshold'    // Reach X% average support
  | 'faction_enthusiastic' // Get X factions to enthusiastic
  | 'no_hostile'           // Win without any hostile factions
  | 'streak'               // Achieve X action streak
  | 'low_risk_win'         // Win with risk below X
  | 'speed_victory';       // Win in X turns or less

export interface ChallengeConstraint {
  type: ConstraintType;
  value: string[] | number;
  description: string;
}

export interface ChallengeGoal {
  type: GoalType;
  value: number;
  description: string;
}

export interface ChallengeReward {
  prestige: number;
  clout: number;
  funds: number;
  title?: string;  // Unlockable title
}

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  difficulty: ChallengeDifficulty;
  constraints: ChallengeConstraint[];
  goal: ChallengeGoal;
  reward: ChallengeReward;
  dateKey: string;  // YYYY-MM-DD format
}

export interface DailyProgress {
  dateKey: string;
  challengeId: string;
  started: boolean;
  completed: boolean;
  bestAttempt?: {
    support: number;
    risk: number;
    turns: number;
  };
}

export interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;  // YYYY-MM-DD
  totalLogins: number;
  rewardsCollected: number[];  // Day indices (0-6) collected this week
}

// ================================
// CHALLENGE TEMPLATES
// ================================

const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id' | 'dateKey'>[] = [
  // EASY CHALLENGES
  {
    name: 'Grassroots Only',
    description: 'Win using only grassroots campaign tactics. No corporate money!',
    difficulty: 'easy',
    constraints: [
      { type: 'banned_tags', value: ['corporate', 'establishment', 'elite'], description: 'No corporate tactics' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win the campaign' },
    reward: { prestige: 10, clout: 25, funds: 0 },
  },
  {
    name: 'Digital Warrior',
    description: 'Dominate the online sphere. Only digital actions allowed.',
    difficulty: 'easy',
    constraints: [
      { type: 'required_tags', value: ['digital', 'viral', 'tech'], description: 'Digital tactics only' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win the campaign' },
    reward: { prestige: 10, clout: 25, funds: 0 },
  },
  {
    name: 'Safe Player',
    description: 'Win without taking big risks. Keep risk below 50%.',
    difficulty: 'easy',
    constraints: [
      { type: 'max_risk', value: 50, description: 'Risk must stay below 50%' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win the campaign' },
    reward: { prestige: 10, clout: 20, funds: 50 },
  },

  // MEDIUM CHALLENGES
  {
    name: 'Combo Master',
    description: 'Chain together powerful combos to victory.',
    difficulty: 'medium',
    constraints: [
      { type: 'min_combos', value: 10, description: 'Achieve at least 10 combos' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win with 10+ combos' },
    reward: { prestige: 25, clout: 50, funds: 100 },
  },
  {
    name: 'Unity Campaign',
    description: 'Keep all factions happy. No hostile factions allowed!',
    difficulty: 'medium',
    constraints: [],
    goal: { type: 'no_hostile', value: 1, description: 'Win without any hostile factions' },
    reward: { prestige: 25, clout: 40, funds: 75 },
  },
  {
    name: 'Coalition Builder',
    description: 'Build an enthusiastic coalition. Get 3 factions fired up!',
    difficulty: 'medium',
    constraints: [],
    goal: { type: 'faction_enthusiastic', value: 3, description: 'Get 3 factions to ENTHUSIASTIC' },
    reward: { prestige: 30, clout: 50, funds: 100 },
  },
  {
    name: 'No Second Chances',
    description: 'Win without using any rerolls. First spin is final!',
    difficulty: 'medium',
    constraints: [
      { type: 'no_rerolls', value: 1, description: 'No rerolls allowed' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win without rerolling' },
    reward: { prestige: 20, clout: 60, funds: 0 },
  },

  // HARD CHALLENGES
  {
    name: 'Speed Run',
    description: 'Win in 30 turns or less. No time to waste!',
    difficulty: 'hard',
    constraints: [
      { type: 'speed_run', value: 30, description: 'Win within 30 turns' }
    ],
    goal: { type: 'speed_victory', value: 30, description: 'Win in 30 turns' },
    reward: { prestige: 50, clout: 75, funds: 150 },
  },
  {
    name: 'Landslide Victory',
    description: 'Achieve a commanding lead. Win with 90%+ average support.',
    difficulty: 'hard',
    constraints: [],
    goal: { type: 'support_threshold', value: 90, description: 'Reach 90% average support' },
    reward: { prestige: 50, clout: 100, funds: 200 },
  },
  {
    name: 'Underdog Story',
    description: 'Start with limited resources but still claim victory.',
    difficulty: 'hard',
    constraints: [
      { type: 'limited_funds', value: 25, description: 'Start with only $25' },
      { type: 'limited_clout', value: 10, description: 'Start with only 10 clout' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win the campaign' },
    reward: { prestige: 60, clout: 50, funds: 250 },
  },

  // BRUTAL CHALLENGES
  {
    name: 'Flawless Campaign',
    description: 'Win with risk below 25%, all factions engaged or better, in under 40 turns.',
    difficulty: 'brutal',
    constraints: [
      { type: 'max_risk', value: 25, description: 'Risk must stay below 25%' },
      { type: 'speed_run', value: 40, description: 'Win within 40 turns' }
    ],
    goal: { type: 'no_hostile', value: 1, description: 'Win without any hostile or apathetic factions' },
    reward: { prestige: 100, clout: 150, funds: 500, title: 'Flawless Strategist' },
  },
  {
    name: 'The Impossible',
    description: 'Start with nothing. Build from zero.',
    difficulty: 'brutal',
    constraints: [
      { type: 'limited_funds', value: 0, description: 'Start with $0' },
      { type: 'limited_clout', value: 0, description: 'Start with 0 clout' },
      { type: 'no_rerolls', value: 1, description: 'No rerolls allowed' }
    ],
    goal: { type: 'victory', value: 1, description: 'Win the campaign' },
    reward: { prestige: 150, clout: 200, funds: 750, title: 'The Impossible' },
  },
];

// ================================
// DAILY CHALLENGE GENERATION
// ================================

/**
 * Get today's date key in YYYY-MM-DD format
 */
export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Deterministic seeded random based on date
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Convert to 0-1 range
  return Math.abs(Math.sin(hash)) % 1;
}

/**
 * Get today's daily challenge (deterministic based on date)
 */
export function getDailyChallenge(dateKey?: string): DailyChallenge {
  const key = dateKey || getTodayKey();
  const randomValue = seededRandom(key + '-challenge');

  // Pick template based on seeded random
  const templateIndex = Math.floor(randomValue * CHALLENGE_TEMPLATES.length);
  const template = CHALLENGE_TEMPLATES[templateIndex];

  return {
    ...template,
    id: `daily-${key}`,
    dateKey: key,
  };
}

/**
 * Check if today's challenge is available (not already completed)
 */
export function isChallengeAvailable(progress: DailyProgress | null): boolean {
  if (!progress) return true;

  const today = getTodayKey();
  if (progress.dateKey !== today) return true;

  return !progress.completed;
}

// ================================
// CONSTRAINT VALIDATION
// ================================

/**
 * Validate if a spin action meets challenge constraints
 */
export function validateSpinConstraints(
  challenge: DailyChallenge,
  spinResult: SpinResult,
  comboCount: number,
  rerollUsed: boolean
): { valid: boolean; violation?: string } {
  const allTags = [
    ...spinResult.action.tags,
    ...spinResult.modifier.tags,
    ...spinResult.target.tags,
  ];

  for (const constraint of challenge.constraints) {
    switch (constraint.type) {
      case 'banned_tags': {
        const banned = constraint.value as string[];
        const usedBanned = allTags.filter(tag => banned.includes(tag));
        if (usedBanned.length > 0) {
          return { valid: false, violation: `Used banned tag: ${usedBanned[0]}` };
        }
        break;
      }

      case 'required_tags': {
        const required = constraint.value as string[];
        const hasRequired = allTags.some(tag => required.includes(tag));
        if (!hasRequired) {
          return { valid: false, violation: `Spin must include: ${required.join(' or ')}` };
        }
        break;
      }

      case 'no_rerolls': {
        if (rerollUsed) {
          return { valid: false, violation: 'Rerolls not allowed in this challenge' };
        }
        break;
      }
    }
  }

  return { valid: true };
}

/**
 * Validate ongoing game state constraints
 */
export function validateGameStateConstraints(
  challenge: DailyChallenge,
  state: GameState
): { valid: boolean; violation?: string } {
  for (const constraint of challenge.constraints) {
    switch (constraint.type) {
      case 'max_risk': {
        const maxRisk = constraint.value as number;
        if (state.risk > maxRisk) {
          return { valid: false, violation: `Risk exceeded ${maxRisk}%` };
        }
        break;
      }

      case 'speed_run': {
        const maxTurns = constraint.value as number;
        if (state.turn > maxTurns && !state.victory) {
          return { valid: false, violation: `Turn limit exceeded (${maxTurns})` };
        }
        break;
      }
    }
  }

  return { valid: true };
}

// ================================
// GOAL CHECKING
// ================================

/**
 * Check if challenge goal is met
 */
export function checkChallengeGoal(
  challenge: DailyChallenge,
  state: GameState,
  comboCount: number
): { completed: boolean; progress: string } {
  const goal = challenge.goal;

  switch (goal.type) {
    case 'victory':
      return {
        completed: state.victory,
        progress: state.victory ? 'Victory!' : 'Win the campaign',
      };

    case 'support_threshold': {
      const avgSupport = Object.values(state.support).reduce((a, b) => a + b, 0) /
                         Object.keys(state.support).length;
      return {
        completed: avgSupport >= goal.value,
        progress: `${Math.round(avgSupport)}% / ${goal.value}% support`,
      };
    }

    case 'faction_enthusiastic': {
      const enthusiastic = Object.values(state.sentiment?.factions || {})
        .filter(f => f.mood === 'ENTHUSIASTIC').length;
      return {
        completed: enthusiastic >= goal.value,
        progress: `${enthusiastic} / ${goal.value} factions enthusiastic`,
      };
    }

    case 'no_hostile': {
      const hasHostile = Object.values(state.sentiment?.factions || {})
        .some(f => f.mood === 'HOSTILE');
      return {
        completed: state.victory && !hasHostile,
        progress: hasHostile ? 'Faction hostile!' : 'No hostile factions',
      };
    }

    case 'streak': {
      return {
        completed: state.streak >= goal.value,
        progress: `${state.streak} / ${goal.value} streak`,
      };
    }

    case 'low_risk_win': {
      return {
        completed: state.victory && state.risk < goal.value,
        progress: `Risk: ${state.risk}% (need < ${goal.value}%)`,
      };
    }

    case 'speed_victory': {
      return {
        completed: state.victory && state.turn <= goal.value,
        progress: `Turn ${state.turn} / ${goal.value}`,
      };
    }
  }
}

/**
 * Get initial state modifiers for challenge
 */
export function getChallengeStartModifiers(
  challenge: DailyChallenge
): { funds: number; clout: number } {
  let funds = 100;  // Default
  let clout = 50;   // Default

  for (const constraint of challenge.constraints) {
    if (constraint.type === 'limited_funds') {
      funds = constraint.value as number;
    }
    if (constraint.type === 'limited_clout') {
      clout = constraint.value as number;
    }
  }

  return { funds, clout };
}

// ================================
// LOGIN STREAK SYSTEM
// ================================

const STREAK_REWARDS: ChallengeReward[] = [
  { prestige: 5, clout: 10, funds: 25 },    // Day 1
  { prestige: 10, clout: 15, funds: 50 },   // Day 2
  { prestige: 15, clout: 20, funds: 75 },   // Day 3
  { prestige: 20, clout: 30, funds: 100 },  // Day 4
  { prestige: 25, clout: 40, funds: 125 },  // Day 5
  { prestige: 35, clout: 50, funds: 175 },  // Day 6
  { prestige: 50, clout: 75, funds: 250, title: 'Dedicated Campaigner' }, // Day 7
];

/**
 * Initialize a new login streak
 */
export function initializeLoginStreak(): LoginStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: '',
    totalLogins: 0,
    rewardsCollected: [],
  };
}

/**
 * Process a login and update streak
 */
export function processLogin(streak: LoginStreak): {
  updatedStreak: LoginStreak;
  reward: ChallengeReward | null;
  streakBroken: boolean;
} {
  const today = getTodayKey();

  // Already logged in today
  if (streak.lastLoginDate === today) {
    return { updatedStreak: streak, reward: null, streakBroken: false };
  }

  const yesterday = getYesterdayKey();
  const streakBroken = streak.lastLoginDate !== '' && streak.lastLoginDate !== yesterday;

  const newStreak: LoginStreak = {
    ...streak,
    lastLoginDate: today,
    totalLogins: streak.totalLogins + 1,
    currentStreak: streakBroken ? 1 : streak.currentStreak + 1,
    rewardsCollected: streakBroken ? [] : streak.rewardsCollected,
  };

  // Update longest streak
  if (newStreak.currentStreak > newStreak.longestStreak) {
    newStreak.longestStreak = newStreak.currentStreak;
  }

  // Calculate reward day (0-6, wrapping)
  const rewardDay = (newStreak.currentStreak - 1) % 7;

  // Check if reward already collected
  if (newStreak.rewardsCollected.includes(rewardDay)) {
    return { updatedStreak: newStreak, reward: null, streakBroken };
  }

  // Collect reward
  newStreak.rewardsCollected.push(rewardDay);
  const reward = STREAK_REWARDS[rewardDay];

  return { updatedStreak: newStreak, reward, streakBroken };
}

/**
 * Get yesterday's date key
 */
function getYesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

/**
 * Get streak reward for a specific day (0-6)
 */
export function getStreakReward(day: number): ChallengeReward {
  return STREAK_REWARDS[day % 7];
}

/**
 * Get current streak day (0-6)
 */
export function getCurrentStreakDay(streak: LoginStreak): number {
  return (streak.currentStreak - 1) % 7;
}

// ================================
// STORAGE HELPERS
// ================================

const DAILY_PROGRESS_KEY = 'dailyProgress';
const LOGIN_STREAK_KEY = 'loginStreak';

export function loadDailyProgress(): DailyProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(DAILY_PROGRESS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveDailyProgress(progress: DailyProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable
  }
}

export function loadLoginStreak(): LoginStreak {
  if (typeof window === 'undefined') return initializeLoginStreak();
  try {
    const saved = localStorage.getItem(LOGIN_STREAK_KEY);
    return saved ? JSON.parse(saved) : initializeLoginStreak();
  } catch {
    return initializeLoginStreak();
  }
}

export function saveLoginStreak(streak: LoginStreak): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGIN_STREAK_KEY, JSON.stringify(streak));
  } catch {
    // Storage full or unavailable
  }
}

// ================================
// DIFFICULTY HELPERS
// ================================

export function getDifficultyColor(difficulty: ChallengeDifficulty): string {
  switch (difficulty) {
    case 'easy': return '#22c55e';     // green
    case 'medium': return '#eab308';   // yellow
    case 'hard': return '#f97316';     // orange
    case 'brutal': return '#ef4444';   // red
  }
}

export function getDifficultyLabel(difficulty: ChallengeDifficulty): string {
  switch (difficulty) {
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'hard': return 'Hard';
    case 'brutal': return 'BRUTAL';
  }
}
