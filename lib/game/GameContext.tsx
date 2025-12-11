import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { generateAdvisors, generateEvent, generateTweets, resetEventTracking } from './generators';
import { tryStartChain, progressChain, resetChainTracking, hasActiveChain, getActiveChainEvent, ChainedGameEvent } from './eventChains';
import {
  actionsConfig,
  canPerformAction,
  tickCooldowns,
  setActionCooldown,
  updateConsecutiveUses,
  getDiminishingReturnsMultiplier,
  ACTION_COOLDOWNS,
} from './actions';
import { factions, initializeFactionSupport, calculateFactionEffect } from './factions';
import { loadPrestigeData, getStartingBonuses, getActiveEffects } from './prestige';
import { applyAdvisorBonus, getActionDiscount, getCriticalBonus } from './advisorAbilities';
import { SpinResult, getSpinCost, resolveSpinOutcome } from './spinSystem';
import { ComboResult, calculateComboMultiplier } from './comboEngine';
import {
  SentimentState,
  FactionReaction,
  initializeSentimentState,
  processSpinSentiment,
  applySentimentDecay,
  generateSentimentWarnings,
  checkSentimentEvents,
} from './sentimentEngine';
import {
  applySentimentToSupportChange,
  getHostileFactionRiskPenalty,
  getSentimentCostMultiplier,
  getSentimentCritBonus,
  checkForSabotage,
  checkForFactionBonus,
} from './moodEffects';

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
  // Chain event metadata
  chainId?: string;
  stepId?: string;
  isChainEvent?: boolean;
}

export interface Tweet {
  user: string;
  content: string;
}

// Risk zone thresholds
export const RISK_ZONES = {
  SAFE: { min: 0, max: 49, color: 'green', label: 'Safe', costMultiplier: 1.0 },
  CAUTION: { min: 50, max: 74, color: 'yellow', label: 'Caution', costMultiplier: 1.0 },
  DANGER: { min: 75, max: 89, color: 'orange', label: 'Danger', costMultiplier: 1.2 },
  CRITICAL: { min: 90, max: 99, color: 'red', label: 'Critical', costMultiplier: 1.3 },
} as const;

export type RiskZone = keyof typeof RISK_ZONES;

export function getRiskZone(risk: number): RiskZone {
  if (risk >= 90) return 'CRITICAL';
  if (risk >= 75) return 'DANGER';
  if (risk >= 50) return 'CAUTION';
  return 'SAFE';
}

// Victory types
export type VictoryType = 'POPULAR_MANDATE' | 'FACTION_DOMINANCE' | 'ECONOMIC_POWER' | 'SPEED_RUN';

// Defeat types
export type DefeatType = 'RISK_COLLAPSE' | 'FACTION_ABANDONMENT' | 'BANKRUPTCY' | 'TIME_OUT';

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
  // Victory/Defeat details
  victoryType?: VictoryType;
  defeatType?: DefeatType;
  // Gamification features
  streak: number;
  highestStreak: number;
  lastActionWasCritical: boolean;
  totalCriticalHits: number;
  sessionFirstAction: boolean;
  achievementsUnlocked: string[];
  // Faction system
  factionSupport: { [factionId: string]: number };
  // Action economy tracking
  actionCooldowns: { [actionId: string]: number };
  consecutiveActionUses: { [actionId: string]: number };
  // Economic tracking for win conditions
  totalFundsEarned: number;
  totalCloutEarned: number;
  consecutiveNegativeFunds: number;
  // Last risk zone for warning triggers
  previousRiskZone: RiskZone;
  // Sentiment engine
  sentiment: SentimentState;
  recentReactions: FactionReaction[];
}

// Actions for the reducer
type GameAction =
  | { type: 'PERFORM_ACTION'; actionId: string }
  | { type: 'SPIN_ACTION'; spinResult: SpinResult; comboResult: ComboResult | null }
  | { type: 'REROLL_SPIN'; cost: number }
  | { type: 'RESOLVE_EVENT'; optionIndex: number }
  | { type: 'RESET_GAME' }
  | { type: 'CLEAR_CRITICAL_FLAG' };

// Critical hit chance (10%)
const CRITICAL_HIT_CHANCE = 0.10;

// Streak bonus thresholds
const STREAK_BONUSES = {
  3: { clout: 5, message: '🔥 3-Turn Streak! +5 Clout bonus!' },
  5: { funds: 20, message: '🔥 5-Turn Streak! +$20 Funds bonus!' },
  10: { supportBonus: true, message: '🔥 10-Turn Streak! +10% Support to a random state!' },
};

