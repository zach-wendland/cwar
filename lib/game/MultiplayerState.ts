// MultiplayerState.ts - State interfaces for 3-player async multiplayer

import { Advisor } from './GameContext';
import { PoliticalFactionId, TerritorySupport } from './politicalFactions';

// ================================
// PLAYER STATE
// ================================

export interface MultiplayerPlayerState {
  playerId: string;
  displayName: string;
  faction: PoliticalFactionId;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';

  // Resources
  clout: number;
  funds: number;
  risk: number;

  // Advisors (faction-themed)
  advisors: Advisor[];

  // Ability cooldowns: { abilityId: turnsRemaining }
  abilityCooldowns: Record<string, number>;

  // Gamification
  streak: number;
  totalCriticalHits: number;

  // Turn state
  hasSubmittedAction: boolean;
  submittedAction?: SubmittedAction;

  // Connection (for async)
  lastActiveAt: number;
  isConnected: boolean;
}

export interface SubmittedAction {
  actionId: string;
  targetStates?: string[];
  useAbility?: string;
  abilityTarget?: PoliticalFactionId;
  submittedAt: number;
}

// ================================
// TERRITORY STATE
// ================================

export interface TerritoryState {
  stateCode: string;
  support: TerritorySupport;
  controller: PoliticalFactionId | 'contested';
  isSwingState: boolean;
  electoralVotes: number;
}

// Electoral votes per state (simplified)
export const ELECTORAL_VOTES: Record<string, number> = {
  CA: 54, TX: 40, FL: 30, NY: 28, PA: 19, IL: 19, OH: 17, GA: 16,
  NC: 16, MI: 15, NJ: 14, VA: 13, WA: 12, AZ: 11, MA: 11, TN: 11,
  IN: 11, MD: 10, MN: 10, MO: 10, WI: 10, CO: 10, AL: 9, SC: 9,
  LA: 8, KY: 8, OR: 8, OK: 7, CT: 7, IA: 6, UT: 6, NV: 6, AR: 6,
  MS: 6, KS: 6, NM: 5, NE: 5, WV: 4, ID: 4, HI: 4, NH: 4, ME: 4,
  MT: 4, RI: 4, DE: 3, SD: 3, ND: 3, AK: 3, VT: 3, WY: 3
};

// ================================
// SHARED GAME STATE
// ================================

export interface MultiplayerGameState {
  // Match metadata
  roomCode: string;
  matchId: string;
  createdAt: number;
  startedAt?: number;

  // Game configuration
  maxTurns: number;
  turnTimeoutMinutes: number; // 0 = no timeout (async)

  // Current state
  currentTurn: number;
  status: 'waiting' | 'faction_select' | 'in_progress' | 'completed';
  winner?: PoliticalFactionId;
  winCondition?: string;

  // Players (keyed by faction)
  players: {
    maga?: MultiplayerPlayerState;
    america_first?: MultiplayerPlayerState;
    liberal?: MultiplayerPlayerState;
  };

  // Territories
  territories: Record<string, TerritoryState>;

  // Public news log
  newsLog: NewsEntry[];

  // Social feed (reactions from all factions)
  socialFeed: SocialPost[];

  // Global events affecting all players
  pendingGlobalEvent?: GlobalEvent;
  resolvedEvents: GlobalEvent[];

  // Turn resolution
  lastTurnResolution?: TurnResolution;
}

// ================================
// NEWS & SOCIAL
// ================================

export interface NewsEntry {
  turn: number;
  timestamp: number;
  faction: PoliticalFactionId;
  message: string;
  isPublic: boolean; // Visible to all players
}

export interface SocialPost {
  id: string;
  faction: PoliticalFactionId;
  handle: string;
  content: string;
  timestamp: number;
  type: 'support' | 'attack' | 'neutral';
}

// ================================
// EVENTS
// ================================

export interface GlobalEvent {
  id: string;
  turn: number;
  title: string;
  description: string;
  category: 'economic' | 'political' | 'cultural' | 'media' | 'tech';

  // Effects on all factions
  globalEffects?: {
    supportDelta?: number;
    fundsDelta?: number;
    riskDelta?: number;
  };

  // Per-faction response options (if interactive)
  isInteractive: boolean;
  factionResponses?: Record<PoliticalFactionId, {
    chosen?: number;
    options: EventOption[];
  }>;

  resolved: boolean;
}

export interface EventOption {
  text: string;
  outcome: {
    supportDelta?: number | Record<string, number>;
    fundsDelta?: number;
    cloutDelta?: number;
    riskDelta?: number;
    message: string;
  };
}

// ================================
// TURN RESOLUTION
// ================================

export interface TurnResolution {
  turn: number;
  resolvedAt: number;

  // Actions taken by each faction
  actions: {
    faction: PoliticalFactionId;
    actionId: string;
    wasCritical: boolean;
    effects: ActionEffects;
  }[];

  // Abilities used
  abilitiesUsed: {
    faction: PoliticalFactionId;
    abilityId: string;
    target?: PoliticalFactionId;
    effects: string;
  }[];

