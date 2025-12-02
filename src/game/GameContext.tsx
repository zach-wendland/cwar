import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { generateAdvisors, generateEvent, generateTweets } from './generators';
import { actionsConfig } from './actions';

// Define interfaces for game state and related entities
export interface AdvisorAbility {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  perform: (state: GameState) => EventOutcome;
}

export interface Advisor {
  id: string;
  name: string;
  role: string;
  ideology: string;
  traits: string;
  quotes: string[];
  loyalty: number;  // 0-100, affects performance
  morale: number;   // 0-100, affects abilities
  specialization: 'social' | 'fundraising' | 'grassroots' | 'analytics';
  bonuses: {
    cloutBonus?: number;      // % bonus to clout gains
    fundsBonus?: number;      // % bonus to funds gains
    supportBonus?: number;    // % bonus to support gains
    riskReduction?: number;   // % reduction in risk
  };
  ability?: AdvisorAbility;
  hired: boolean;
  hireCost: number;
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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  requirement: (state: GameState) => boolean;
  perk?: CampaignPerk;
}

export interface CampaignPerk {
  id: string;
  name: string;
  description: string;
  effect: (state: GameState) => Partial<GameState>;
  active: boolean;
}

export interface Region {
  id: string;
  name: string;
  states: string[];
  influence: number;  // 0-100, regional influence level
}

export interface Opposition {
  name: string;
  strength: number;  // 0-100
  focus: string[];   // which states they're targeting
  strategy: 'aggressive' | 'defensive' | 'balanced';
}

export interface NarrativeArc {
  id: string;
  title: string;
  description: string;
  stage: number;
  maxStages: number;
  events: GameEvent[];
  active: boolean;
  completed: boolean;
}

export interface TutorialStage {
  id: string;
  title: string;
  description: string;
  objective: string;
  highlight?: string;  // UI element to highlight
  completed: boolean;
}

export interface TutorialState {
  active: boolean;
  currentStage: number;
  stages: TutorialStage[];
  skipped: boolean;
  completedAt?: number;  // turn number when completed
}

// Main game state structure
export interface GameState {
  turn: number;
  support: { [stateCode: string]: number };  // support percentage per state
  clout: number;
  funds: number;
  risk: number;
  momentum: number;  // 0-100, affects action effectiveness
  advisors: Advisor[];
  availableAdvisors: Advisor[];  // advisors that can be hired
  newsLog: string[];       // log of news events and actions
  socialFeed: Tweet[];     // list of generated social media posts
  pendingEvent?: GameEvent;
  victory: boolean;
  gameOver: boolean;
  achievements: Achievement[];
  activePerks: CampaignPerk[];
  regions: Region[];
  opposition: Opposition[];
  activeNarratives: NarrativeArc[];
  difficulty: 'easy' | 'normal' | 'hard';
  tutorial: TutorialState;
}

// Actions for the reducer
type GameAction =
  | { type: 'PERFORM_ACTION'; actionId: string }
  | { type: 'RESOLVE_EVENT'; optionIndex: number }
  | { type: 'RESET_GAME' }
  | { type: 'HIRE_ADVISOR'; advisorId: string }
  | { type: 'FIRE_ADVISOR'; advisorId: string }
  | { type: 'USE_ADVISOR_ABILITY'; advisorId: string }
  | { type: 'ACTIVATE_PERK'; perkId: string }
  | { type: 'DEACTIVATE_PERK'; perkId: string }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'COMPLETE_TUTORIAL_STAGE'; stageId: string }
  | { type: 'NEXT_TUTORIAL_STAGE' };

