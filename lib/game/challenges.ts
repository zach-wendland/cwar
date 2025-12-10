// challenges.ts - Daily challenges system for retention

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  modifier: ChallengeModifier;
  bonusLegacy: number;  // Bonus legacy points for completing
  difficulty: 'easy' | 'medium' | 'hard';
}

export type ChallengeModifier =
  | { type: 'double_risk'; description: string }
  | { type: 'half_funds'; description: string }
  | { type: 'no_memes'; description: string }
  | { type: 'speed_run'; turns: number; description: string }
  | { type: 'high_risk_start'; amount: number; description: string }
  | { type: 'low_support_start'; amount: number; description: string }
  | { type: 'faction_focus'; factionId: string; threshold: number; description: string }
  | { type: 'no_bot_army'; description: string }
  | { type: 'limited_actions'; allowedActions: string[]; description: string }
  | { type: 'double_events'; description: string };

// Challenge templates
const challengeTemplates: DailyChallenge[] = [
  // Easy challenges
  {
    id: 'grassroots_only',
    name: 'Grassroots Movement',
    description: 'Win without using Bot Army or Influencer Partnership',
    icon: '🌱',
    modifier: { type: 'limited_actions', allowedActions: ['meme_campaign', 'fundraise', 'rally', 'podcast', 'hashtag', 'debate', 'canvass', 'legal_fund', 'platform_hop'], description: 'Bot Army and Influencer Partnership disabled' },
    bonusLegacy: 50,
    difficulty: 'easy',
  },
  {
    id: 'organic_growth',
    name: 'Organic Growth',
    description: 'Win without deploying bots',
    icon: '🌿',
    modifier: { type: 'no_bot_army', description: 'Bot Army action disabled' },
    bonusLegacy: 30,
    difficulty: 'easy',
  },
  {
    id: 'event_heavy',
    name: 'Chaos Mode',
    description: 'Events trigger twice as often',
    icon: '🎲',
    modifier: { type: 'double_events', description: 'Double event frequency' },
    bonusLegacy: 40,
    difficulty: 'easy',
  },

  // Medium challenges
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Win in 20 turns or less',
    icon: '⏱️',
    modifier: { type: 'speed_run', turns: 20, description: 'Win within 20 turns' },
    bonusLegacy: 75,
    difficulty: 'medium',
  },
  {
    id: 'budget_campaign',
    name: 'Budget Campaign',
    description: 'Win with funds generation halved',
    icon: '💸',
    modifier: { type: 'half_funds', description: 'All funds gains halved' },
    bonusLegacy: 60,
    difficulty: 'medium',
  },
  {
    id: 'risky_business',
    name: 'Risky Business',
    description: 'Start at 30% risk',
    icon: '⚠️',
    modifier: { type: 'high_risk_start', amount: 30, description: 'Start with 30% risk' },
    bonusLegacy: 65,
    difficulty: 'medium',
  },
  {
    id: 'underdog_story',
    name: 'Underdog Story',
    description: 'Start with 1% support in all states',
    icon: '🐕',
    modifier: { type: 'low_support_start', amount: 1, description: 'Start with only 1% support' },
    bonusLegacy: 70,
    difficulty: 'medium',
  },
  {
    id: 'tech_focus',
    name: 'Silicon Valley',
    description: 'Get Tech Workers to 80% support to win',
    icon: '💻',
    modifier: { type: 'faction_focus', factionId: 'tech_workers', threshold: 80, description: 'Requires 80% Tech Workers support' },
    bonusLegacy: 55,
    difficulty: 'medium',
  },
  {
    id: 'heartland_focus',
    name: 'Heartland Hero',
    description: 'Get Rural Voters to 80% support to win',
    icon: '🌾',
    modifier: { type: 'faction_focus', factionId: 'rural_voters', threshold: 80, description: 'Requires 80% Rural Voters support' },
    bonusLegacy: 55,
    difficulty: 'medium',
  },

  // Hard challenges
  {
    id: 'double_trouble',
    name: 'Double Trouble',
    description: 'All risk gains are doubled',
    icon: '🔥',
    modifier: { type: 'double_risk', description: 'All risk increases doubled' },
    bonusLegacy: 100,
    difficulty: 'hard',
  },
  {
    id: 'blitz_mode',
    name: 'Blitz Victory',
    description: 'Win in 10 turns or less',
    icon: '⚡',
    modifier: { type: 'speed_run', turns: 10, description: 'Win within 10 turns' },
    bonusLegacy: 150,
    difficulty: 'hard',
  },
  {
    id: 'danger_zone',
    name: 'Danger Zone',
    description: 'Start at 50% risk',
    icon: '☠️',
    modifier: { type: 'high_risk_start', amount: 50, description: 'Start with 50% risk' },
    bonusLegacy: 120,
    difficulty: 'hard',
  },
  {
    id: 'no_memes_allowed',
    name: 'Boomer Mode',
    description: 'Win without using meme campaigns',
    icon: '👴',
    modifier: { type: 'no_memes', description: 'Meme Campaign action disabled' },
    bonusLegacy: 80,
    difficulty: 'hard',
  },
];

