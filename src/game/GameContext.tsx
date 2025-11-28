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

export type RewardTier = 'low' | 'medium' | 'high';
export type OutcomeTone = 'positive' | 'risky' | 'neutral';

export interface EventOutcome {
  supportDelta?: { [state: string]: number };
  cloutDelta?: number;
  fundsDelta?: number;
  riskDelta?: number;
  message?: string;
  rewardTier?: RewardTier;
  tone?: OutcomeTone;
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
  activeBuffs: ActiveBuff[];
  resolutionMeta?: ResolutionMetadata;
}

// Actions for the reducer
type GameAction =
  | { type: 'PERFORM_ACTION'; actionId: string }
  | { type: 'RESOLVE_EVENT'; optionIndex: number }
  | { type: 'RESET_GAME' };

export interface ActiveBuff {
  id: string;
  label: string;
  type: 'cloutMultiplier' | 'riskShield';
  magnitude: number;
  expiresTurn: number;
  source: string;
}

export interface ResolutionMetadata {
  eventTitle: string;
  optionText?: string;
  rewardTier: RewardTier;
  tone: OutcomeTone;
  message?: string;
  appliedBuff?: ActiveBuff;
  cloutDelta?: number;
  riskDelta?: number;
  turn: number;
}

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
    gameOver: false,
    activeBuffs: [],
    resolutionMeta: undefined
  };
}

function pruneExpiredBuffs(buffs: ActiveBuff[], currentTurn: number) {
  return (buffs || []).filter(buff => buff.expiresTurn > currentTurn);
}

function applyBuffModifiers(outcome: EventOutcome, buffs: ActiveBuff[]) {
  let cloutDelta = outcome.cloutDelta || 0;
  let riskDelta = outcome.riskDelta || 0;
  buffs.forEach(buff => {
    if (buff.type === 'cloutMultiplier' && cloutDelta > 0) {
      cloutDelta = Math.round(cloutDelta * buff.magnitude);
    }
    if (buff.type === 'riskShield' && riskDelta > 0) {
      const reduction = Math.max(0, Math.min(1, buff.magnitude));
      riskDelta = Math.max(0, Math.round(riskDelta * (1 - reduction)));
    }
  });
  return { cloutDelta, riskDelta };
}

function applyOutcomeDeltas(
  support: { [state: string]: number },
  clout: number,
  funds: number,
  risk: number,
  outcome: EventOutcome,
  buffs: ActiveBuff[]
) {
  const supportClone = { ...support };
  if (outcome.supportDelta) {
    for (const s in outcome.supportDelta) {
      if (s === 'ALL') {
        for (const code in supportClone) {
          supportClone[code] = Math.max(0, Math.min(100, supportClone[code] + (outcome.supportDelta[s] || 0)));
        }
      } else if (supportClone[s] !== undefined) {
        supportClone[s] = Math.max(0, Math.min(100, supportClone[s] + outcome.supportDelta[s]));
      }
    }
  }

  const { cloutDelta, riskDelta } = applyBuffModifiers(outcome, buffs);
  const cloutVal = Math.max(0, clout + cloutDelta);
  const fundsVal = Math.max(0, funds + (outcome.fundsDelta || 0));
  const riskVal = Math.max(0, risk + riskDelta);

  return {
    support: supportClone,
    clout: cloutVal,
    funds: fundsVal,
    risk: riskVal,
    deltas: { cloutDelta, riskDelta }
  };
}

function buildBuffForOutcome(outcome: EventOutcome, currentTurn: number, source: string): ActiveBuff | undefined {
  if (outcome.rewardTier !== 'high') return undefined;
  const baseTurn = currentTurn + 2;
  if (outcome.tone === 'risky') {
    return {
      id: `buff-${source}-${currentTurn}-risk`,
      label: 'Damage Control',
      type: 'riskShield',
      magnitude: 0.4,
      expiresTurn: baseTurn,
      source
    };
  }
  return {
    id: `buff-${source}-${currentTurn}-clout`,
    label: 'Hype Wave',
    type: 'cloutMultiplier',
    magnitude: 1.5,
    expiresTurn: baseTurn,
    source
  };
}

function buildResolutionMeta(
  eventTitle: string,
  optionText: string | undefined,
  outcome: EventOutcome,
  buff: ActiveBuff | undefined,
  deltas: { cloutDelta?: number; riskDelta?: number },
  turn: number
): ResolutionMetadata {
  return {
    eventTitle,
    optionText,
    rewardTier: outcome.rewardTier || 'medium',
    tone: outcome.tone || 'neutral',
    message: outcome.message,
    appliedBuff: buff,
    cloutDelta: deltas.cloutDelta,
    riskDelta: deltas.riskDelta,
    turn
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

      const activeBuffs = pruneExpiredBuffs(state.activeBuffs, state.turn);
      // Execute the action's effect to get outcome deltas
      const outcome: EventOutcome = config.perform(state);
      const actionResult = applyOutcomeDeltas(state.support, newClout, newFunds, state.risk, outcome, activeBuffs);
      const newSupport = actionResult.support;
      const newCloutVal = actionResult.clout;
      const newFundsVal = actionResult.funds;
      const newRiskVal = actionResult.risk;
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
        advisors: state.advisors,
        activeBuffs,
        resolutionMeta: state.resolutionMeta
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
            const narrativeResult = applyOutcomeDeltas(
              newState.support,
              newState.clout,
              newState.funds,
              newState.risk,
              event.outcome,
              newState.activeBuffs
            );
            newState.support = narrativeResult.support;
            newState.clout = narrativeResult.clout;
            newState.funds = narrativeResult.funds;
            newState.risk = narrativeResult.risk;
            const buff = buildBuffForOutcome(event.outcome, newTurn, event.title);
            if (buff) {
              newState.activeBuffs = [...newState.activeBuffs, buff];
            }
            newState.resolutionMeta = buildResolutionMeta(
              event.title,
              undefined,
              event.outcome,
              buff,
              narrativeResult.deltas,
              newTurn
            );
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
      const activeBuffs = pruneExpiredBuffs(state.activeBuffs, state.turn);
      const resolutionResult = applyOutcomeDeltas(
        state.support,
        state.clout,
        state.funds,
        state.risk,
        outcome,
        activeBuffs
      );
      const newSupport = resolutionResult.support;
      const newCloutVal = resolutionResult.clout;
      const newFundsVal = resolutionResult.funds;
      const newRiskVal = resolutionResult.risk;
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
        advisors: state.advisors,
        activeBuffs,
        resolutionMeta: state.resolutionMeta
      };

      const buff = buildBuffForOutcome(outcome, state.turn, event.title);
      if (buff) {
        newState.activeBuffs = [...newState.activeBuffs, buff];
      }
      newState.resolutionMeta = buildResolutionMeta(
        event.title,
        choice.text,
        outcome,
        buff,
        resolutionResult.deltas,
        state.turn
      );

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
  const parsedState = savedState ? (JSON.parse(savedState) as Partial<GameState>) : undefined;
  const initialState = parsedState
    ? {
        ...createInitialState(),
        ...parsedState,
        activeBuffs: parsedState.activeBuffs || [],
        resolutionMeta: parsedState.resolutionMeta
      }
    : createInitialState();
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