// Helper to create a fresh initial state
function createInitialState(): GameState {
  const stateCodes = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
                      "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
                      "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
                      "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
                      "WV","WI","WY"];

  // Load prestige bonuses
  const prestigeData = loadPrestigeData();
  const bonuses = getStartingBonuses(prestigeData);

  const supportInit: { [state: string]: number } = {};
  stateCodes.forEach(code => { supportInit[code] = 5 + bonuses.support; });

  // Initialize faction support with prestige bonuses
  const factionSupportInit = initializeFactionSupport();
  for (const factionId in bonuses.factionBonuses) {
    if (factionSupportInit[factionId] !== undefined) {
      factionSupportInit[factionId] = Math.min(100, factionSupportInit[factionId] + bonuses.factionBonuses[factionId]);
    }
  }

  const newsMessages = ["Game start: Your movement is born. Spread influence and avoid getting banned!"];
  if (bonuses.clout > 0 || bonuses.funds > 0 || bonuses.support > 0) {
    newsMessages.push(`Legacy bonuses applied: +${bonuses.clout} Clout, +$${bonuses.funds} Funds, +${bonuses.support}% Support`);
  }

  return {
    turn: 0,
    support: supportInit,
    clout: 50 + bonuses.clout,
    funds: 100 + bonuses.funds,
    risk: 0,
    advisors: generateAdvisors(),
    newsLog: newsMessages,
    socialFeed: [],
    pendingEvent: undefined,
    victory: false,
    gameOver: false,
    victoryType: undefined,
    defeatType: undefined,
    // Gamification
    streak: 0,
    highestStreak: 0,
    lastActionWasCritical: false,
    totalCriticalHits: 0,
    sessionFirstAction: true,
    achievementsUnlocked: [],
    // Faction system
    factionSupport: factionSupportInit,
    // Action economy tracking
    actionCooldowns: {},
    consecutiveActionUses: {},
    // Economic tracking
    totalFundsEarned: 0,
    totalCloutEarned: 0,
    consecutiveNegativeFunds: 0,
    previousRiskZone: 'SAFE',
    // Sentiment engine
    sentiment: initializeSentimentState(),
    recentReactions: [],
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
      result.supportDelta[key] = value > 0 ? Math.round(value * multiplier) : value;
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

// Victory condition checks
function checkVictoryConditions(state: GameState): VictoryType | null {
  const avgSupport = Object.values(state.support).reduce((a, b) => a + b, 0) / Object.keys(state.support).length;
  const statesControlled = Object.values(state.support).filter(s => s >= 60).length;
  const highestFaction = Math.max(...Object.values(state.factionSupport));

  // Popular Mandate: 80% avg support + 35 states at 60%+
  if (avgSupport >= 80 && statesControlled >= 35) return 'POPULAR_MANDATE';

  // Faction Dominance: Any faction at 95%+
  if (highestFaction >= 95) return 'FACTION_DOMINANCE';

  // Economic Power: Accumulated $500 funds and 200 clout over the game
  if (state.totalFundsEarned >= 500 && state.totalCloutEarned >= 200) return 'ECONOMIC_POWER';

  // Speed Run: Win before turn 20 with 75%+ avg support
  if (state.turn <= 20 && avgSupport >= 75) return 'SPEED_RUN';

  return null;
}

// Defeat condition checks
function checkDefeatConditions(state: GameState): DefeatType | null {
  // Risk Collapse: Risk hits 100
  if (state.risk >= 100) return 'RISK_COLLAPSE';

  // Faction Abandonment: Any faction at 0%
  const lowestFaction = Math.min(...Object.values(state.factionSupport));
  if (lowestFaction <= 0) return 'FACTION_ABANDONMENT';

  // Bankruptcy: Negative funds for 3+ consecutive turns
  if (state.consecutiveNegativeFunds >= 3) return 'BANKRUPTCY';

  // Time Out: Turn 50 without victory
  if (state.turn >= 50) return 'TIME_OUT';

  return null;
}

// Get victory message
function getVictoryMessage(type: VictoryType): string {
  switch (type) {
    case 'POPULAR_MANDATE': return '🏆 VICTORY: Popular Mandate! 80% support across 35+ states!';
    case 'FACTION_DOMINANCE': return '🏆 VICTORY: Faction Dominance! One group fully supports you!';
    case 'ECONOMIC_POWER': return '🏆 VICTORY: Economic Power! Your war chest is unstoppable!';
    case 'SPEED_RUN': return '🏆 VICTORY: Speed Run! 75%+ support in under 20 turns!';
  }
}

// Get defeat message
function getDefeatMessage(type: DefeatType): string {
  switch (type) {
    case 'RISK_COLLAPSE': return '💀 DEFEAT: Risk Collapse! All platforms have banned you.';
    case 'FACTION_ABANDONMENT': return '💀 DEFEAT: Faction Abandonment! You lost all support from a key group.';
    case 'BANKRUPTCY': return '💀 DEFEAT: Bankruptcy! No funds for 3 turns - movement collapsed.';
    case 'TIME_OUT': return '💀 DEFEAT: Time Out! 50 turns without victory - momentum lost.';
  }
}

// Reducer to handle game state transitions
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PERFORM_ACTION': {
      const config = actionsConfig.find(act => act.id === action.actionId);
      if (!config) return state;

      if (state.pendingEvent) {
        return state;
      }

      // Check action availability (cooldowns, prerequisites, risk zone locks)
      const actionCheck = canPerformAction(
        action.actionId,
        state,
        state.actionCooldowns,
        state.consecutiveActionUses
      );

      if (!actionCheck.canPerform) {
        return { ...state, newsLog: [...state.newsLog, `Cannot perform ${config.name}: ${actionCheck.reason}`] };
      }

      // Get advisor names for ability calculations
      const advisorNames = state.advisors.map(a => a.name);

      // Get action discounts from advisors
      const { fundsDiscount, cloutDiscount } = getActionDiscount(action.actionId, advisorNames);

      // Apply risk zone cost multiplier
      const riskZone = getRiskZone(state.risk);
      const riskCostMultiplier = RISK_ZONES[riskZone].costMultiplier;

      // Calculate actual costs after discounts and risk zone multiplier
      const actualFundsCost = config.cost?.funds
        ? Math.round(config.cost.funds * (1 - fundsDiscount / 100) * riskCostMultiplier)
        : 0;
      const actualCloutCost = config.cost?.clout
        ? Math.round(config.cost.clout * (1 - cloutDiscount / 100) * riskCostMultiplier)
        : 0;

      // Check resource costs (with discounts and risk zone multiplier applied)
      if (actualFundsCost > 0 && state.funds < actualFundsCost) {
        return { ...state, newsLog: [...state.newsLog, `Not enough funds for ${config.name} (need $${actualFundsCost})`] };
      }
      if (actualCloutCost > 0 && state.clout < actualCloutCost) {
        return { ...state, newsLog: [...state.newsLog, `Not enough clout for ${config.name} (need ${actualCloutCost})`] };
      }

      // Deduct costs (with discounts and risk zone multiplier)
      let newFunds = state.funds - actualFundsCost;
      let newClout = state.clout - actualCloutCost;

      // Check for critical hit (with advisor bonus)
      const critBonus = getCriticalBonus(advisorNames);
      const isCriticalHit = Math.random() < (CRITICAL_HIT_CHANCE + critBonus / 100);
      const critMultiplier = isCriticalHit ? 2 : 1;

      // Check for first action of session bonus (1.5x)
      const sessionMultiplier = state.sessionFirstAction ? 1.5 : 1;
      const finalMultiplier = isCriticalHit ? critMultiplier : sessionMultiplier;

      // Apply diminishing returns multiplier
      const diminishingMultiplier = actionCheck.diminishedMultiplier || 1;

      // Execute the action's effect with potential multiplier
      let outcome: EventOutcome = config.perform(state);

      // Apply diminishing returns first (reduces base effect)
      if (diminishingMultiplier < 1) {
        outcome = applyOutcomeWithMultiplier(outcome, diminishingMultiplier);
      }

      // Then apply critical hit or session bonus (amplifies reduced effect)
      if (finalMultiplier > 1) {
        outcome = applyOutcomeWithMultiplier(outcome, finalMultiplier);
      }

      // Apply advisor ability bonuses
      outcome = applyAdvisorBonus(outcome, config.id, advisorNames);

      // Apply outcome to state
      const newSupport = { ...state.support };
      const newFactionSupport = { ...state.factionSupport };

      // Calculate faction-specific effects for this action
      const baseSupportChange = outcome.supportDelta?.['ALL'] || 0;
      const factionEffects = baseSupportChange !== 0
        ? calculateFactionEffect(config.id, baseSupportChange, newFactionSupport)
        : {};

      // Update faction support levels
      for (const factionId in factionEffects) {
        newFactionSupport[factionId] = Math.max(0, Math.min(100,
          (newFactionSupport[factionId] || 50) + factionEffects[factionId]
        ));
      }

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

      const newCloutVal = Math.max(0, newClout + (outcome.cloutDelta || 0));
      const newFundsVal = Math.max(0, newFunds + (outcome.fundsDelta || 0));
      const newRiskVal = Math.max(0, state.risk + (outcome.riskDelta || 0));
      const newNewsLog = [...state.newsLog];

      if (isCriticalHit) {
        newNewsLog.push(`⚡ CRITICAL HIT! ${config.name} had double effect!`);
      } else if (state.sessionFirstAction) {
        newNewsLog.push(`☀️ Morning Momentum! First action bonus applied!`);
      }

      // Log diminishing returns warning
      if (diminishingMultiplier < 1) {
        const reduction = Math.round((1 - diminishingMultiplier) * 100);
        newNewsLog.push(`📉 Diminishing returns: ${config.name} effectiveness reduced by ${reduction}%`);
      }

      if (outcome.message) {
        newNewsLog.push(outcome.message);
      }

      // Check for risk zone change and add warning
      const newRiskZone = getRiskZone(newRiskVal);
      if (newRiskZone !== state.previousRiskZone) {
        const zoneInfo = RISK_ZONES[newRiskZone];
        if (newRiskZone === 'CAUTION') {
          newNewsLog.push(`⚠️ CAUTION ZONE (${zoneInfo.min}-${zoneInfo.max}%): Advisors are getting nervous.`);
        } else if (newRiskZone === 'DANGER') {
          newNewsLog.push(`🔶 DANGER ZONE (${zoneInfo.min}-${zoneInfo.max}%): Action costs +20%. Platform scrutiny increasing!`);
        } else if (newRiskZone === 'CRITICAL') {
          newNewsLog.push(`🔴 CRITICAL ZONE (${zoneInfo.min}%+): Costs +30%. Some actions LOCKED. One wrong move and it's over!`);
        }
      }

      // Calculate streak
      const riskIncreased = newRiskVal > state.risk;
      let newStreak = riskIncreased ? 0 : state.streak + 1;
      let newHighestStreak = Math.max(state.highestStreak, newStreak);

      // Check for streak bonuses
      const streakBonus = STREAK_BONUSES[newStreak as keyof typeof STREAK_BONUSES];
      let bonusClout = 0;
      let bonusFunds = 0;

      if (streakBonus) {
        newNewsLog.push(streakBonus.message);
        if ('clout' in streakBonus) bonusClout = streakBonus.clout;
        if ('funds' in streakBonus) bonusFunds = streakBonus.funds;
        if ('supportBonus' in streakBonus && streakBonus.supportBonus) {
          const randomState = getRandomStateCode(newSupport);
          newSupport[randomState] = Math.min(100, newSupport[randomState] + 10);
          newNewsLog.push(`🎯 ${randomState} received +10% support bonus!`);
        }
      }

      const newTurn = state.turn + 1;

      // Update cooldowns and consecutive uses
      const updatedCooldowns = setActionCooldown(action.actionId, tickCooldowns(state.actionCooldowns));
      const updatedConsecutiveUses = updateConsecutiveUses(action.actionId, state.consecutiveActionUses);

      // Track economic totals
      const fundsGained = outcome.fundsDelta && outcome.fundsDelta > 0 ? outcome.fundsDelta : 0;
      const cloutGained = outcome.cloutDelta && outcome.cloutDelta > 0 ? outcome.cloutDelta : 0;

      // Track consecutive negative funds
      const newConsecutiveNegativeFunds = newFundsVal <= 0
        ? state.consecutiveNegativeFunds + 1
        : 0;

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
        victoryType: undefined,
        defeatType: undefined,
        advisors: state.advisors,
        // Gamification updates
        streak: newStreak,
        highestStreak: newHighestStreak,
        lastActionWasCritical: isCriticalHit,
        totalCriticalHits: state.totalCriticalHits + (isCriticalHit ? 1 : 0),
        sessionFirstAction: false,
        achievementsUnlocked: state.achievementsUnlocked,
        // Faction system
        factionSupport: newFactionSupport,
        // Action economy tracking
        actionCooldowns: updatedCooldowns,
        consecutiveActionUses: updatedConsecutiveUses,
        // Economic tracking
        totalFundsEarned: state.totalFundsEarned + fundsGained,
        totalCloutEarned: state.totalCloutEarned + cloutGained,
        consecutiveNegativeFunds: newConsecutiveNegativeFunds,
        previousRiskZone: newRiskZone,
      };

      // Generate social media reactions
      const tweets = generateTweets(config.name);
      newState.socialFeed = [...state.socialFeed, ...tweets];

      // Possibly trigger a dynamic event
      // First check for active chain events, then try to start new chains, then regular events
      let event: GameEvent | null = null;

      // Check for continuation of active chain
      const activeChainEvent = getActiveChainEvent(newState);
      if (activeChainEvent) {
        event = activeChainEvent;
      } else if (newTurn === 1) {
        // First turn: guaranteed regular event
        event = generateEvent(newState);
      } else if (Math.random() < 0.3) {
        // 30% chance for event
        // 20% of that is chain start attempt, 80% regular event
        if (Math.random() < 0.2) {
          const chainEvent = tryStartChain(newState);
          event = chainEvent || generateEvent(newState);
        } else {
          event = generateEvent(newState);
        }
      }

      if (event) {
        if (event.options && event.options.length > 0) {
          newState.pendingEvent = event;
        } else {
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
          newState.newsLog.push(`${event.title}: ${event.description}`);
        }
      }

      // Check victory conditions (multiple paths to win)
      const victoryType = checkVictoryConditions(newState);
      if (victoryType) {
        newState.victory = true;
        newState.victoryType = victoryType;
        newState.newsLog.push(getVictoryMessage(victoryType));
      }

      // Check defeat conditions (multiple paths to lose)
      const defeatType = checkDefeatConditions(newState);
      if (defeatType) {
        newState.gameOver = true;
        newState.defeatType = defeatType;
        newState.newsLog.push(getDefeatMessage(defeatType));
      }

      return newState;
    }

    case 'SPIN_ACTION': {
      // New spin-based action system
      const { spinResult, comboResult } = action;

      if (state.pendingEvent) {
        return state;
      }

      // Calculate costs from spin
      const spinCost = getSpinCost(spinResult);

      // Check resource costs
      if (spinCost.funds > 0 && state.funds < spinCost.funds) {
        return { ...state, newsLog: [...state.newsLog, `Not enough funds (need $${spinCost.funds})`] };
      }
      if (spinCost.clout > 0 && state.clout < spinCost.clout) {
        return { ...state, newsLog: [...state.newsLog, `Not enough clout (need ${spinCost.clout})`] };
      }

      // Get advisor names for ability calculations
      const advisorNames = state.advisors.map(a => a.name);

      // Check for critical hit
      const critBonus = getCriticalBonus(advisorNames);
      const isCriticalHit = Math.random() < (CRITICAL_HIT_CHANCE + critBonus / 100);

      // Calculate combo result if not provided
      const finalComboResult = comboResult || calculateComboMultiplier(
        spinResult.action,
        spinResult.modifier,
        spinResult.target
      );

      // Resolve spin outcome
      let outcome = resolveSpinOutcome(spinResult, state, finalComboResult);

      // Apply critical hit multiplier on top of combo
      if (isCriticalHit) {
        outcome = applyOutcomeWithMultiplier(outcome, 2);
      }

      // Apply session first action bonus
      const sessionMultiplier = state.sessionFirstAction ? 1.5 : 1;
      if (!isCriticalHit && sessionMultiplier > 1) {
        outcome = applyOutcomeWithMultiplier(outcome, sessionMultiplier);
      }

      // Deduct costs
      let newFunds = state.funds - spinCost.funds;
      let newClout = state.clout - spinCost.clout;

      // Apply outcome to state
      const newSupport = { ...state.support };
      const newFactionSupport = { ...state.factionSupport };

      // Calculate faction effects for spin actions
      const baseSupportChange = outcome.supportDelta?.['ALL'] || 0;
      const factionEffects = baseSupportChange !== 0
        ? calculateFactionEffect(spinResult.action.id, baseSupportChange, newFactionSupport)
        : {};

      // Update faction support levels
      for (const factionId in factionEffects) {
        newFactionSupport[factionId] = Math.max(0, Math.min(100,
          (newFactionSupport[factionId] || 50) + factionEffects[factionId]
        ));
      }

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

      const newCloutVal = Math.max(0, newClout + (outcome.cloutDelta || 0));
      const newFundsVal = Math.max(0, newFunds + (outcome.fundsDelta || 0));
      const newRiskVal = Math.max(0, state.risk + (outcome.riskDelta || 0));
      const newNewsLog = [...state.newsLog];

      // Log spin result
      const spinDesc = `${spinResult.action.emoji} ${spinResult.action.name} + ${spinResult.modifier.emoji} ${spinResult.modifier.name} -> ${spinResult.target.emoji} ${spinResult.target.name}`;
      newNewsLog.push(spinDesc);

      if (finalComboResult.multiplier > 1) {
        const comboMsg = finalComboResult.comboName
          ? `🎰 ${finalComboResult.comboName}! ${finalComboResult.multiplier}x multiplier!`
          : `🎰 COMBO! ${finalComboResult.multiplier}x multiplier!`;
        newNewsLog.push(comboMsg);
      }

      if (isCriticalHit) {
        newNewsLog.push(`⚡ CRITICAL HIT! Double effect on top of combo!`);
      } else if (state.sessionFirstAction) {
        newNewsLog.push(`☀️ Morning Momentum! First action bonus applied!`);
      }

      if (outcome.message) {
        newNewsLog.push(outcome.message);
      }

      // Check for risk zone change
      const newRiskZone = getRiskZone(newRiskVal);
      if (newRiskZone !== state.previousRiskZone) {
        const zoneInfo = RISK_ZONES[newRiskZone];
        if (newRiskZone === 'CAUTION') {
          newNewsLog.push(`⚠️ CAUTION ZONE: Advisors are getting nervous.`);
        } else if (newRiskZone === 'DANGER') {
          newNewsLog.push(`🔶 DANGER ZONE: Costs +20%. Platform scrutiny increasing!`);
        } else if (newRiskZone === 'CRITICAL') {
          newNewsLog.push(`🔴 CRITICAL ZONE: Costs +30%. Some actions LOCKED!`);
        }
      }

      // Calculate streak
      const riskIncreased = newRiskVal > state.risk;
      let newStreak = riskIncreased ? 0 : state.streak + 1;
      let newHighestStreak = Math.max(state.highestStreak, newStreak);

      // Check for streak bonuses
      const streakBonus = STREAK_BONUSES[newStreak as keyof typeof STREAK_BONUSES];
      let bonusClout = 0;
      let bonusFunds = 0;

      if (streakBonus) {
        newNewsLog.push(streakBonus.message);
        if ('clout' in streakBonus) bonusClout = streakBonus.clout;
        if ('funds' in streakBonus) bonusFunds = streakBonus.funds;
        if ('supportBonus' in streakBonus && streakBonus.supportBonus) {
          const randomState = getRandomStateCode(newSupport);
          newSupport[randomState] = Math.min(100, newSupport[randomState] + 10);
          newNewsLog.push(`🎯 ${randomState} received +10% support bonus!`);
        }
      }

      const newTurn = state.turn + 1;

      // Update cooldowns (spin actions don't have traditional cooldowns, but we tick them)
      const updatedCooldowns = tickCooldowns(state.actionCooldowns);

      // Track economic totals
      const fundsGained = outcome.fundsDelta && outcome.fundsDelta > 0 ? outcome.fundsDelta : 0;
      const cloutGained = outcome.cloutDelta && outcome.cloutDelta > 0 ? outcome.cloutDelta : 0;

      // Track consecutive negative funds
      const newConsecutiveNegativeFunds = newFundsVal <= 0
        ? state.consecutiveNegativeFunds + 1
        : 0;

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
        victoryType: undefined,
        defeatType: undefined,
        advisors: state.advisors,
        streak: newStreak,
        highestStreak: newHighestStreak,
        lastActionWasCritical: isCriticalHit,
        totalCriticalHits: state.totalCriticalHits + (isCriticalHit ? 1 : 0),
        sessionFirstAction: false,
        achievementsUnlocked: state.achievementsUnlocked,
        factionSupport: newFactionSupport,
        actionCooldowns: updatedCooldowns,
        consecutiveActionUses: state.consecutiveActionUses,
        totalFundsEarned: state.totalFundsEarned + fundsGained,
        totalCloutEarned: state.totalCloutEarned + cloutGained,
        consecutiveNegativeFunds: newConsecutiveNegativeFunds,
        previousRiskZone: newRiskZone,
      };

      // Generate social media reactions
      const tweets = generateTweets(spinResult.action.name);
      newState.socialFeed = [...state.socialFeed, ...tweets];

      // Process sentiment reactions
      const { newSentiment, reactions } = processSpinSentiment(
        state.sentiment,
        spinResult,
        finalComboResult.multiplier,
        newTurn
      );
      newState.sentiment = applySentimentDecay(newSentiment, newTurn);
      newState.recentReactions = [...reactions, ...state.recentReactions].slice(0, 10);

      // Log significant sentiment changes
      for (const reaction of reactions) {
        if (reaction.moodChange) {
          newState.newsLog.push(reaction.message);
        }
      }

      // Add sentiment warnings
      const warnings = generateSentimentWarnings(newState.sentiment);
      for (const warning of warnings.slice(0, 2)) {
        if (Math.random() < 0.3) {
          newState.newsLog.push(warning);
        }
      }

      // Check for sabotage events from hostile factions
      const sabotage = checkForSabotage(newState.sentiment);
      if (sabotage) {
        newState.newsLog.push(`💥 ${sabotage.title}: ${sabotage.description}`);
        if (sabotage.outcome.riskDelta) newState.risk = Math.max(0, newState.risk + sabotage.outcome.riskDelta);
        if (sabotage.outcome.cloutDelta) newState.clout = Math.max(0, newState.clout + sabotage.outcome.cloutDelta);
        if (sabotage.outcome.fundsDelta) newState.funds = Math.max(0, newState.funds + sabotage.outcome.fundsDelta);
        if (sabotage.outcome.supportDelta?.random) {
          const randomState = getRandomStateCode(newState.support);
          newState.support[randomState] = Math.max(0, newState.support[randomState] + sabotage.outcome.supportDelta.random);
        }
      }

      // Check for bonus events from enthusiastic factions
      const bonus = checkForFactionBonus(newState.sentiment);
      if (bonus) {
        newState.newsLog.push(`🎉 ${bonus.title}: ${bonus.description}`);
        if (bonus.outcome.cloutDelta) newState.clout = Math.max(0, newState.clout + bonus.outcome.cloutDelta);
        if (bonus.outcome.fundsDelta) newState.funds = Math.max(0, newState.funds + bonus.outcome.fundsDelta);
        if (bonus.outcome.riskDelta) newState.risk = Math.max(0, newState.risk + bonus.outcome.riskDelta);
        if (bonus.outcome.supportDelta) {
          for (const [region, delta] of Object.entries(bonus.outcome.supportDelta)) {
            if (region === 'random') {
              const randomState = getRandomStateCode(newState.support);
              newState.support[randomState] = Math.min(100, newState.support[randomState] + (delta as number));
            } else if (region === 'midwest') {
              // Boost midwest states
              const midwestStates = ['ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'MI', 'IN', 'OH'];
              for (const st of midwestStates) {
                if (newState.support[st] !== undefined) {
                  newState.support[st] = Math.min(100, newState.support[st] + (delta as number));
                }
              }
            } else if (region === 'coastal') {
              // Boost coastal states
              const coastalStates = ['CA', 'OR', 'WA', 'NY', 'MA', 'CT', 'NJ', 'MD', 'VA', 'FL'];
              for (const st of coastalStates) {
                if (newState.support[st] !== undefined) {
                  newState.support[st] = Math.min(100, newState.support[st] + (delta as number));
                }
              }
            }
          }
        }
      }

      // Possibly trigger a dynamic event
      let event: GameEvent | null = null;

      const activeChainEvent = getActiveChainEvent(newState);
      if (activeChainEvent) {
        event = activeChainEvent;
      } else if (newTurn === 1) {
        event = generateEvent(newState);
      } else if (Math.random() < 0.3) {
        if (Math.random() < 0.2) {
          const chainEvent = tryStartChain(newState);
          event = chainEvent || generateEvent(newState);
        } else {
          event = generateEvent(newState);
        }
      }

      if (event) {
        if (event.options && event.options.length > 0) {
          newState.pendingEvent = event;
        } else {
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
          newState.newsLog.push(`${event.title}: ${event.description}`);
        }
      }

      // Check victory conditions
      const victoryType = checkVictoryConditions(newState);
      if (victoryType) {
        newState.victory = true;
        newState.victoryType = victoryType;
        newState.newsLog.push(getVictoryMessage(victoryType));
      }

      // Check defeat conditions
      const defeatType = checkDefeatConditions(newState);
      if (defeatType) {
        newState.gameOver = true;
        newState.defeatType = defeatType;
        newState.newsLog.push(getDefeatMessage(defeatType));
      }

      return newState;
    }

    case 'REROLL_SPIN': {
      // Deduct clout cost for rerolling (locking reels and spinning again)
      const { cost } = action;
      if (state.clout < cost) {
        return { ...state, newsLog: [...state.newsLog, `Not enough clout for reroll (need ${cost})`] };
      }
      return {
        ...state,
        clout: state.clout - cost,
        newsLog: [...state.newsLog, `Reroll! -${cost} clout`],
      };
    }

    case 'RESOLVE_EVENT': {
      if (!state.pendingEvent) return state;
      const event = state.pendingEvent;
      const choice = event.options && event.options[action.optionIndex];
      if (!choice) {
        return { ...state, pendingEvent: undefined };
      }

      // Handle chain event progression
      if (event.isChainEvent && event.chainId) {
        progressChain(event.chainId, action.optionIndex);
      }

      const outcome = choice.outcome;
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

      newNewsLog.push(`Event resolved: ${event.title} - Chose "${choice.text}"`);
      if (outcome.message) {
        newNewsLog.push(outcome.message);
      }

      // Track economic gains from events
      const fundsGained = outcome.fundsDelta && outcome.fundsDelta > 0 ? outcome.fundsDelta : 0;
      const cloutGained = outcome.cloutDelta && outcome.cloutDelta > 0 ? outcome.cloutDelta : 0;

      // Track consecutive negative funds
      const newConsecutiveNegativeFunds = newFundsVal <= 0
        ? state.consecutiveNegativeFunds + 1
        : 0;

      // Track risk zone changes
      const newRiskZone = getRiskZone(newRiskVal);

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
        victoryType: undefined,
        defeatType: undefined,
        turn: state.turn,
        socialFeed: [...state.socialFeed],
        advisors: state.advisors,
        lastActionWasCritical: false,
        // Preserve action economy state
        actionCooldowns: state.actionCooldowns,
        consecutiveActionUses: state.consecutiveActionUses,
        // Update economic tracking
        totalFundsEarned: state.totalFundsEarned + fundsGained,
        totalCloutEarned: state.totalCloutEarned + cloutGained,
        consecutiveNegativeFunds: newConsecutiveNegativeFunds,
        previousRiskZone: newRiskZone,
      };

      // Check victory conditions
      const victoryType = checkVictoryConditions(newState);
      if (victoryType) {
        newState.victory = true;
        newState.victoryType = victoryType;
        newState.newsLog.push(getVictoryMessage(victoryType));
      }

      // Check defeat conditions
      const defeatType = checkDefeatConditions(newState);
      if (defeatType) {
        newState.gameOver = true;
        newState.defeatType = defeatType;
        newState.newsLog.push(getDefeatMessage(defeatType));
      }

      return newState;
    }

    case 'CLEAR_CRITICAL_FLAG': {
      return { ...state, lastActionWasCritical: false };
    }

    case 'RESET_GAME': {
      resetEventTracking();
      resetChainTracking();
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
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initializer to avoid SSR issues with localStorage
  const initializeState = (): GameState => {
    if (typeof window === 'undefined') {
      return createInitialState();
    }

    const savedState = localStorage.getItem('gameSave');
    if (savedState) {
      const parsed = JSON.parse(savedState) as GameState;
      // Ensure new fields exist (migration for existing saves)
      return {
        ...parsed,
        streak: parsed.streak ?? 0,
        highestStreak: parsed.highestStreak ?? 0,
        lastActionWasCritical: parsed.lastActionWasCritical ?? false,
        totalCriticalHits: parsed.totalCriticalHits ?? 0,
        sessionFirstAction: true, // Reset on page load
        achievementsUnlocked: parsed.achievementsUnlocked ?? [],
        factionSupport: parsed.factionSupport ?? initializeFactionSupport(),
        // New action economy fields
        actionCooldowns: parsed.actionCooldowns ?? {},
        consecutiveActionUses: parsed.consecutiveActionUses ?? {},
        // New economic tracking fields
        totalFundsEarned: parsed.totalFundsEarned ?? 0,
        totalCloutEarned: parsed.totalCloutEarned ?? 0,
        consecutiveNegativeFunds: parsed.consecutiveNegativeFunds ?? 0,
        previousRiskZone: parsed.previousRiskZone ?? 'SAFE',
        // Victory/defeat type tracking
        victoryType: parsed.victoryType,
        defeatType: parsed.defeatType,
      };
    }
    return createInitialState();
  };

  const [state, dispatch] = useReducer(gameReducer, undefined, initializeState);

  // Persist game state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gameSave', JSON.stringify(state));
    }
  }, [state]);

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
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
