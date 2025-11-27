import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { generateAdvisors, generateEvent, generateTweets } from './generators';
import { actionsConfig } from './actions';

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
  // (Flags like victory or ban triggers could be added here if needed)
}

export interface EventOption {
  text: string;
  outcome: EventOutcome;
}

export interface GameEvent {
  title: string;
  description: string;
  options?: EventOption[];
  outcome?: EventOutcome;  // used for narrative events with no choices
}

export interface Tweet {
  user: string;
  content: string;
}

// Main game state structure
export interface GameState {
  turn: number;
  support: { [stateCode: string]: number };  // support percentage per state
  clout: number;
  funds: number;
  risk: number;
  advisors: Advisor[];
  newsLog: string[];       // log of news events and actions
  socialFeed: Tweet[];     // list of generated social media posts
  pendingEvent?: GameEvent;
  victory: boolean;
  gameOver: boolean;
}

// Actions for the reducer
type GameAction =
  | { type: 'PERFORM_ACTION'; actionId: string }
  | { type: 'RESOLVE_EVENT'; optionIndex: number }
  | { type: 'RESET_GAME' };

// Helper to create a fresh initial state (with default values or random seeds)
function createInitialState(): GameState {
  // Initialize support for all 50 states + DC
  const stateCodes = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
                      "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
                      "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
                      "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
                      "WV","WI","WY"];
  const supportInit: { [state: string]: number } = {};
  stateCodes.forEach(code => { supportInit[code] = 5; });  // start at 5% support in each state

  return {
    turn: 0,
    support: supportInit,
    clout: 50,
    funds: 100,
    risk: 0,
    advisors: generateAdvisors(),  // generate initial advisor NPCs
    newsLog: ["Game start: Your movement is born. Spread influence and avoid getting banned!"],
    socialFeed: [],
    pendingEvent: undefined,
    victory: false,
    gameOver: false
  };
}

