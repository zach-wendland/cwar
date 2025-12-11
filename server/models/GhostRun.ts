// GhostRun.ts - Data model for recorded game runs (ghost battles)

import { SpinResult } from '../../lib/game/spinSystem';
import { ComboResult } from '../../lib/game/comboEngine';

// ================================
// GHOST RUN TYPES
// ================================

export interface GhostAction {
  turn: number;
  type: 'SPIN_ACTION' | 'PERFORM_ACTION' | 'RESOLVE_EVENT';
  // For SPIN_ACTION
  spinResult?: {
    actionId: string;
    modifierId: string;
    targetId: string;
  };
  comboMultiplier?: number;
  // For PERFORM_ACTION (classic mode)
  actionId?: string;
  // For RESOLVE_EVENT
  optionIndex?: number;
  // State snapshot after action
  snapshot: GhostStateSnapshot;
}

export interface GhostStateSnapshot {
  turn: number;
  funds: number;
  clout: number;
  risk: number;
  avgSupport: number;
  streak: number;
}

export interface GhostRun {
  id: string;
  playerId: string;
  playerName: string;
  createdAt: string;
  // Game result
  victory: boolean;
  victoryType?: string;
  defeatType?: string;
  finalTurn: number;
  finalSupport: number;
  finalFunds: number;
  finalClout: number;
  finalRisk: number;
  // Player stats
  elo: number;
  league: LeagueTier;
  season: number;
  // Action replay data
  actions: GhostAction[];
  // Metadata
  totalCombos: number;
  bestComboMultiplier: number;
  totalCriticalHits: number;
}

// ================================
// LEAGUE SYSTEM
// ================================

export type LeagueTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'LEGEND';

export interface LeagueInfo {
  tier: LeagueTier;
  division: number; // 1-4 within each tier
  points: number; // 0-100 to next division
  rank: number; // Global rank
}

export const LEAGUE_THRESHOLDS: Record<LeagueTier, { minElo: number; color: string; icon: string }> = {
  BRONZE: { minElo: 0, color: '#CD7F32', icon: '🥉' },
  SILVER: { minElo: 1200, color: '#C0C0C0', icon: '🥈' },
  GOLD: { minElo: 1500, color: '#FFD700', icon: '🥇' },
  DIAMOND: { minElo: 1800, color: '#B9F2FF', icon: '💎' },
  LEGEND: { minElo: 2200, color: '#FF6B6B', icon: '👑' },
};

export function getLeagueTier(elo: number): LeagueTier {
  if (elo >= 2200) return 'LEGEND';
  if (elo >= 1800) return 'DIAMOND';
  if (elo >= 1500) return 'GOLD';
  if (elo >= 1200) return 'SILVER';
  return 'BRONZE';
}

export function getLeagueInfo(elo: number, rank: number): LeagueInfo {
  const tier = getLeagueTier(elo);
  const thresholds = LEAGUE_THRESHOLDS[tier];
  const nextTierElo = tier === 'LEGEND' ? Infinity :
    tier === 'DIAMOND' ? 2200 :
    tier === 'GOLD' ? 1800 :
    tier === 'SILVER' ? 1500 : 1200;

  const tierRange = nextTierElo - thresholds.minElo;
  const progress = elo - thresholds.minElo;
  const division = Math.min(4, Math.floor((progress / tierRange) * 4) + 1);
  const divisionRange = tierRange / 4;
  const divisionProgress = progress % divisionRange;
  const points = Math.floor((divisionProgress / divisionRange) * 100);

  return { tier, division, points, rank };
}

// ================================
// ELO CALCULATION
// ================================

const K_FACTOR = 32; // Standard ELO K-factor

export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  playerWon: boolean
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = playerWon ? 1 : 0;
  return Math.round(K_FACTOR * (actualScore - expectedScore));
}

// ================================
// MATCH RESULT
// ================================

export interface MatchResult {
  matchId: string;
  playerId: string;
  opponentId: string;
  playerWon: boolean;
  // Victory conditions
  playerVictoryTurn?: number;
  opponentVictoryTurn?: number;
  playerFinalSupport: number;
  opponentFinalSupport: number;
  // ELO changes
  playerEloBefore: number;
  playerEloAfter: number;
  eloChange: number;
  // League changes
  leagueBefore: LeagueInfo;
  leagueAfter: LeagueInfo;
  promoted: boolean;
  demoted: boolean;
}

// ================================
// IN-MEMORY STORAGE (Replace with DB in production)
// ================================

// Simple in-memory storage for demo purposes
export const ghostRunStorage: Map<string, GhostRun> = new Map();
export const playerEloStorage: Map<string, number> = new Map();
export const matchHistoryStorage: Map<string, MatchResult[]> = new Map();

// Initialize with some sample ghost runs for testing
export function initializeSampleGhosts(): void {
  const sampleGhost: GhostRun = {
    id: 'ghost-sample-1',
    playerId: 'bot-easy',
    playerName: 'Tutorial Bot',
    createdAt: new Date().toISOString(),
    victory: true,
    victoryType: 'POPULAR_MANDATE',
    finalTurn: 35,
    finalSupport: 82,
    finalFunds: 150,
    finalClout: 120,
    finalRisk: 45,
    elo: 1000,
    league: 'BRONZE',
    season: 1,
    actions: generateSampleActions(35),
    totalCombos: 8,
    bestComboMultiplier: 2.5,
    totalCriticalHits: 3,
  };

  ghostRunStorage.set(sampleGhost.id, sampleGhost);
  playerEloStorage.set('bot-easy', 1000);
}

// Generate sample actions for testing
function generateSampleActions(turns: number): GhostAction[] {
  const actions: GhostAction[] = [];
  let funds = 100, clout = 50, risk = 0, support = 5;

  for (let turn = 1; turn <= turns; turn++) {
    // Simple bot logic: alternate between safe actions
    const actionTypes = ['meme', 'fundraise', 'rally', 'podcast', 'canvass'];
    const modifiers = ['grassroots', 'mainstream', 'viral'];
    const targets = ['national', 'midwest', 'swing'];

    const actionId = actionTypes[turn % actionTypes.length];
    const modifierId = modifiers[turn % modifiers.length];
    const targetId = targets[turn % targets.length];

    // Simulate state changes
    support = Math.min(100, support + Math.random() * 3);
    funds = Math.max(0, funds + (Math.random() > 0.5 ? 20 : -15));
    clout = Math.max(0, clout + (Math.random() > 0.3 ? 5 : -2));
    risk = Math.min(99, risk + Math.random() * 3);

    actions.push({
      turn,
      type: 'SPIN_ACTION',
      spinResult: { actionId, modifierId, targetId },
      comboMultiplier: Math.random() > 0.7 ? 1.5 + Math.random() : 1,
      snapshot: {
        turn,
        funds: Math.round(funds),
        clout: Math.round(clout),
        risk: Math.round(risk),
        avgSupport: Math.round(support),
        streak: Math.floor(Math.random() * 5),
      },
    });
  }

  return actions;
}

// Initialize samples on module load
initializeSampleGhosts();
