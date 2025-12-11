// ghostRunner.ts - Client-side ghost replay engine for async battles

import { GhostRun, GhostAction, GhostStateSnapshot, LeagueTier, LEAGUE_THRESHOLDS } from '../../server/models/GhostRun';

// ================================
// GHOST BATTLE STATE
// ================================

export interface GhostBattleState {
  matchId: string;
  isActive: boolean;
  // Ghost opponent
  ghost: GhostRun | null;
  ghostCurrentTurn: number;
  ghostSnapshot: GhostStateSnapshot | null;
  // Battle progress
  playerAhead: boolean;
  turnDifference: number;
  // Result
  battleComplete: boolean;
  playerWon: boolean | null;
  winReason: string | null;
}

export const INITIAL_GHOST_BATTLE_STATE: GhostBattleState = {
  matchId: '',
  isActive: false,
  ghost: null,
  ghostCurrentTurn: 0,
  ghostSnapshot: null,
  playerAhead: false,
  turnDifference: 0,
  battleComplete: false,
  playerWon: null,
  winReason: null,
};

// ================================
// GHOST RUNNER CLASS
// ================================

export class GhostRunner {
  private ghost: GhostRun;
  private currentActionIndex: number = 0;
  private onUpdate: (snapshot: GhostStateSnapshot) => void;

  constructor(ghost: GhostRun, onUpdate: (snapshot: GhostStateSnapshot) => void) {
    this.ghost = ghost;
    this.onUpdate = onUpdate;
  }

  /**
   * Advance ghost to match player's turn
   */
  advanceToTurn(playerTurn: number): GhostStateSnapshot | null {
    // Find the action for this turn
    while (this.currentActionIndex < this.ghost.actions.length) {
      const action = this.ghost.actions[this.currentActionIndex];

      if (action.turn <= playerTurn) {
        this.currentActionIndex++;
        this.onUpdate(action.snapshot);

        if (action.turn === playerTurn) {
          return action.snapshot;
        }
      } else {
        break;
      }
    }

    // Return last known snapshot if we've run out of actions
    if (this.currentActionIndex > 0) {
      return this.ghost.actions[this.currentActionIndex - 1].snapshot;
    }

    return null;
  }

  /**
   * Get current ghost state
   */
  getCurrentSnapshot(): GhostStateSnapshot | null {
    if (this.currentActionIndex === 0) {
      return {
        turn: 0,
        funds: 100,
        clout: 50,
        risk: 0,
        avgSupport: 5,
        streak: 0,
      };
    }

    return this.ghost.actions[Math.min(this.currentActionIndex, this.ghost.actions.length) - 1]?.snapshot || null;
  }

  /**
   * Get action for specific turn
   */
  getActionForTurn(turn: number): GhostAction | null {
    return this.ghost.actions.find(a => a.turn === turn) || null;
  }

  /**
   * Check if ghost has reached victory
   */
  hasGhostWon(): boolean {
    return this.ghost.victory && this.currentActionIndex >= this.ghost.actions.length;
  }

  /**
   * Get ghost's victory turn (if any)
   */
  getVictoryTurn(): number | null {
    if (!this.ghost.victory) return null;
    return this.ghost.finalTurn;
  }

  /**
   * Reset runner to beginning
   */
  reset(): void {
    this.currentActionIndex = 0;
  }

  /**
   * Get ghost info for display
   */
  getGhostInfo(): {
    name: string;
    elo: number;
    league: LeagueTier;
    leagueColor: string;
    leagueIcon: string;
  } {
    const leagueInfo = LEAGUE_THRESHOLDS[this.ghost.league];
    return {
      name: this.ghost.playerName,
      elo: this.ghost.elo,
      league: this.ghost.league,
      leagueColor: leagueInfo.color,
      leagueIcon: leagueInfo.icon,
    };
  }
}

// ================================
// BATTLE COMPARISON
// ================================

export interface BattleComparison {
  playerTurn: number;
  ghostTurn: number;
  playerSupport: number;
  ghostSupport: number;
  playerFunds: number;
  ghostFunds: number;
  playerRisk: number;
  ghostRisk: number;
  playerAhead: boolean;
  supportDiff: number;
}

export function compareBattleStates(
  playerTurn: number,
  playerSupport: number,
  playerFunds: number,
  playerRisk: number,
  ghostSnapshot: GhostStateSnapshot | null
): BattleComparison {
  const ghostTurn = ghostSnapshot?.turn || 0;
  const ghostSupport = ghostSnapshot?.avgSupport || 5;
  const ghostFunds = ghostSnapshot?.funds || 100;
  const ghostRisk = ghostSnapshot?.risk || 0;

  return {
    playerTurn,
    ghostTurn,
    playerSupport,
    ghostSupport,
    playerFunds,
    ghostFunds,
    playerRisk,
    ghostRisk,
    playerAhead: playerSupport > ghostSupport,
    supportDiff: playerSupport - ghostSupport,
  };
}

