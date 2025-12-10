"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";
import { generateAdvisors, generateEvent, generateTweets } from "./generators";
import { actionsConfig } from "./actions";

// Define interfaces for game state and related entities
export interface Advisor {
  name: string;
  role: string;
  ideology: string;
  traits: string;
  quotes: string[];
}

export interface EventOutcome {
  supportDelta?: { [state: string]: number };
  cloutDelta?: number;
  fundsDelta?: number;
  riskDelta?: number;
  message?: string;
}

export interface EventOption {
  text: string;
  outcome: EventOutcome;
}

export interface GameEvent {
  title: string;
  description: string;
  options?: EventOption[];
  outcome?: EventOutcome;
}

export interface Tweet {
  user: string;
  content: string;
}

// Main game state structure with gamification additions
export interface GameState {
  turn: number;
  support: { [stateCode: string]: number };
  clout: number;
  funds: number;
  risk: number;
  advisors: Advisor[];
  newsLog: string[];
  socialFeed: Tweet[];
  pendingEvent?: GameEvent;
  victory: boolean;
  gameOver: boolean;
  // Gamification features
  streak: number;
  highestStreak: number;
  lastActionWasCritical: boolean;
  totalCriticalHits: number;
  sessionFirstAction: boolean;
  achievementsUnlocked: string[];
}

// Actions for the reducer
type GameAction =
  | { type: "PERFORM_ACTION"; actionId: string }
  | { type: "RESOLVE_EVENT"; optionIndex: number }
  | { type: "RESET_GAME" }
  | { type: "CLEAR_CRITICAL_FLAG" };

// Critical hit chance (10%)
const CRITICAL_HIT_CHANCE = 0.1;

// Streak bonus thresholds
const STREAK_BONUSES = {
  3: { clout: 5, message: "3-Turn Streak! +5 Clout bonus!" },
  5: { funds: 20, message: "5-Turn Streak! +$20 Funds bonus!" },
  10: {
    supportBonus: true,
    message: "10-Turn Streak! +10% Support to a random state!",
  },
};

// Helper to create a fresh initial state
function createInitialState(): GameState {
  const stateCodes = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "DC",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];
  const supportInit: { [state: string]: number } = {};
  stateCodes.forEach((code) => {
    supportInit[code] = 5;
  });

  return {
    turn: 0,
    support: supportInit,
    clout: 50,
    funds: 100,
    risk: 0,
    advisors: generateAdvisors(),
    newsLog: [
      "Game start: Your movement is born. Spread influence and avoid getting banned!",
    ],
    socialFeed: [],
    pendingEvent: undefined,
    victory: false,
    gameOver: false,
    // Gamification
    streak: 0,
    highestStreak: 0,
    lastActionWasCritical: false,
    totalCriticalHits: 0,
    sessionFirstAction: true,
    achievementsUnlocked: [],
  };
}

// Apply outcome with optional critical hit multiplier
function applyOutcomeWithMultiplier(
  outcome: EventOutcome,
  multiplier: number = 1
): EventOutcome {
  const result: EventOutcome = { ...outcome };

  if (outcome.supportDelta) {
    result.supportDelta = {};
    for (const key in outcome.supportDelta) {
      const value = outcome.supportDelta[key];
      // Only multiply positive values (benefits)
      result.supportDelta[key] =
        value > 0 ? Math.round(value * multiplier) : value;
    }
  }

  if (outcome.cloutDelta && outcome.cloutDelta > 0) {
    result.cloutDelta = Math.round(outcome.cloutDelta * multiplier);
  }

  if (outcome.fundsDelta && outcome.fundsDelta > 0) {
    result.fundsDelta = Math.round(outcome.fundsDelta * multiplier);
  }

  // Risk is never multiplied (we don't want to punish critical hits)

  return result;
}

// Get random state code
function getRandomStateCode(support: { [key: string]: number }): string {
  const codes = Object.keys(support);
  return codes[Math.floor(Math.random() * codes.length)];
}

