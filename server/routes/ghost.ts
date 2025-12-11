// ghost.ts - API routes for ghost run storage and retrieval

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  GhostRun,
  GhostAction,
  ghostRunStorage,
  playerEloStorage,
  getLeagueTier,
} from '../models/GhostRun';

export const ghostRouter = express.Router();

// ================================
// UPLOAD GHOST RUN
// ================================

interface UploadGhostRequest {
  playerId: string;
  playerName: string;
  victory: boolean;
  victoryType?: string;
  defeatType?: string;
  finalTurn: number;
  finalSupport: number;
  finalFunds: number;
  finalClout: number;
  finalRisk: number;
  actions: GhostAction[];
  totalCombos: number;
  bestComboMultiplier: number;
  totalCriticalHits: number;
}

ghostRouter.post('/upload', (req: Request, res: Response) => {
  try {
    const data: UploadGhostRequest = req.body;

    // Get or initialize player ELO
    let playerElo = playerEloStorage.get(data.playerId) || 1000;

    const ghostRun: GhostRun = {
      id: `ghost-${uuidv4()}`,
      playerId: data.playerId,
      playerName: data.playerName,
      createdAt: new Date().toISOString(),
      victory: data.victory,
      victoryType: data.victoryType,
      defeatType: data.defeatType,
      finalTurn: data.finalTurn,
      finalSupport: data.finalSupport,
      finalFunds: data.finalFunds,
      finalClout: data.finalClout,
      finalRisk: data.finalRisk,
      elo: playerElo,
      league: getLeagueTier(playerElo),
      season: 1, // Current season
      actions: data.actions,
      totalCombos: data.totalCombos,
      bestComboMultiplier: data.bestComboMultiplier,
      totalCriticalHits: data.totalCriticalHits,
    };

    // Store the ghost run
    ghostRunStorage.set(ghostRun.id, ghostRun);

    res.json({
      success: true,
      ghostId: ghostRun.id,
      message: 'Ghost run uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading ghost run:', error);
    res.status(500).json({ error: 'Failed to upload ghost run' });
  }
});

// ================================
// GET GHOST RUN BY ID
// ================================

ghostRouter.get('/:ghostId', (req: Request, res: Response) => {
  try {
    const { ghostId } = req.params;
    const ghostRun = ghostRunStorage.get(ghostId);

    if (!ghostRun) {
      return res.status(404).json({ error: 'Ghost run not found' });
    }

    res.json({ ghostRun });
  } catch (error) {
    console.error('Error fetching ghost run:', error);
    res.status(500).json({ error: 'Failed to fetch ghost run' });
  }
});

// ================================
// LIST GHOST RUNS (with filters)
// ================================

interface ListGhostsQuery {
  playerId?: string;
  minElo?: string;
  maxElo?: string;
  league?: string;
  limit?: string;
}

ghostRouter.get('/', (req: Request, res: Response) => {
  try {
    const { playerId, minElo, maxElo, league, limit } = req.query as ListGhostsQuery;

    let ghosts = Array.from(ghostRunStorage.values());

    // Apply filters
    if (playerId) {
      ghosts = ghosts.filter(g => g.playerId === playerId);
    }
    if (minElo) {
      ghosts = ghosts.filter(g => g.elo >= parseInt(minElo));
    }
    if (maxElo) {
      ghosts = ghosts.filter(g => g.elo <= parseInt(maxElo));
    }
    if (league) {
      ghosts = ghosts.filter(g => g.league === league);
    }

    // Sort by ELO (descending) then by date
    ghosts.sort((a, b) => {
      if (b.elo !== a.elo) return b.elo - a.elo;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit
    const maxResults = limit ? parseInt(limit) : 50;
    ghosts = ghosts.slice(0, maxResults);

    res.json({
      ghosts: ghosts.map(g => ({
        id: g.id,
        playerName: g.playerName,
        elo: g.elo,
        league: g.league,
        victory: g.victory,
        victoryType: g.victoryType,
        finalTurn: g.finalTurn,
        finalSupport: g.finalSupport,
        createdAt: g.createdAt,
      })),
      total: ghosts.length,
    });
  } catch (error) {
    console.error('Error listing ghost runs:', error);
    res.status(500).json({ error: 'Failed to list ghost runs' });
  }
});

// ================================
// DELETE GHOST RUN
// ================================

ghostRouter.delete('/:ghostId', (req: Request, res: Response) => {
  try {
    const { ghostId } = req.params;

    if (!ghostRunStorage.has(ghostId)) {
      return res.status(404).json({ error: 'Ghost run not found' });
    }

    ghostRunStorage.delete(ghostId);

    res.json({
      success: true,
      message: 'Ghost run deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting ghost run:', error);
    res.status(500).json({ error: 'Failed to delete ghost run' });
  }
});
