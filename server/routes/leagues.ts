// leagues.ts - Seasonal ranking and leaderboard system

import express, { Request, Response } from 'express';
import {
  LeagueTier,
  LeagueInfo,
  LEAGUE_THRESHOLDS,
  ghostRunStorage,
  playerEloStorage,
  matchHistoryStorage,
  getLeagueInfo,
  getLeagueTier,
} from '../models/GhostRun';

export const leaguesRouter = express.Router();

// ================================
// TYPES
// ================================

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  elo: number;
  league: LeagueInfo;
  wins: number;
  losses: number;
  winRate: number;
}

interface SeasonInfo {
  season: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  rewards: SeasonReward[];
}

interface SeasonReward {
  tier: LeagueTier;
  rewards: string[];
}

// ================================
// GET LEADERBOARD
// ================================

leaguesRouter.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const { league, limit = '100', offset = '0' } = req.query;

    // Build leaderboard from player ELOs
    const entries: LeaderboardEntry[] = [];

    // Collect all players with ELO
    const playerIds = Array.from(playerEloStorage.keys());

    for (const playerId of playerIds) {
      const elo = playerEloStorage.get(playerId) || 1000;
      const history = matchHistoryStorage.get(playerId) || [];
      const wins = history.filter(m => m.playerWon).length;
      const losses = history.filter(m => !m.playerWon).length;

      // Get player name from their most recent ghost run
      const playerGhosts = Array.from(ghostRunStorage.values())
        .filter(g => g.playerId === playerId);
      const playerName = playerGhosts[0]?.playerName || `Player ${playerId.slice(0, 6)}`;

      entries.push({
        rank: 0, // Will be set after sorting
        playerId,
        playerName,
        elo,
        league: getLeagueInfo(elo, 0),
        wins,
        losses,
        winRate: history.length > 0 ? Math.round((wins / history.length) * 100) : 0,
      });
    }

    // Sort by ELO (descending)
    entries.sort((a, b) => b.elo - a.elo);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.league.rank = index + 1;
    });

    // Filter by league if specified
    let filtered = entries;
    if (league) {
      filtered = entries.filter(e => e.league.tier === league);
    }

    // Apply pagination
    const start = parseInt(offset as string);
    const count = parseInt(limit as string);
    const paginated = filtered.slice(start, start + count);

    res.json({
      leaderboard: paginated,
      total: filtered.length,
      offset: start,
      limit: count,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ================================
// GET LEAGUE INFO
// ================================

leaguesRouter.get('/info', (req: Request, res: Response) => {
  try {
    const leagues = Object.entries(LEAGUE_THRESHOLDS).map(([tier, info]) => ({
      tier,
      minElo: info.minElo,
      color: info.color,
      icon: info.icon,
      playerCount: Array.from(playerEloStorage.values())
        .filter(elo => getLeagueTier(elo) === tier).length,
    }));

    res.json({ leagues });
  } catch (error) {
    console.error('Error fetching league info:', error);
    res.status(500).json({ error: 'Failed to fetch league info' });
  }
});

// ================================
// GET CURRENT SEASON
// ================================

leaguesRouter.get('/season', (req: Request, res: Response) => {
  try {
    // Calculate current season (seasons last 30 days)
    const seasonStart = new Date('2025-01-01');
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
    const currentSeason = Math.floor(daysSinceStart / 30) + 1;

    const seasonStartDate = new Date(seasonStart.getTime() + (currentSeason - 1) * 30 * 24 * 60 * 60 * 1000);
    const seasonEndDate = new Date(seasonStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(0, Math.ceil((seasonEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const seasonInfo: SeasonInfo = {
      season: currentSeason,
      startDate: seasonStartDate.toISOString(),
      endDate: seasonEndDate.toISOString(),
      daysRemaining,
      rewards: [
        {
          tier: 'LEGEND',
          rewards: ['Exclusive Legend Avatar Frame', '+50 Starting Clout', '+$100 Starting Funds', 'Golden Spin Animation'],
        },
        {
          tier: 'DIAMOND',
          rewards: ['Diamond Avatar Frame', '+30 Starting Clout', '+$50 Starting Funds'],
        },
        {
          tier: 'GOLD',
          rewards: ['Gold Avatar Frame', '+20 Starting Clout', '+$25 Starting Funds'],
        },
        {
          tier: 'SILVER',
          rewards: ['Silver Avatar Frame', '+10 Starting Clout'],
        },
        {
          tier: 'BRONZE',
          rewards: ['Bronze Avatar Frame'],
        },
      ],
    };

    res.json({ season: seasonInfo });
  } catch (error) {
    console.error('Error fetching season info:', error);
    res.status(500).json({ error: 'Failed to fetch season info' });
  }
});

// ================================
// GET TOP PLAYERS BY LEAGUE
// ================================

leaguesRouter.get('/top/:league', (req: Request, res: Response) => {
  try {
    const { league } = req.params;
    const { limit = '10' } = req.query;

    if (!['BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'LEGEND'].includes(league)) {
      return res.status(400).json({ error: 'Invalid league tier' });
    }

    // Get all players in this league
    const entries: LeaderboardEntry[] = [];

    for (const [playerId, elo] of playerEloStorage.entries()) {
      if (getLeagueTier(elo) !== league) continue;

      const history = matchHistoryStorage.get(playerId) || [];
      const wins = history.filter(m => m.playerWon).length;
      const losses = history.filter(m => !m.playerWon).length;

      const playerGhosts = Array.from(ghostRunStorage.values())
        .filter(g => g.playerId === playerId);
      const playerName = playerGhosts[0]?.playerName || `Player ${playerId.slice(0, 6)}`;

      entries.push({
        rank: 0,
        playerId,
        playerName,
        elo,
        league: getLeagueInfo(elo, 0),
        wins,
        losses,
        winRate: history.length > 0 ? Math.round((wins / history.length) * 100) : 0,
      });
    }

    // Sort by ELO within league
    entries.sort((a, b) => b.elo - a.elo);
    entries.forEach((e, i) => { e.rank = i + 1; });

    const top = entries.slice(0, parseInt(limit as string));

    res.json({
      league,
      leagueInfo: LEAGUE_THRESHOLDS[league as LeagueTier],
      topPlayers: top,
      totalPlayers: entries.length,
    });
  } catch (error) {
    console.error('Error fetching top players:', error);
    res.status(500).json({ error: 'Failed to fetch top players' });
  }
});