  // Territory changes
  territoryChanges: {
    stateCode: string;
    before: TerritorySupport;
    after: TerritorySupport;
    newController?: PoliticalFactionId | 'contested';
  }[];

  // Events triggered
  eventsTriggered: string[];
}

export interface ActionEffects {
  statesAffected: string[];
  supportChanges: Record<string, number>;
  resourceChanges: {
    clout?: number;
    funds?: number;
    risk?: number;
  };
  message: string;
}

// ================================
// ROOM / LOBBY
// ================================

export interface Room {
  code: string;
  createdAt: number;
  hostPlayerId: string;
  status: 'waiting' | 'faction_select' | 'in_progress' | 'completed';

  // Slots
  slots: {
    maga?: RoomSlot;
    america_first?: RoomSlot;
    liberal?: RoomSlot;
  };

  // Game settings
  settings: RoomSettings;
}

export interface RoomSlot {
  playerId: string;
  displayName: string;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isReady: boolean;
}

export interface RoomSettings {
  maxTurns: number;
  allowBots: boolean;
  botDifficulty: 'easy' | 'medium' | 'hard';
  botFillTimeout: number; // Seconds before bots fill empty slots (0 = never)
}

// ================================
// SESSION (localStorage)
// ================================

export interface LocalSession {
  sessionId: string;
  displayName: string;
  createdAt: number;

  // Current game
  currentRoomCode?: string;
  currentFaction?: PoliticalFactionId;

  // History
  matchHistory: MatchHistoryEntry[];

  // Progression (carried from single-player)
  legacyPoints: number;
  totalVictories: number;
  totalGames: number;
}

export interface MatchHistoryEntry {
  matchId: string;
  roomCode: string;
  faction: PoliticalFactionId;
  result: 'win' | 'loss' | 'draw';
  finalSupport: number;
  statesControlled: number;
  turns: number;
  playedAt: number;
  opponents: {
    faction: PoliticalFactionId;
    displayName: string;
    isBot: boolean;
  }[];
}

// ================================
// HELPERS
// ================================

/**
 * Create initial player state for a faction
 */
export function createPlayerState(
  playerId: string,
  displayName: string,
  faction: PoliticalFactionId,
  isBot: boolean = false,
  botDifficulty?: 'easy' | 'medium' | 'hard'
): MultiplayerPlayerState {
  // Import dynamically to avoid circular deps
  const { getPoliticalFaction } = require('./politicalFactions');
  const factionData = getPoliticalFaction(faction);

  return {
    playerId,
    displayName,
    faction,
    isBot,
    botDifficulty,
    clout: factionData.startingClout,
    funds: factionData.startingFunds,
    risk: factionData.startingRisk,
    advisors: [], // Generated separately
    abilityCooldowns: {},
    streak: 0,
    totalCriticalHits: 0,
    hasSubmittedAction: false,
    lastActiveAt: Date.now(),
    isConnected: !isBot,
  };
}

/**
 * Create initial territory state from support values
 */
export function createTerritoryState(
  stateCode: string,
  support: TerritorySupport
): TerritoryState {
  const { getStateController, getSwingStates } = require('./politicalFactions');

  return {
    stateCode,
    support,
    controller: getStateController(support),
    isSwingState: getSwingStates().includes(stateCode),
    electoralVotes: ELECTORAL_VOTES[stateCode] || 3,
  };
}

/**
 * Generate room code (6 alphanumeric chars)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Check if all players have submitted actions
 */
export function allPlayersReady(state: MultiplayerGameState): boolean {
  const players = Object.values(state.players).filter(Boolean) as MultiplayerPlayerState[];
  if (players.length < 3) return false;
  return players.every(p => p.hasSubmittedAction);
}

/**
 * Get player by faction
 */
export function getPlayer(
  state: MultiplayerGameState,
  faction: PoliticalFactionId
): MultiplayerPlayerState | undefined {
  return state.players[faction];
}

/**
 * Count active (non-eliminated) players
 */
export function countActivePlayers(state: MultiplayerGameState): number {
  return Object.values(state.players)
    .filter(p => p && p.risk < 100)
    .length;
}

/**
 * Check if player is eliminated (risk >= 100)
 */
export function isEliminated(player: MultiplayerPlayerState): boolean {
  return player.risk >= 100;
}

/**
 * Get leaderboard (sorted by average support)
 */
export function getLeaderboard(
  state: MultiplayerGameState
): { faction: PoliticalFactionId; avgSupport: number; statesControlled: number }[] {
  const { getAverageSupport, countControlledStates } = require('./politicalFactions');

  const territories = Object.fromEntries(
    Object.entries(state.territories).map(([code, t]) => [code, t.support])
  );
  const counts = countControlledStates(territories);

  const factions: PoliticalFactionId[] = ['maga', 'america_first', 'liberal'];
  return factions
    .map(faction => ({
      faction,
      avgSupport: getAverageSupport(faction, territories),
      statesControlled: counts[faction],
    }))
    .sort((a, b) => b.avgSupport - a.avgSupport);
}
