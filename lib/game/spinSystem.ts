// spinSystem.ts - Core 3-reel spin mechanics for the "Narrative Poker" system
import { GameState, EventOutcome } from './GameContext';
import { ACTION_REELS, MODIFIER_REELS, TARGET_REELS, ReelItem } from './reelConfigs';
import { calculateComboMultiplier, ComboResult } from './comboEngine';

// ================================
// SPIN STATE TYPES
// ================================

export interface SpinResult {
  action: ReelItem;
  modifier: ReelItem;
  target: ReelItem;
}

export interface LockedReels {
  action: boolean;
  modifier: boolean;
  target: boolean;
}

export interface SpinState {
  currentSpin: SpinResult | null;
  lockedReels: LockedReels;
  rerollCost: number;
  rerollsThisTurn: number;
  lastCombo: ComboResult | null;
}

export const INITIAL_SPIN_STATE: SpinState = {
  currentSpin: null,
  lockedReels: { action: false, modifier: false, target: false },
  rerollCost: 5, // Base clout cost to reroll
  rerollsThisTurn: 0,
  lastCombo: null,
};

// ================================
// SPIN MECHANICS
// ================================

/**
 * Spin a single reel, returning a weighted random result
 */
function spinReel(reel: ReelItem[], locked: boolean, current: ReelItem | null): ReelItem {
  if (locked && current) return current;

  // Calculate total weight
  const totalWeight = reel.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const item of reel) {
    random -= (item.weight || 1);
    if (random <= 0) return item;
  }

  return reel[reel.length - 1];
}

/**
 * Perform a full 3-reel spin
 */
export function performSpin(
  state: GameState,
  lockedReels: LockedReels,
  currentSpin: SpinResult | null
): SpinResult {
  // Filter reels based on prestige unlocks (future feature)
  const availableActions = ACTION_REELS.filter(a => !a.requiresUnlock || state.achievementsUnlocked?.includes(a.id));
  const availableModifiers = MODIFIER_REELS.filter(m => !m.requiresUnlock || state.achievementsUnlocked?.includes(m.id));
  const availableTargets = TARGET_REELS.filter(t => !t.requiresUnlock || state.achievementsUnlocked?.includes(t.id));

  return {
    action: spinReel(availableActions, lockedReels.action, currentSpin?.action || null),
    modifier: spinReel(availableModifiers, lockedReels.modifier, currentSpin?.modifier || null),
    target: spinReel(availableTargets, lockedReels.target, currentSpin?.target || null),
  };
}

/**
 * Calculate reroll cost (escalates with each reroll)
 */
export function getRerollCost(rerollsThisTurn: number, lockedCount: number): number {
  const baseCost = 5;
  const escalation = rerollsThisTurn * 3; // +3 clout per reroll
  const lockDiscount = lockedCount * 2; // -2 clout per locked reel
  return Math.max(1, baseCost + escalation - lockDiscount);
}

/**
 * Check if player can afford to reroll
 */
export function canAffordReroll(clout: number, rerollsThisTurn: number, lockedCount: number): boolean {
  return clout >= getRerollCost(rerollsThisTurn, lockedCount);
}

// ================================
// SPIN OUTCOME RESOLUTION
// ================================

/**
 * Resolve a spin into game effects
 */
export function resolveSpinOutcome(
  spin: SpinResult,
  state: GameState,
  comboResult: ComboResult
): EventOutcome {
  const { action, modifier, target } = spin;

  // Get base effects from action
  let supportDelta: { [key: string]: number } = { ...action.effects.supportDelta };
  let fundsDelta = action.effects.fundsDelta || 0;
  let cloutDelta = action.effects.cloutDelta || 0;
  let riskDelta = action.effects.riskDelta || 0;

  // Apply modifier effects
  if (modifier.effects.supportMultiplier) {
    for (const key of Object.keys(supportDelta)) {
      supportDelta[key] = Math.round(supportDelta[key] * modifier.effects.supportMultiplier);
    }
  }
  if (modifier.effects.riskMultiplier) {
    riskDelta = Math.round(riskDelta * modifier.effects.riskMultiplier);
  }
  if (modifier.effects.fundsDelta) {
    fundsDelta += modifier.effects.fundsDelta;
  }
  if (modifier.effects.cloutDelta) {
    cloutDelta += modifier.effects.cloutDelta;
  }
  if (modifier.effects.riskDelta) {
    riskDelta += modifier.effects.riskDelta;
  }

  // Apply target effects (regional focus)
  supportDelta = applyTargetEffects(supportDelta, target, state);

  // Apply combo multiplier to positive effects
  if (comboResult.multiplier > 1) {
    for (const key of Object.keys(supportDelta)) {
      if (supportDelta[key] > 0) {
        supportDelta[key] = Math.round(supportDelta[key] * comboResult.multiplier);
      }
    }
    if (fundsDelta > 0) {
      fundsDelta = Math.round(fundsDelta * comboResult.multiplier);
    }
    if (cloutDelta > 0) {
      cloutDelta = Math.round(cloutDelta * comboResult.multiplier);
    }
  }

  // Generate message
  const baseMessage = `${action.name} + ${modifier.name} targeting ${target.name}`;
  const comboMessage = comboResult.comboName ? ` [${comboResult.comboName}! x${comboResult.multiplier}]` : '';

  return {
    supportDelta: Object.keys(supportDelta).length > 0 ? supportDelta : undefined,
    fundsDelta: fundsDelta !== 0 ? fundsDelta : undefined,
    cloutDelta: cloutDelta !== 0 ? cloutDelta : undefined,
    riskDelta: riskDelta !== 0 ? riskDelta : undefined,
    message: baseMessage + comboMessage,
  };
}

