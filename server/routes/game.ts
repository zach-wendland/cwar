import express, { Request, Response } from "express";
import { generateAdvisors, generateEvent, generateTweets } from "./generators";

export const gameRouter = express.Router();

// Generate advisors
gameRouter.get("/advisors", (req: Request, res: Response) => {
  try {
    const advisors = generateAdvisors();
    res.json({ advisors });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate advisors" });
  }
});

// Generate event
gameRouter.post("/event", (req: Request, res: Response) => {
  try {
    const { gameState } = req.body;
    const event = generateEvent(gameState);
    res.json({ event });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate event" });
  }
});

// Generate tweets
gameRouter.post("/tweets", (req: Request, res: Response) => {
  try {
    const { actionName } = req.body;
    const tweets = generateTweets(actionName);
    res.json({ tweets });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate tweets" });
  }
});

// Get initial game state
gameRouter.get("/initial-state", (req: Request, res: Response) => {
  try {
    const stateCodes = [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
      "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
      "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
      "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
      "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    const support: { [key: string]: number } = {};
    stateCodes.forEach(code => { support[code] = 5; });

    const initialState = {
      turn: 0,
      support,
      clout: 50,
      funds: 100,
      risk: 0,
      advisors: generateAdvisors(),
      newsLog: ["Game start: Your movement is born. Spread influence and avoid getting banned!"],
      socialFeed: [],
      pendingEvent: undefined,
      victory: false,
      gameOver: false,
      streak: 0,
      highestStreak: 0,
      lastActionWasCritical: false,
      totalCriticalHits: 0,
      sessionFirstAction: true,
      achievementsUnlocked: [],
    };

    res.json({ state: initialState });
  } catch (error) {
    res.status(500).json({ error: "Failed to get initial state" });
  }
});