// Daily challenge tracking
export interface DailyChallengeData {
  currentChallengeId: string | null;
  challengeDate: string;  // YYYY-MM-DD format
  completed: boolean;
  dailyStreak: number;
  lastCompletedDate: string | null;
  totalChallengesCompleted: number;
}

const defaultChallengeData: DailyChallengeData = {
  currentChallengeId: null,
  challengeDate: '',
  completed: false,
  dailyStreak: 0,
  lastCompletedDate: null,
  totalChallengesCompleted: 0,
};

// Get today's date as YYYY-MM-DD
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Generate a deterministic challenge for a given date
function getChallengForDate(dateString: string): DailyChallenge {
  // Use date string to create a seed
  const seed = dateString.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);

  // Use seed to select a challenge (deterministic)
  const index = seed % challengeTemplates.length;
  return challengeTemplates[index];
}

// Load challenge data from localStorage
export function loadChallengeData(): DailyChallengeData {
  if (typeof window === 'undefined') {
    return defaultChallengeData;
  }
  const saved = localStorage.getItem('dailyChallengeData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultChallengeData, ...parsed };
    } catch {
      return defaultChallengeData;
    }
  }
  return defaultChallengeData;
}

// Save challenge data to localStorage
export function saveChallengeData(data: DailyChallengeData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dailyChallengeData', JSON.stringify(data));
}

// Get today's challenge
export function getTodayChallenge(): DailyChallenge {
  const today = getTodayString();
  return getChallengForDate(today);
}

// Start today's challenge
export function startDailyChallenge(): DailyChallengeData {
  const today = getTodayString();
  const challenge = getTodayChallenge();
  const data = loadChallengeData();

  // Check if streak should be maintained
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  let newStreak = data.dailyStreak;
  if (data.lastCompletedDate !== yesterdayString && data.lastCompletedDate !== today) {
    newStreak = 0; // Reset streak if missed a day
  }

  const newData: DailyChallengeData = {
    ...data,
    currentChallengeId: challenge.id,
    challengeDate: today,
    completed: false,
    dailyStreak: newStreak,
  };

  saveChallengeData(newData);
  return newData;
}

// Complete today's challenge
export function completeDailyChallenge(): { data: DailyChallengeData; bonusLegacy: number } {
  const data = loadChallengeData();
  const today = getTodayString();
  const challenge = getTodayChallenge();

  if (data.completed || data.challengeDate !== today) {
    return { data, bonusLegacy: 0 };
  }

  // Calculate streak bonus (10% per day, max 50%)
  const streakMultiplier = 1 + Math.min(data.dailyStreak * 0.1, 0.5);
  const bonusLegacy = Math.round(challenge.bonusLegacy * streakMultiplier);

  const newData: DailyChallengeData = {
    ...data,
    completed: true,
    dailyStreak: data.dailyStreak + 1,
    lastCompletedDate: today,
    totalChallengesCompleted: data.totalChallengesCompleted + 1,
  };

  saveChallengeData(newData);
  return { data: newData, bonusLegacy };
}

// Check if challenge is active for current game
export function isChallengeActive(): boolean {
  const data = loadChallengeData();
  const today = getTodayString();
  return data.challengeDate === today && !data.completed && data.currentChallengeId !== null;
}

// Get challenge modifier for game initialization
export function getChallengeModifier(): ChallengeModifier | null {
  if (!isChallengeActive()) return null;
  const challenge = getTodayChallenge();
  return challenge.modifier;
}

// Check if an action is allowed by current challenge
export function isActionAllowed(actionId: string): boolean {
  const modifier = getChallengeModifier();
  if (!modifier) return true;

  switch (modifier.type) {
    case 'no_bot_army':
      return actionId !== 'bot_army';
    case 'no_memes':
      return actionId !== 'meme_campaign';
    case 'limited_actions':
      return modifier.allowedActions.includes(actionId);
    default:
      return true;
  }
}

// Get all challenge templates for display
export function getAllChallenges(): DailyChallenge[] {
  return challengeTemplates;
}

// Get difficulty color
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'hard': return 'text-red-400';
    default: return 'text-white';
  }
}