// Helper functions to initialize game elements
function createRegions(): Region[] {
  return [
    { id: 'northeast', name: 'Northeast', states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'], influence: 0 },
    { id: 'southeast', name: 'Southeast', states: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA'], influence: 0 },
    { id: 'midwest', name: 'Midwest', states: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'], influence: 0 },
    { id: 'southwest', name: 'Southwest', states: ['AZ', 'NM', 'OK', 'TX'], influence: 0 },
    { id: 'west', name: 'West', states: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA'], influence: 0 },
    { id: 'capital', name: 'Capital', states: ['DC'], influence: 0 }
  ];
}

function createAchievements(): Achievement[] {
  return [
    {
      id: 'first_blood',
      name: 'First Blood',
      description: 'Win your first state (>50% support)',
      unlocked: false,
      requirement: (state: GameState) => Object.values(state.support).some(s => s > 50)
    },
    {
      id: 'viral_sensation',
      name: 'Viral Sensation',
      description: 'Reach 100 clout',
      unlocked: false,
      requirement: (state: GameState) => state.clout >= 100
    },
    {
      id: 'war_chest',
      name: 'War Chest',
      description: 'Accumulate 500 funds',
      unlocked: false,
      requirement: (state: GameState) => state.funds >= 500
    },
    {
      id: 'high_roller',
      name: 'High Roller',
      description: 'Survive with 90+ risk for 3 consecutive turns',
      unlocked: false,
      requirement: (state: GameState) => state.risk >= 90 && state.turn >= 3
    },
    {
      id: 'regional_dominance',
      name: 'Regional Dominance',
      description: 'Achieve >60% support in all states of a region',
      unlocked: false,
      requirement: (state: GameState) => {
        return state.regions.some(region =>
          region.states.every(stateCode => state.support[stateCode] >= 60)
        );
      }
    },
    {
      id: 'influencer',
      name: 'Influencer',
      description: 'Have 3 advisors with 80+ loyalty',
      unlocked: false,
      requirement: (state: GameState) =>
        state.advisors.filter(a => a.hired && a.loyalty >= 80).length >= 3
    }
  ];
}

function createOpposition(): Opposition[] {
  return [
    {
      name: 'The Establishment',
      strength: 20,
      focus: ['NY', 'CA', 'DC'],
      strategy: 'defensive'
    },
    {
      name: 'Counter-Movement',
      strength: 15,
      focus: [],
      strategy: 'balanced'
    }
  ];
}

function createTutorial(): TutorialState {
  return {
    active: true,
    currentStage: 0,
    skipped: false,
    stages: [
      {
        id: 'welcome',
        title: 'Welcome to Culture War Tycoon',
        description: 'Welcome, Commander! You\'ve been chosen to lead a grassroots movement that will shape the cultural landscape. Your mission: build support across all 50 states while managing resources and avoiding platform bans.',
        objective: 'Click "Next" to begin your briefing',
        completed: false
      },
      {
        id: 'ui_overview',
        title: 'Command Center Overview',
        description: 'This is your command center. The map shows your support levels across states (darker colors = higher support). The center panel displays your resources and news. The right panel shows available actions and your advisory team.',
        objective: 'Familiarize yourself with the interface',
        highlight: 'map',
        completed: false
      },
      {
        id: 'resources',
        title: 'Understanding Resources',
        description: 'You manage four key resources: CLOUT (social media influence), FUNDS (campaign money), MOMENTUM (effectiveness multiplier), and RISK (exposure level). Keep Risk below 100 or face platform bans!',
        objective: 'Review your current resource levels',
        highlight: 'stats',
        completed: false
      },
      {
        id: 'first_action',
        title: 'Take Your First Action',
        description: 'Actions are how you spread your movement. Each action costs resources and has different effects. Try "Launch Meme Campaign" - it costs Clout but boosts support in multiple states.',
        objective: 'Perform the "Launch Meme Campaign" action',
        highlight: 'actions',
        completed: false
      },
      {
        id: 'advisors',
        title: 'Your Advisory Team',
        description: 'Advisors provide passive bonuses and special abilities. Each has Loyalty (affects bonus strength) and Morale (required for abilities). Keep them happy for maximum effectiveness!',
        objective: 'Review your advisors and their bonuses',
        highlight: 'advisors',
        completed: false
      },
      {
        id: 'advisor_abilities',
        title: 'Advisor Abilities',
        description: 'Each advisor has a unique ability on cooldown. Try using Mike MemeLord\'s "Viral Boost" ability for a powerful campaign boost! Abilities require 50+ Morale to use.',
        objective: 'Use an advisor ability',
        highlight: 'advisors',
        completed: false
      },
      {
        id: 'events',
        title: 'Handling Events',
        description: 'Random events will present strategic choices. Each option has different outcomes affecting your resources and support. Choose wisely - some decisions have long-term consequences!',
        objective: 'Wait for an event and make a choice',
        completed: false
      },
      {
        id: 'regional_strategy',
        title: 'Regional Strategy',
        description: 'States are grouped into regions (Northeast, Southeast, Midwest, etc.). Check regional influence in the stats panel. Some actions target specific regions for concentrated impact.',
        objective: 'View regional influence data',
        highlight: 'regions',
        completed: false
      },
      {
        id: 'achievements',
        title: 'Achievements & Progression',
        description: 'Unlock achievements by reaching milestones (high clout, regional dominance, etc.). Future updates will add perks tied to achievements. Track your progress in the stats panel.',
        objective: 'Check available achievements',
        highlight: 'achievements',
        completed: false
      },
      {
        id: 'opposition',
        title: 'Understanding Opposition',
        description: 'Opposition factions work against you every turn, reducing support in key states. Use "Gather Opposition Intel" action to counter their strategies and protect your gains.',
        objective: 'Review opposition faction information',
        completed: false
      },
      {
        id: 'victory_conditions',
        title: 'Victory & Defeat',
        description: 'WIN by reaching 80% average support across all states. LOSE if Risk hits 100% (platform ban). Balance aggressive expansion with risk management!',
        objective: 'Understand win/loss conditions',
        completed: false
      },
      {
        id: 'complete',
        title: 'Tutorial Complete!',
        description: 'You\'re ready to lead your movement to victory! Remember: balance resources, keep advisors loyal, manage risk, and respond strategically to events. Good luck, Commander!',
        objective: 'Bonus: +50 Clout, +100 Funds for completing tutorial',
        completed: false
      }
    ]
  };
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

  const initialAdvisors = generateAdvisors();
  const hiredAdvisors = initialAdvisors.slice(0, 2);  // Start with 2 hired advisors
  const availableAdvisors = initialAdvisors.slice(2); // Rest are available for hire

  return {
    turn: 0,
    support: supportInit,
    clout: 50,
    funds: 100,
    risk: 0,
    momentum: 50,
    advisors: hiredAdvisors,
    availableAdvisors: availableAdvisors,
    newsLog: ["Game start: Your movement is born. Spread influence and avoid getting banned!"],
    socialFeed: [],
    pendingEvent: undefined,
    victory: false,
    gameOver: false,
    achievements: createAchievements(),
    activePerks: [],
    regions: createRegions(),
    opposition: createOpposition(),
    activeNarratives: [],
    difficulty: 'normal',
    tutorial: createTutorial()
  };
}

// Helper function to apply advisor bonuses to an outcome
function applyAdvisorBonuses(outcome: EventOutcome, advisors: Advisor[]): EventOutcome {
  const hiredAdvisors = advisors.filter(a => a.hired);
  let cloutMultiplier = 1;
  let fundsMultiplier = 1;
  let supportMultiplier = 1;
  let riskMultiplier = 1;

  hiredAdvisors.forEach(advisor => {
    const loyaltyFactor = advisor.loyalty / 100;
    if (advisor.bonuses.cloutBonus) cloutMultiplier += (advisor.bonuses.cloutBonus / 100) * loyaltyFactor;
    if (advisor.bonuses.fundsBonus) fundsMultiplier += (advisor.bonuses.fundsBonus / 100) * loyaltyFactor;
    if (advisor.bonuses.supportBonus) supportMultiplier += (advisor.bonuses.supportBonus / 100) * loyaltyFactor;
    if (advisor.bonuses.riskReduction) riskMultiplier -= (advisor.bonuses.riskReduction / 100) * loyaltyFactor;
  });

  return {
    ...outcome,
    cloutDelta: outcome.cloutDelta ? Math.floor(outcome.cloutDelta * cloutMultiplier) : outcome.cloutDelta,
    fundsDelta: outcome.fundsDelta ? Math.floor(outcome.fundsDelta * fundsMultiplier) : outcome.fundsDelta,
    riskDelta: outcome.riskDelta ? Math.floor(outcome.riskDelta * Math.max(0, riskMultiplier)) : outcome.riskDelta,
    supportDelta: outcome.supportDelta ? Object.keys(outcome.supportDelta).reduce((acc, key) => {
      acc[key] = Math.floor((outcome.supportDelta![key] || 0) * supportMultiplier);
      return acc;
    }, {} as { [state: string]: number }) : outcome.supportDelta
  };
}

// Helper function to check and unlock achievements
function checkAchievements(state: GameState): GameState {
  const updatedAchievements = state.achievements.map(achievement => {
    if (!achievement.unlocked && achievement.requirement(state)) {
      return { ...achievement, unlocked: true };
    }
    return achievement;
  });

  const newlyUnlocked = updatedAchievements.filter((ach, idx) =>
    ach.unlocked && !state.achievements[idx].unlocked
  );

  const newsAdditions = newlyUnlocked.map(ach =>
    `Achievement Unlocked: ${ach.name} - ${ach.description}`
  );

  return {
    ...state,
    achievements: updatedAchievements,
    newsLog: [...state.newsLog, ...newsAdditions]
  };
}

// Helper function to update regional influence based on state support
function updateRegionalInfluence(state: GameState): GameState {
  const updatedRegions = state.regions.map(region => {
    const avgSupport = region.states.reduce((sum, stateCode) =>
      sum + (state.support[stateCode] || 0), 0
    ) / region.states.length;
    return { ...region, influence: Math.floor(avgSupport) };
  });

  return { ...state, regions: updatedRegions };
}

// Helper function to apply opposition effects
function applyOppositionEffects(state: GameState): GameState {
  let newSupport = { ...state.support };

  state.opposition.forEach(opp => {
    const effectiveStrength = opp.strength * (state.difficulty === 'easy' ? 0.5 : state.difficulty === 'hard' ? 1.5 : 1);

    if (opp.strategy === 'aggressive') {
      // Aggressive: target specific high-support states
      const targetStates = Object.keys(newSupport)
        .sort((a, b) => newSupport[b] - newSupport[a])
        .slice(0, 5);

      targetStates.forEach(stateCode => {
        newSupport[stateCode] = Math.max(0, newSupport[stateCode] - effectiveStrength / 10);
      });
    } else if (opp.strategy === 'defensive') {
      // Defensive: protect their focus states
      opp.focus.forEach(stateCode => {
        if (newSupport[stateCode]) {
          newSupport[stateCode] = Math.max(0, newSupport[stateCode] - effectiveStrength / 5);
        }
      });
    } else {
      // Balanced: small reduction everywhere
      Object.keys(newSupport).forEach(stateCode => {
        newSupport[stateCode] = Math.max(0, newSupport[stateCode] - effectiveStrength / 20);
      });
    }
  });

  return { ...state, support: newSupport };
}

// Helper function to update advisor morale and loyalty
function updateAdvisorStats(state: GameState, actionSuccess: boolean): GameState {
  const updatedAdvisors = state.advisors.map(advisor => {
    let loyaltyDelta = actionSuccess ? 2 : -1;
    let moraleDelta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;

    // Decrease ability cooldowns
    let updatedAbility = advisor.ability;
    if (updatedAbility && updatedAbility.currentCooldown > 0) {
      updatedAbility = { ...updatedAbility, currentCooldown: updatedAbility.currentCooldown - 1 };
    }

    return {
      ...advisor,
      loyalty: Math.max(0, Math.min(100, advisor.loyalty + loyaltyDelta)),
      morale: Math.max(0, Math.min(100, advisor.morale + moraleDelta)),
      ability: updatedAbility
    };
  });

  return { ...state, advisors: updatedAdvisors };
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
      let outcome: EventOutcome = config.perform(state);
      // Apply advisor bonuses to the outcome
      outcome = applyAdvisorBonuses(outcome, state.advisors);
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

      // Update advisor stats based on action success
      const actionSuccess = !!(
        (outcome.cloutDelta && outcome.cloutDelta > 0) ||
        (outcome.fundsDelta && outcome.fundsDelta > 0) ||
        (outcome.supportDelta && Object.keys(outcome.supportDelta).length > 0)
      );
      newState = updateAdvisorStats(newState, actionSuccess);

      // Apply opposition effects every turn
      newState = applyOppositionEffects(newState);

      // Update regional influence based on current support
      newState = updateRegionalInfluence(newState);

      // Check for achievement unlocks
      newState = checkAchievements(newState);

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

    case 'HIRE_ADVISOR': {
      const advisor = state.availableAdvisors.find(a => a.id === action.advisorId);
      if (!advisor) return state;

      if (state.funds < advisor.hireCost) {
        return {
          ...state,
          newsLog: [...state.newsLog, `Not enough funds to hire ${advisor.name}. Cost: $${advisor.hireCost}k`]
        };
      }

      return {
        ...state,
        funds: state.funds - advisor.hireCost,
        advisors: [...state.advisors, { ...advisor, hired: true }],
        availableAdvisors: state.availableAdvisors.filter(a => a.id !== action.advisorId),
        newsLog: [...state.newsLog, `Hired ${advisor.name} as ${advisor.role}`]
      };
    }

    case 'FIRE_ADVISOR': {
      const advisor = state.advisors.find(a => a.id === action.advisorId);
      if (!advisor) return state;

      return {
        ...state,
        advisors: state.advisors.filter(a => a.id !== action.advisorId),
        availableAdvisors: [...state.availableAdvisors, { ...advisor, hired: false, loyalty: 50, morale: 50 }],
        newsLog: [...state.newsLog, `Fired ${advisor.name}`]
      };
    }

    case 'USE_ADVISOR_ABILITY': {
      const advisor = state.advisors.find(a => a.id === action.advisorId);
      if (!advisor || !advisor.ability || advisor.ability.currentCooldown > 0) {
        return state;
      }

      if (advisor.morale < 50) {
        return {
          ...state,
          newsLog: [...state.newsLog, `${advisor.name}'s morale is too low to use their ability`]
        };
      }

      const outcome = advisor.ability.perform(state);
      const enhancedOutcome = applyAdvisorBonuses(outcome, state.advisors);

      // Apply outcome
      let newState = { ...state };
      if (enhancedOutcome.supportDelta) {
        const newSupport = { ...newState.support };
        for (const s in enhancedOutcome.supportDelta) {
          if (s === 'ALL') {
            for (const code in newSupport) {
              newSupport[code] = Math.max(0, Math.min(100, newSupport[code] + (enhancedOutcome.supportDelta[s] || 0)));
            }
          } else if (newSupport[s]) {
            newSupport[s] = Math.max(0, Math.min(100, newSupport[s] + enhancedOutcome.supportDelta[s]));
          }
        }
        newState.support = newSupport;
      }
      if (enhancedOutcome.cloutDelta) newState.clout = Math.max(0, newState.clout + enhancedOutcome.cloutDelta);
      if (enhancedOutcome.fundsDelta) newState.funds = Math.max(0, newState.funds + enhancedOutcome.fundsDelta);
      if (enhancedOutcome.riskDelta) newState.risk = Math.max(0, newState.risk + enhancedOutcome.riskDelta);

      // Update ability cooldown
      const updatedAdvisors = newState.advisors.map(a => {
        if (a.id === action.advisorId && a.ability) {
          return {
            ...a,
            ability: { ...a.ability, currentCooldown: a.ability.cooldown }
          };
        }
        return a;
      });

      newState.advisors = updatedAdvisors;
      newState.newsLog = [
        ...newState.newsLog,
        `${advisor.name} used ${advisor.ability.name}${enhancedOutcome.message ? ': ' + enhancedOutcome.message : ''}`
      ];

      return newState;
    }

    case 'ACTIVATE_PERK': {
      const achievement = state.achievements.find(a => a.perk && a.perk.id === action.perkId && a.unlocked);
      if (!achievement || !achievement.perk) return state;

      const perk = achievement.perk;
      if (state.activePerks.find(p => p.id === perk.id)) {
        return state; // Already active
      }

      const updatedState = {
        ...state,
        activePerks: [...state.activePerks, { ...perk, active: true }],
        newsLog: [...state.newsLog, `Activated perk: ${perk.name}`]
      };

      // Apply perk effect
      const effect = perk.effect(updatedState);
      return { ...updatedState, ...effect };
    }

    case 'DEACTIVATE_PERK': {
      return {
        ...state,
        activePerks: state.activePerks.filter(p => p.id !== action.perkId),
        newsLog: [...state.newsLog, `Deactivated perk`]
      };
    }

    case 'SKIP_TUTORIAL': {
      return {
        ...state,
        tutorial: {
          ...state.tutorial,
          active: false,
          skipped: true
        }
      };
    }

    case 'NEXT_TUTORIAL_STAGE': {
      if (!state.tutorial.active || state.tutorial.currentStage >= state.tutorial.stages.length - 1) {
        return state;
      }

      const currentStage = state.tutorial.stages[state.tutorial.currentStage];
      const updatedStages = state.tutorial.stages.map((stage, idx) =>
        idx === state.tutorial.currentStage ? { ...stage, completed: true } : stage
      );

      const nextStageIndex = state.tutorial.currentStage + 1;
      const isLastStage = nextStageIndex === state.tutorial.stages.length - 1;

      // If completing the tutorial, give bonus resources
      if (isLastStage) {
        return {
          ...state,
          clout: state.clout + 50,
          funds: state.funds + 100,
          tutorial: {
            ...state.tutorial,
            currentStage: nextStageIndex,
            stages: updatedStages,
            active: true,
            completedAt: state.turn
          },
          newsLog: [...state.newsLog, 'Tutorial completed! Received +50 Clout, +100 Funds']
        };
      }

      return {
        ...state,
        tutorial: {
          ...state.tutorial,
          currentStage: nextStageIndex,
          stages: updatedStages
        }
      };
    }

    case 'COMPLETE_TUTORIAL_STAGE': {
      const stageIndex = state.tutorial.stages.findIndex(s => s.id === action.stageId);
      if (stageIndex === -1 || stageIndex !== state.tutorial.currentStage) {
        return state;
      }

      const updatedStages = state.tutorial.stages.map((stage, idx) =>
        idx === stageIndex ? { ...stage, completed: true } : stage
      );

      return {
        ...state,
        tutorial: {
          ...state.tutorial,
          stages: updatedStages
        }
      };
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