// Reducer to handle game state transitions per action/turn
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PERFORM_ACTION': {
      const config = actionsConfig.find(act => act.id === action.actionId);
      if (!config) return state;
      // If an interactive event is awaiting resolution, block other actions
      if (state.pendingEvent) {
        return state;
      }
      // Check resource costs for the action
      if (config.cost) {
        if (config.cost.funds && state.funds < config.cost.funds) {
          // Not enough funds
          return { ...state, newsLog: [...state.newsLog, "Not enough funds for action: " + config.name] };
        }
        if (config.cost.clout && state.clout < config.cost.clout) {
          // Not enough clout
          return { ...state, newsLog: [...state.newsLog, "Not enough clout to perform action: " + config.name] };
        }
      }
      // Deduct costs
      let newFunds = state.funds;
      let newClout = state.clout;
      if (config.cost) {
        if (config.cost.funds) newFunds -= config.cost.funds;
        if (config.cost.clout) newClout -= config.cost.clout;
      }

      // Execute the action's effect to get outcome deltas
      const outcome: EventOutcome = config.perform(state);
      // Apply outcome to state (without mutating original)
      const newSupport = { ...state.support };
      if (outcome.supportDelta) {
        for (const s in outcome.supportDelta) {
          if (s === 'ALL') {
            // Apply support change to all states
            for (const code in newSupport) {
              newSupport[code] = Math.max(0, Math.min(100, newSupport[code] + (outcome.supportDelta[s] || 0)));
            }
          } else if (newSupport[s] !== undefined) {
            newSupport[s] = Math.max(0, Math.min(100, newSupport[s] + outcome.supportDelta[s]));
          }
        }
      }
      const newCloutVal = Math.max(0, newClout + (outcome.cloutDelta || 0));
      const newFundsVal = Math.max(0, newFunds + (outcome.fundsDelta || 0));
      const newRiskVal = Math.max(0, state.risk + (outcome.riskDelta || 0));
      const newNewsLog = [...state.newsLog];
      if (outcome.message) {
        newNewsLog.push(outcome.message);
      }

      // Advance one turn
      const newTurn = state.turn + 1;
      // Start building the new state after applying action results
      let newState: GameState = {
        ...state,
        support: newSupport,
        clout: newCloutVal,
        funds: newFundsVal,
        risk: newRiskVal,
        turn: newTurn,
        newsLog: newNewsLog,
        socialFeed: [...state.socialFeed],  // will add new tweets below
        pendingEvent: state.pendingEvent,   // (should be undefined here)
        victory: false,
        gameOver: false,
        advisors: state.advisors
      };

      // Generate social media reactions to this action
      const tweets = generateTweets(config.name);
      newState.socialFeed = [...state.socialFeed, ...tweets];

      // Possibly trigger a dynamic event this turn
      let event = null;
      if (newTurn === 1) {
        // Ensure an early event (on first turn) for demonstration
        event = generateEvent(newState);
      } else if (Math.random() < 0.3) {
        // Random chance of event on subsequent turns
        event = generateEvent(newState);
      }
      if (event) {
        if (event.options && event.options.length > 0) {
          // Got an interactive event with choices – hold it for player decision
          newState.pendingEvent = event;
        } else {
          // Got a narrative event (no choices) – apply its outcome immediately
          if (event.outcome) {
            if (event.outcome.supportDelta) {
              for (const s in event.outcome.supportDelta) {
                if (s === 'ALL') {
                  for (const code in newState.support) {
                    newState.support[code] = Math.max(0, Math.min(100, newState.support[code] + (event.outcome.supportDelta[s] || 0)));
                  }
                } else if (newState.support[s] !== undefined) {
                  newState.support[s] = Math.max(0, Math.min(100, newState.support[s] + event.outcome.supportDelta[s]));
                }
              }
            }
            if (event.outcome.cloutDelta) newState.clout = Math.max(0, newState.clout + event.outcome.cloutDelta);
            if (event.outcome.fundsDelta) newState.funds = Math.max(0, newState.funds + event.outcome.fundsDelta);
            if (event.outcome.riskDelta) newState.risk = Math.max(0, newState.risk + event.outcome.riskDelta);
          }
          // Log the narrative event
          newState.newsLog.push(`${event.title}: ${event.description}`);
        }
      }

      // Check victory condition (>= 80% average support)
      const avgSupport = Object.values(newState.support).reduce((a, b) => a + b, 0) / Object.keys(newState.support).length;
      if (avgSupport >= 80) {
        newState.victory = true;
      }
      // Check defeat condition (risk >= 100 triggers ban)
      if (newState.risk >= 100) {
        newState.gameOver = true;
        newState.newsLog.push("All platforms ban your movement! Game Over.");
      }

      return newState;
    }

    case 'RESOLVE_EVENT': {
      if (!state.pendingEvent) return state;
      const event = state.pendingEvent;
      const choice = event.options && event.options[action.optionIndex];
      if (!choice) {
        // No valid choice (should not happen), just clear pending event
        return { ...state, pendingEvent: undefined };
      }
      const outcome = choice.outcome;
      // Apply outcome effects of the chosen option
      const newSupport = { ...state.support };
      if (outcome.supportDelta) {
        for (const s in outcome.supportDelta) {
          if (s === 'ALL') {
            for (const code in newSupport) {
              newSupport[code] = Math.max(0, Math.min(100, newSupport[code] + (outcome.supportDelta[s] || 0)));
            }
          } else if (newSupport[s] !== undefined) {
            newSupport[s] = Math.max(0, Math.min(100, newSupport[s] + outcome.supportDelta[s]));
          }
        }
      }
      const newCloutVal = Math.max(0, state.clout + (outcome.cloutDelta || 0));
      const newFundsVal = Math.max(0, state.funds + (outcome.fundsDelta || 0));
      const newRiskVal = Math.max(0, state.risk + (outcome.riskDelta || 0));
      const newNewsLog = [...state.newsLog];
      // Log the event resolution and outcome
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
        pendingEvent: undefined,  // event resolved
        victory: false,
        gameOver: false,
        turn: state.turn,  // turn does not advance on resolution, it was advanced on the action already
        socialFeed: [...state.socialFeed],
        advisors: state.advisors
      };

      // Re-check victory/defeat after event outcome
      const avgSupport = Object.values(newState.support).reduce((a, b) => a + b, 0) / Object.keys(newState.support).length;
      if (avgSupport >= 80) {
        newState.victory = true;
      }
      if (newState.risk >= 100) {
        newState.gameOver = true;
        newState.newsLog.push("All platforms ban your movement! Game Over.");
      }
      return newState;
    }

    case 'RESET_GAME': {
      // Start a new game (fresh state)
      const newState = createInitialState();
      return newState;
    }

    default:
      return state;
  }
}

// Create React Context for the game state
interface GameContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}
const GameContext = createContext<GameContextProps | undefined>(undefined);

// Provider component to wrap the app
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved game state from localStorage if available, otherwise use default
  const savedState = localStorage.getItem('gameSave');
  const initialState = savedState ? (JSON.parse(savedState) as GameState) : createInitialState();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Persist game state to localStorage on every change
  useEffect(() => {
    localStorage.setItem('gameSave', JSON.stringify(state));
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for consuming the game context
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