// ================================
// BATTLE RESULT DETERMINATION
// ================================

export type BattleWinReason =
  | 'PLAYER_VICTORY_FIRST'
  | 'GHOST_VICTORY_FIRST'
  | 'PLAYER_HIGHER_SUPPORT'
  | 'GHOST_HIGHER_SUPPORT'
  | 'PLAYER_DEFEAT'
  | 'GHOST_DEFEAT'
  | 'TIE_PLAYER_WINS'; // Tie goes to player (home advantage)

export function determineBattleResult(
  playerVictory: boolean,
  playerDefeat: boolean,
  playerVictoryTurn: number | null,
  playerFinalSupport: number,
  ghost: GhostRun
): { playerWon: boolean; reason: BattleWinReason } {
  // If player achieved defeat, they lose
  if (playerDefeat) {
    return { playerWon: false, reason: 'PLAYER_DEFEAT' };
  }

  // If ghost had defeat in their run, player wins
  if (!ghost.victory && ghost.defeatType) {
    return { playerWon: true, reason: 'GHOST_DEFEAT' };
  }

  // If player achieved victory
  if (playerVictory && playerVictoryTurn !== null) {
    // Check if player got victory faster than ghost
    if (!ghost.victory || playerVictoryTurn < ghost.finalTurn) {
      return { playerWon: true, reason: 'PLAYER_VICTORY_FIRST' };
    }
    // Ghost got victory at same turn or faster
    if (ghost.finalTurn < playerVictoryTurn) {
      return { playerWon: false, reason: 'GHOST_VICTORY_FIRST' };
    }
    // Same turn - compare final support
    if (playerFinalSupport > ghost.finalSupport) {
      return { playerWon: true, reason: 'PLAYER_HIGHER_SUPPORT' };
    }
    if (playerFinalSupport < ghost.finalSupport) {
      return { playerWon: false, reason: 'GHOST_HIGHER_SUPPORT' };
    }
    // True tie - player wins (home advantage)
    return { playerWon: true, reason: 'TIE_PLAYER_WINS' };
  }

  // If ghost achieved victory but player didn't
  if (ghost.victory) {
    return { playerWon: false, reason: 'GHOST_VICTORY_FIRST' };
  }

  // Neither achieved victory - compare support at turn 50
  if (playerFinalSupport > ghost.finalSupport) {
    return { playerWon: true, reason: 'PLAYER_HIGHER_SUPPORT' };
  }
  if (playerFinalSupport < ghost.finalSupport) {
    return { playerWon: false, reason: 'GHOST_HIGHER_SUPPORT' };
  }

  // True tie
  return { playerWon: true, reason: 'TIE_PLAYER_WINS' };
}

// ================================
// API HELPERS
// ================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchOpponent(playerId: string, playerElo?: number): Promise<{
  ghostId: string;
  playerName: string;
  elo: number;
  league: LeagueTier;
  matchId: string;
  potentialGain: number;
  potentialLoss: number;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/api/multiplayer/find-opponent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, playerElo }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.opponent) return null;

    return {
      ghostId: data.opponent.ghostId,
      playerName: data.opponent.playerName,
      elo: data.opponent.elo,
      league: data.opponent.league,
      matchId: data.matchId,
      potentialGain: data.potentialGain,
      potentialLoss: data.potentialLoss,
    };
  } catch (error) {
    console.error('Error fetching opponent:', error);
    return null;
  }
}

export async function fetchGhostRun(ghostId: string): Promise<GhostRun | null> {
  try {
    const response = await fetch(`${API_BASE}/api/ghost/${ghostId}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.ghostRun;
  } catch (error) {
    console.error('Error fetching ghost run:', error);
    return null;
  }
}

export async function reportMatchResult(
  matchId: string,
  playerId: string,
  opponentGhostId: string,
  playerWon: boolean,
  playerVictoryTurn: number | undefined,
  playerFinalSupport: number
): Promise<{
  eloChange: number;
  newElo: number;
  promoted: boolean;
  demoted: boolean;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/api/multiplayer/report-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        playerId,
        opponentGhostId,
        playerWon,
        playerVictoryTurn,
        playerFinalSupport,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      eloChange: data.result.eloChange,
      newElo: data.result.playerEloAfter,
      promoted: data.result.promoted,
      demoted: data.result.demoted,
    };
  } catch (error) {
    console.error('Error reporting match result:', error);
    return null;
  }
}