// Reducer to handle game state transitions
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PERFORM_ACTION": {
      const config = actionsConfig.find((act) => act.id === action.actionId);
      if (!config) return state;

      if (state.pendingEvent) {
        return state;
      }

      // Check resource costs
      if (config.cost) {
        if (config.cost.funds && state.funds < config.cost.funds) {
          return {
            ...state,
            newsLog: [
              ...state.newsLog,
              "Not enough funds for action: " + config.name,
            ],
          };
        }
        if (config.cost.clout && state.clout < config.cost.clout) {
          return {
            ...state,
            newsLog: [
              ...state.newsLog,
              "Not enough clout to perform action: " + config.name,
            ],
          };
        }
      }

      // Deduct costs
      let newFunds = state.funds;
      let newClout = state.clout;
      if (config.cost) {
        if (config.cost.funds) newFunds -= config.cost.funds;
        if (config.cost.clout) newClout -= config.cost.clout;
      }

      // Check for critical hit
      const isCriticalHit = Math.random() < CRITICAL_HIT_CHANCE;
      const multiplier = isCriticalHit ? 2 : 1;

      // Check for first action of session bonus (1.5x)
      const sessionMultiplier = state.sessionFirstAction ? 1.5 : 1;
      const finalMultiplier = isCriticalHit ? multiplier : sessionMultiplier;

      // Execute the action's effect with potential multiplier
      let outcome: EventOutcome = config.perform(state);
      if (finalMultiplier > 1) {
        outcome = applyOutcomeWithMultiplier(outcome, finalMultiplier);
      }

      // Apply outcome to state
      const newSupport = { ...state.support };
      if (outcome.supportDelta) {
        for (const s in outcome.supportDelta) {
          if (s === "ALL") {
            for (const code in newSupport) {
              newSupport[code] = Math.max(
                0,
                Math.min(100, newSupport[code] + (outcome.supportDelta[s] || 0))
              );
            }
          } else if (newSupport[s] !== undefined) {
            newSupport[s] = Math.max(
              0,
              Math.min(100, newSupport[s] + outcome.supportDelta[s])
            );
          }
        }
      }

      const newCloutVal = Math.max(0, newClout + (outcome.cloutDelta || 0));
      const newFundsVal = Math.max(0, newFunds + (outcome.fundsDelta || 0));
      const newRiskVal = Math.max(0, state.risk + (outcome.riskDelta || 0));
      const newNewsLog = [...state.newsLog];

      if (isCriticalHit) {
        newNewsLog.push(`CRITICAL HIT! ${config.name} had double effect!`);
      } else if (state.sessionFirstAction) {
        newNewsLog.push(`Morning Momentum! First action bonus applied!`);
      }

      if (outcome.message) {
        newNewsLog.push(outcome.message);
      }

      // Calculate streak
      const riskIncreased = newRiskVal > state.risk;
      let newStreak = riskIncreased ? 0 : state.streak + 1;
      let newHighestStreak = Math.max(state.highestStreak, newStreak);

      // Check for streak bonuses
      const streakBonus =
        STREAK_BONUSES[newStreak as keyof typeof STREAK_BONUSES];
      let bonusClout = 0;
      let bonusFunds = 0;

      if (streakBonus) {
        newNewsLog.push(streakBonus.message);
        if ("clout" in streakBonus) bonusClout = streakBonus.clout;
        if ("funds" in streakBonus) bonusFunds = streakBonus.funds;
        if ("supportBonus" in streakBonus && streakBonus.supportBonus) {
          const randomState = getRandomStateCode(newSupport);
          newSupport[randomState] = Math.min(100, newSupport[randomState] + 10);
          newNewsLog.push(`${randomState} received +10% support bonus!`);
        }
      }

      const newTurn = state.turn + 1;

      let newState: GameState = {
        ...state,
        support: newSupport,
        clout: newCloutVal + bonusClout,
        funds: newFundsVal + bonusFunds,
        risk: newRiskVal,
        turn: newTurn,
        newsLog: newNewsLog,
        socialFeed: [...state.socialFeed],
        pendingEvent: state.pendingEvent,
        victory: false,
        gameOver: false,
        advisors: state.advisors,
        // Gamification updates
        streak: newStreak,
        highestStreak: newHighestStreak,
        lastActionWasCritical: isCriticalHit,
        totalCriticalHits: state.totalCriticalHits + (isCriticalHit ? 1 : 0),
        sessionFirstAction: false,
        achievementsUnlocked: state.achievementsUnlocked,
      };

      // Generate social media reactions
      const tweets = generateTweets(config.name);
      newState.socialFeed = [...state.socialFeed, ...tweets];

      // Possibly trigger a dynamic event
      let event = null;
      if (newTurn === 1) {
        event = generateEvent(newState);
      } else if (Math.random() < 0.3) {
        event = generateEvent(newState);
      }

      if (event) {
        if (event.options && event.options.length > 0) {
          newState.pendingEvent = event;
        } else {
          if (event.outcome) {
            if (event.outcome.supportDelta) {
              for (const s in event.outcome.supportDelta) {
                if (s === "ALL") {
                  for (const code in newState.support) {
                    newState.support[code] = Math.max(
                      0,
                      Math.min(
                        100,
                        newState.support[code] +
                          (event.outcome.supportDelta[s] || 0)
                      )
                    );
                  }
                } else if (newState.support[s] !== undefined) {
                  newState.support[s] = Math.max(
                    0,
                    Math.min(
                      100,
                      newState.support[s] + event.outcome.supportDelta[s]
                    )
                  );
                }
              }
            }
            if (event.outcome.cloutDelta)
              newState.clout = Math.max(
                0,
                newState.clout + event.outcome.cloutDelta
              );
            if (event.outcome.fundsDelta)
              newState.funds = Math.max(
                0,
                newState.funds + event.outcome.fundsDelta
              );
            if (event.outcome.riskDelta)
              newState.risk = Math.max(
                0,
                newState.risk + event.outcome.riskDelta
              );
          }
          newState.newsLog.push(`${event.title}: ${event.description}`);
        }
      }

      // Check victory/defeat conditions
      const avgSupport =
        Object.values(newState.support).reduce((a, b) => a + b, 0) /
        Object.keys(newState.support).length;
      if (avgSupport >= 80) {
        newState.victory = true;
      }
      if (newState.risk >= 100) {
        newState.gameOver = true;
        newState.newsLog.push("All platforms ban your movement! Game Over.");
      }

      return newState;
    }

    case "RESOLVE_EVENT": {
      if (!state.pendingEvent) return state;
      const event = state.pendingEvent;
      const choice = event.options && event.options[action.optionIndex];
      if (!choice) {
        return { ...state, pendingEvent: undefined };
      }

      const outcome = choice.outcome;
      const newSupport = { ...state.support };

      if (outcome.supportDelta) {
        for (const s in outcome.supportDelta) {
          if (s === "ALL") {
            for (const code in newSupport) {
              newSupport[code] = Math.max(
                0,
                Math.min(100, newSupport[code] + (outcome.supportDelta[s] || 0))
              );
            }
          } else if (newSupport[s] !== undefined) {
            newSupport[s] = Math.max(
              0,
              Math.min(100, newSupport[s] + outcome.supportDelta[s])
            );
          }
        }
      }

      const newCloutVal = Math.max(0, state.clout + (outcome.cloutDelta || 0));
      const newFundsVal = Math.max(0, state.funds + (outcome.fundsDelta || 0));
      const newRiskVal = Math.max(0, state.risk + (outcome.riskDelta || 0));
      const newNewsLog = [...state.newsLog];

      newNewsLog.push(`Event resolved: ${event.title} - Chose "${choice.text}"`);
      if (outcome.message) {
        newNewsLog.push(outcome.message);
      }

      let newState: GameState = {
        ...state,
        support: newSupport,
        clout: newCloutVal,
        funds: newFundsVal,
        risk: newRiskVal,
        newsLog: newNewsLog,
        pendingEvent: undefined,
        victory: false,
        gameOver: false,
        turn: state.turn,
        socialFeed: [...state.socialFeed],
        advisors: state.advisors,
        lastActionWasCritical: false,
      };

      const avgSupport =
        Object.values(newState.support).reduce((a, b) => a + b, 0) /
        Object.keys(newState.support).length;
      if (avgSupport >= 80) {
        newState.victory = true;
      }
      if (newState.risk >= 100) {
        newState.gameOver = true;
        newState.newsLog.push("All platforms ban your movement! Game Over.");
      }

      return newState;
    }

    case "CLEAR_CRITICAL_FLAG": {
      return { ...state, lastActionWasCritical: false };
    }

    case "RESET_GAME": {
      return createInitialState();
    }

    default:
      return state;
  }
}

// Create React Context
interface GameContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}
const GameContext = createContext<GameContextProps | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    // Initial state will be set in useEffect for client-side only
    return createInitialState();
  });

  // Handle client-side initialization and localStorage
  useEffect(() => {
    setIsClient(true);
    const savedState = localStorage.getItem("gameSave");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as GameState;
        // Ensure new fields exist (migration for existing saves)
        const migratedState: GameState = {
          ...parsed,
          streak: parsed.streak ?? 0,
          highestStreak: parsed.highestStreak ?? 0,
          lastActionWasCritical: parsed.lastActionWasCritical ?? false,
          totalCriticalHits: parsed.totalCriticalHits ?? 0,
          sessionFirstAction: true, // Reset on page load
          achievementsUnlocked: parsed.achievementsUnlocked ?? [],
        };
        // Dispatch a reset with the saved state
        dispatch({ type: "RESET_GAME" });
        // We need to manually set state - using a different approach
      } catch (e) {
        console.error("Failed to parse saved game state:", e);
      }
    }
  }, []);

  // Persist game state to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("gameSave", JSON.stringify(state));
    }
  }, [state, isClient]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

// Export for tests
export { createInitialState, gameReducer };