/**
 * Apply target-specific effects to support changes
 */
function applyTargetEffects(
  supportDelta: { [key: string]: number },
  target: ReelItem,
  state: GameState
): { [key: string]: number } {
  const result: { [key: string]: number } = {};

  // Handle "ALL" targets
  if (supportDelta['ALL']) {
    const allDelta = supportDelta['ALL'];

    if (target.targetStates === 'ALL') {
      // Apply to all states
      for (const stateCode of Object.keys(state.support)) {
        result[stateCode] = allDelta;
      }
    } else if (target.targetStates) {
      // Apply to specific states with bonus
      for (const stateCode of target.targetStates) {
        if (state.support[stateCode] !== undefined) {
          result[stateCode] = Math.round(allDelta * (target.effects.supportMultiplier || 1.5));
        }
      }
    }
  } else {
    // Non-ALL support deltas: apply target multiplier to specific states
    for (const [stateCode, delta] of Object.entries(supportDelta)) {
      if (target.targetStates === 'ALL') {
        result[stateCode] = delta;
      } else if (target.targetStates?.includes(stateCode)) {
        result[stateCode] = Math.round(delta * (target.effects.supportMultiplier || 1.5));
      } else {
        result[stateCode] = delta;
      }
    }
  }

  return result;
}

// ================================
// SPIN COST CALCULATION
// ================================

/**
 * Calculate the cost to execute current spin
 */
export function getSpinCost(spin: SpinResult): { funds: number; clout: number } {
  const baseFunds = spin.action.cost?.funds || 0;
  const baseClout = spin.action.cost?.clout || 0;

  // Modifier can adjust costs
  const fundsMod = spin.modifier.effects.costMultiplier || 1;
  const cloutMod = spin.modifier.effects.costMultiplier || 1;

  return {
    funds: Math.round(baseFunds * fundsMod),
    clout: Math.round(baseClout * cloutMod),
  };
}

/**
 * Check if player can afford to execute spin
 */
export function canAffordSpin(spin: SpinResult, funds: number, clout: number): boolean {
  const cost = getSpinCost(spin);
  return funds >= cost.funds && clout >= cost.clout;
}

// ================================
// SPIN VALIDATION
// ================================

/**
 * Check if spin can be executed (resources, game state, etc.)
 */
export function canExecuteSpin(
  spin: SpinResult | null,
  state: GameState
): { canExecute: boolean; reason?: string } {
  if (!spin) {
    return { canExecute: false, reason: 'No spin result - spin the reels first!' };
  }

  if (state.pendingEvent) {
    return { canExecute: false, reason: 'Resolve the current event first' };
  }

  if (state.victory || state.gameOver) {
    return { canExecute: false, reason: 'Game has ended' };
  }

  const cost = getSpinCost(spin);
  if (state.funds < cost.funds) {
    return { canExecute: false, reason: `Need $${cost.funds} (have $${state.funds})` };
  }
  if (state.clout < cost.clout) {
    return { canExecute: false, reason: `Need ${cost.clout} clout (have ${state.clout})` };
  }

  // Check action-specific restrictions
  if (spin.action.riskThreshold && state.risk >= spin.action.riskThreshold) {
    return { canExecute: false, reason: `${spin.action.name} locked above ${spin.action.riskThreshold}% risk` };
  }

  return { canExecute: true };
}
