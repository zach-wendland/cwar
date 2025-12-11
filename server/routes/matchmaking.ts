// matchmaking.ts - ELO-based opponent matching for ghost battles

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  GhostRun,
  MatchResult,
  ghostRunStorage,
  playerEloStorage,
  matchHistoryStorage,
  calculateEloChange,
  getLeagueInfo,
  getLeagueTier,
} from '../models/GhostRun';

export const matchmakingRouter = express.Router();

// ================================
// TIER RANKING (for promotion/demotion logic)
// ================================

const TIER_RANK: Record<string, number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
  DIAMOND: 3,
  LEGEND: 4,
};

// ================================
// FIND OPPONENT
// ================================

interface FindOpponentRequest {
  playerId: string;
  playerElo?: number;
}

matchmakingRouter.post('/find-opponent', (req: Request, res: Response) => {
  try {
    const { playerId, playerElo: requestedElo }: FindOpponentRequest = req.body;

    // Get player's ELO (use provided or stored)
    const playerElo = requestedElo || playerEloStorage.get(playerId) || 1000;

    // Find suitable opponent ghost
    const ghosts = Array.from(ghostRunStorage.values())
      .filter(g => g.playerId !== playerId) // Don't match against self
      .filter(g => g.victory) // Only match against winning runs
      .map(g => ({
        ghost: g,
        eloDiff: Math.abs(g.elo - playerElo),
      }))
      .sort((a, b) => a.eloDiff - b.eloDiff); // Sort by closest ELO

    if (ghosts.length === 0) {
      // No opponents found, return a default bot
      return res.json({
        opponent: null,
        message: 'No opponents available. Playing against tutorial bot.',
        matchId: `match-${uuidv4()}`,
      });
    }

    // Pick from top 5 closest matches randomly (to add variety)
    const topMatches = ghosts.slice(0, 5);
    const selected = topMatches[Math.floor(Math.random() * topMatches.length)];

    res.json({
      opponent: {
        ghostId: selected.ghost.id,
        playerName: selected.ghost.playerName,
        elo: selected.ghost.elo,
        league: selected.ghost.league,
        eloDiff: selected.eloDiff,
        finalTurn: selected.ghost.finalTurn,
        finalSupport: selected.ghost.finalSupport,
      },
      matchId: `match-${uuidv4()}`,
      playerElo,
      potentialGain: calculateEloChange(playerElo, selected.ghost.elo, true),
      potentialLoss: calculateEloChange(playerElo, selected.ghost.elo, false),
    });
  } catch (error) {
    console.error('Error finding opponent:', error);
    res.status(500).json({ error: 'Failed to find opponent' });
  }
});

// ================================
// REPORT MATCH RESULT
// ================================

interface ReportMatchRequest {
  matchId: string;
  playerId: string;
  opponentGhostId: string;
  playerWon: boolean;
  playerVictoryTurn?: number;
  playerFinalSupport: number;
  playerActions: any[]; // Player's action history for potential ghost upload
}

matchmakingRouter.post('/report-result', (req: Request, res: Response) => {
  try {
    const data: ReportMatchRequest = req.body;

    // Get player and opponent ELO
    const playerEloBefore = playerEloStorage.get(data.playerId) || 1000;
    const opponentGhost = ghostRunStorage.get(data.opponentGhostId);
    const opponentElo = opponentGhost?.elo || 1000;

    // Calculate ELO change
    const eloChange = calculateEloChange(playerEloBefore, opponentElo, data.playerWon);
    const playerEloAfter = Math.max(0, playerEloBefore + eloChange);

    // Update player ELO
    playerEloStorage.set(data.playerId, playerEloAfter);

    // Get league info before and after
    const leagueBefore = getLeagueInfo(playerEloBefore, 0);
    const leagueAfter = getLeagueInfo(playerEloAfter, 0);

    // Check for promotion/demotion using tier rank mapping
    const tierChanged = leagueAfter.tier !== leagueBefore.tier;
    const promoted = tierChanged && TIER_RANK[leagueAfter.tier] > TIER_RANK[leagueBefore.tier];
    const demoted = tierChanged && TIER_RANK[leagueAfter.tier] < TIER_RANK[leagueBefore.tier];

    // Create match result
    const matchResult: MatchResult = {
      matchId: data.matchId,
      playerId: data.playerId,
      opponentId: opponentGhost?.playerId || 'unknown',
      playerWon: data.playerWon,
      playerVictoryTurn: data.playerVictoryTurn,
      opponentVictoryTurn: opponentGhost?.finalTurn,
      playerFinalSupport: data.playerFinalSupport,
      opponentFinalSupport: opponentGhost?.finalSupport || 0,
      playerEloBefore,
      playerEloAfter,
      eloChange,
      leagueBefore,
      leagueAfter,
      promoted,
      demoted,
    };

    // Store match result
    const history = matchHistoryStorage.get(data.playerId) || [];
    history.push(matchResult);
    matchHistoryStorage.set(data.playerId, history);

    res.json({
      success: true,
      result: matchResult,
      message: data.playerWon
        ? `Victory! +${eloChange} ELO`
        : `Defeat. ${eloChange} ELO`,
    });
  } catch (error) {
    console.error('Error reporting match result:', error);
    res.status(500).json({ error: 'Failed to report match result' });
  }
});

// ================================
// GET PLAYER STATS
// ================================

matchmakingRouter.get('/player/:playerId', (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    const elo = playerEloStorage.get(playerId) || 1000;
    const history = matchHistoryStorage.get(playerId) || [];

    const wins = history.filter(m => m.playerWon).length;
    const losses = history.filter(m => !m.playerWon).length;
    const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;

    // Get global rank (simple: count players with higher ELO)
    const allElos = Array.from(playerEloStorage.values());
    const rank = allElos.filter(e => e > elo).length + 1;

    const leagueInfo = getLeagueInfo(elo, rank);

    res.json({
      playerId,
      elo,
      league: leagueInfo,
      stats: {
        wins,
        losses,
        winRate: Math.round(winRate),
        totalMatches: history.length,
        currentStreak: calculateStreak(history),
        bestStreak: calculateBestStreak(history),
      },
      recentMatches: history.slice(-10).reverse(), // Last 10 matches
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Helper functions
function calculateStreak(history: MatchResult[]): number {
  if (history.length === 0) return 0;

  let streak = 0;
  const lastResult = history[history.length - 1].playerWon;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].playerWon === lastResult) {
      streak++;
    } else {
      break;
    }
  }

  return lastResult ? streak : -streak;
}

function calculateBestStreak(history: MatchResult[]): number {
  let best = 0;
  let current = 0;

  for (const match of history) {
    if (match.playerWon) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}
