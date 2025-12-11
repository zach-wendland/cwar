// actions.ts - define the available player actions and their effects
import { EventOutcome, GameState } from './GameContext';
import {
  PoliticalFactionId,
  getActionModifiers,
  getAdjustedCost,
} from './politicalFactions';

// ================================
// ACTION BALANCE CONSTANTS
// ================================

// Cooldowns: action ID -> number of turns before it can be used again
export const ACTION_COOLDOWNS: { [actionId: string]: number } = {
  legal_fund: 3,
  debate: 2,
  influencer: 2,
  platform_hop: 4,
};

// Diminishing returns: action ID -> { maxStacks, reductionPerStack }
export const DIMINISHING_RETURNS: { [actionId: string]: { maxStacks: number; reductionPerStack: number } } = {
  fundraise: { maxStacks: 3, reductionPerStack: 0.25 }, // After 3 uses: 25%, 50%, 75% reduction
  meme_campaign: { maxStacks: 2, reductionPerStack: 0.2 }, // After 2 uses: 20%, 40% reduction
};

// Prerequisites: action ID -> function that checks if action can be used
export const ACTION_PREREQUISITES: { [actionId: string]: (state: GameState) => { canUse: boolean; reason?: string } } = {
  rally: (state) => {
    const avgSupport = Object.values(state.support).reduce((a, b) => a + b, 0) / Object.keys(state.support).length;
    if (avgSupport < 15) {
      return { canUse: false, reason: 'Need at least 15% average support to organize rallies' };
    }
    return { canUse: true };
  },
  debate: (state) => {
    if (state.clout < 30) {
      return { canUse: false, reason: 'Need at least 30 clout to be taken seriously in debates' };
    }
    return { canUse: true };
  },
  influencer: (state) => {
    if (state.turn < 5) {
      return { canUse: false, reason: 'Influencers won\'t partner until turn 5 (need credibility)' };
    }
    return { canUse: true };
  },
  bot_army: (state) => {
    if (state.risk >= 75) {
      return { canUse: false, reason: 'Too risky! You\'re under too much scrutiny for bot deployment' };
    }
    return { canUse: true };
  },
};

// Risk zone locked actions: these actions are disabled in CRITICAL risk zone (90+)
export const RISK_ZONE_LOCKED_ACTIONS = ['bot_army', 'meme_campaign', 'hashtag'];

// ================================
// ACTION VALIDATION HELPERS
// ================================

/**
 * Check if an action is on cooldown
 */
export function isActionOnCooldown(
  actionId: string,
  cooldowns: { [actionId: string]: number }
): { onCooldown: boolean; turnsRemaining: number } {
  const remaining = cooldowns[actionId] || 0;
  return { onCooldown: remaining > 0, turnsRemaining: remaining };
}

/**
 * Get diminishing returns multiplier for an action
 */
export function getDiminishingReturnsMultiplier(
  actionId: string,
  consecutiveUses: { [actionId: string]: number }
): number {
  const config = DIMINISHING_RETURNS[actionId];
  if (!config) return 1;

  const uses = consecutiveUses[actionId] || 0;
  if (uses === 0) return 1;

  const effectiveUses = Math.min(uses, config.maxStacks);
  return Math.max(0.25, 1 - (effectiveUses * config.reductionPerStack));
}

/**
 * Check all prerequisites for an action
 */
export function checkActionPrerequisites(
  actionId: string,
  state: GameState
): { canUse: boolean; reason?: string } {
  const prereq = ACTION_PREREQUISITES[actionId];
  if (!prereq) return { canUse: true };
  return prereq(state);
}

/**
 * Comprehensive action availability check
 */
export function canPerformAction(
  actionId: string,
  state: GameState,
  cooldowns: { [actionId: string]: number },
  consecutiveUses: { [actionId: string]: number }
): { canPerform: boolean; reason?: string; diminishedMultiplier?: number } {
  // Check cooldown
  const cooldownCheck = isActionOnCooldown(actionId, cooldowns);
  if (cooldownCheck.onCooldown) {
    return { canPerform: false, reason: `On cooldown (${cooldownCheck.turnsRemaining} turns remaining)` };
  }

  // Check risk zone lock
  if (state.risk >= 90 && RISK_ZONE_LOCKED_ACTIONS.includes(actionId)) {
    return { canPerform: false, reason: 'Action locked in Critical risk zone' };
  }

  // Check prerequisites
  const prereqCheck = checkActionPrerequisites(actionId, state);
  if (!prereqCheck.canUse) {
    return { canPerform: false, reason: prereqCheck.reason };
  }

  // Calculate diminishing returns
  const diminishedMultiplier = getDiminishingReturnsMultiplier(actionId, consecutiveUses);

  return { canPerform: true, diminishedMultiplier };
}

/**
 * Update cooldowns after a turn (decrement all by 1)
 */
export function tickCooldowns(cooldowns: { [actionId: string]: number }): { [actionId: string]: number } {
  const updated: { [actionId: string]: number } = {};
  for (const [actionId, turns] of Object.entries(cooldowns)) {
    if (turns > 0) {
      updated[actionId] = turns - 1;
    }
  }
  return updated;
}

/**
 * Set cooldown for an action after use
 */
export function setActionCooldown(
  actionId: string,
  cooldowns: { [actionId: string]: number }
): { [actionId: string]: number } {
  const cooldownTurns = ACTION_COOLDOWNS[actionId];
  if (!cooldownTurns) return cooldowns;
  return { ...cooldowns, [actionId]: cooldownTurns };
}

/**
 * Update consecutive use tracking
 */
export function updateConsecutiveUses(
  actionId: string,
  consecutiveUses: { [actionId: string]: number }
): { [actionId: string]: number } {
  // Increment uses for this action
  const updated = { ...consecutiveUses };
  updated[actionId] = (updated[actionId] || 0) + 1;

  // Reset other actions with diminishing returns tracking
  for (const trackedAction of Object.keys(DIMINISHING_RETURNS)) {
    if (trackedAction !== actionId && updated[trackedAction]) {
      // Decay by 1 per turn instead of instant reset
      updated[trackedAction] = Math.max(0, updated[trackedAction] - 1);
    }
  }

  return updated;
}

// Schema for an action definition
export interface GameActionConfig {
  id: string;
  name: string;
  description: string;
  cost?: { funds?: number; clout?: number };
  perform: (state: GameState) => EventOutcome;
}

// ================================
// MULTIPLAYER ACTION HELPERS
// ================================

/**
 * Get action cost adjusted for faction modifiers
 */
export function getMultiplayerActionCost(
  actionId: string,
  factionId: PoliticalFactionId
): { funds?: number; clout?: number } {
  const action = actionsConfig.find(a => a.id === actionId);
  if (!action) return {};
  return getAdjustedCost(factionId, actionId, action.cost || {});
}

/**
 * Check if a player can afford an action
 */
export function canAffordAction(
  actionId: string,
  factionId: PoliticalFactionId,
  playerFunds: number,
  playerClout: number
): boolean {
  const cost = getMultiplayerActionCost(actionId, factionId);
  return (
    playerFunds >= (cost.funds || 0) &&
    playerClout >= (cost.clout || 0)
  );
}

/**
 * Apply faction modifiers to action outcome
 */
export function applyFactionModifiers(
  outcome: EventOutcome,
  actionId: string,
  factionId: PoliticalFactionId
): EventOutcome {
  const modifiers = getActionModifiers(factionId, actionId);

  // Apply effect multiplier to support changes
  const adjustedSupportDelta: { [key: string]: number } = {};
  if (outcome.supportDelta) {
    for (const [state, delta] of Object.entries(outcome.supportDelta)) {
      adjustedSupportDelta[state] = Math.round(delta * modifiers.effectMultiplier);
    }
  }

  // Apply risk multiplier
  const adjustedRiskDelta = outcome.riskDelta
    ? Math.round(outcome.riskDelta * modifiers.riskMultiplier)
    : undefined;

  // Clout gains can also be boosted (half the effect multiplier)
  const cloutBoost = modifiers.effectMultiplier > 1 ? (modifiers.effectMultiplier - 1) / 2 + 1 : 1;
  const adjustedCloutDelta = outcome.cloutDelta
    ? Math.round(outcome.cloutDelta * cloutBoost)
    : undefined;

  return {
    ...outcome,
    supportDelta: Object.keys(adjustedSupportDelta).length > 0 ? adjustedSupportDelta : undefined,
    riskDelta: adjustedRiskDelta,
    cloutDelta: adjustedCloutDelta,
  };
}

/**
 * Get action with faction context (for UI display)
 */
export function getActionWithFactionContext(
  actionId: string,
  factionId: PoliticalFactionId
): {
  action: GameActionConfig;
  adjustedCost: { funds?: number; clout?: number };
  modifiers: { costMultiplier: number; effectMultiplier: number; riskMultiplier: number };
  isStrength: boolean;
  isWeakness: boolean;
} | null {
  const action = actionsConfig.find(a => a.id === actionId);
  if (!action) return null;

  const modifiers = getActionModifiers(factionId, actionId);
  const adjustedCost = getAdjustedCost(factionId, actionId, action.cost || {});

  return {
    action,
    adjustedCost,
    modifiers,
    isStrength: modifiers.effectMultiplier > 1.2 || modifiers.costMultiplier < 0.8,
    isWeakness: modifiers.effectMultiplier < 0.9 || modifiers.costMultiplier > 1.2,
  };
}

/**
 * Get all actions categorized by faction affinity
 */
export function getActionsWithFactionAffinity(factionId: PoliticalFactionId): {
  strengths: GameActionConfig[];
  neutral: GameActionConfig[];
  weaknesses: GameActionConfig[];
} {
  const strengths: GameActionConfig[] = [];
  const neutral: GameActionConfig[] = [];
  const weaknesses: GameActionConfig[] = [];

  for (const action of actionsConfig) {
    const context = getActionWithFactionContext(action.id, factionId);
    if (!context) continue;

    if (context.isStrength) {
      strengths.push(action);
    } else if (context.isWeakness) {
      weaknesses.push(action);
    } else {
      neutral.push(action);
    }
  }

  return { strengths, neutral, weaknesses };
}

// Helper to get random states
function getRandomStates(support: { [key: string]: number }, count: number): string[] {
  const states = Object.keys(support);
  const selected: string[] = [];
  for (let i = 0; i < count && states.length > 0; i++) {
    const idx = Math.floor(Math.random() * states.length);
    selected.push(states[idx]);
    states.splice(idx, 1);
  }
  return selected;
}

// List of playable actions - REBALANCED for strategic depth
export const actionsConfig: GameActionConfig[] = [
  // =====================
  // CORE ACTIONS (Always available)
  // =====================
  {
    id: 'meme_campaign',
    name: 'Launch Meme Campaign',
    description: 'Create viral memes. Subject to diminishing returns if spammed.',
    cost: { clout: 12 },
    perform: (state: GameState) => {
      // Target 3 random states, but with faction awareness
      const supportDelta: { [state: string]: number } = {};
      const states = Object.keys(state.support);
      for (let i = 0; i < 3; i++) {
        const randState = states[Math.floor(Math.random() * states.length)];
        supportDelta[randState] = (supportDelta[randState] || 0) + 6;
      }
      return {
        supportDelta,
        riskDelta: 6, // Increased from 5
        cloutDelta: 3, // Reduced from 5
        message: 'Your meme campaign goes viral, boosting support in several states!'
      };
    }
  },
  {
    id: 'fundraise',
    name: 'Fundraise',
    description: 'Crowdfund from supporters. Returns diminish with overuse.',
    cost: {}, // Still free, but has diminishing returns
    perform: (state: GameState) => {
      // Base return, will be modified by diminishing returns system
      return {
        fundsDelta: 40, // Reduced from 50
        riskDelta: 5, // Increased from 2
        message: 'Fundraiser complete! Donations collected, but your visibility increased.'
      };
    }
  },
  {
    id: 'rally',
    name: 'Organize Rally',
    description: 'Hold a rally in your weakest state. Requires 15% avg support.',
    cost: { funds: 35 }, // Increased from 30
    perform: (state: GameState) => {
      // Find the 3 lowest states and boost them
      const sortedStates = Object.entries(state.support)
        .sort(([, a], [, b]) => a - b)
        .slice(0, 3);

      const supportDelta: { [state: string]: number } = {};
      sortedStates.forEach(([code], index) => {
        // More boost to the lowest, less to others
        supportDelta[code] = 12 - (index * 2); // 12, 10, 8
      });

      const targetStates = sortedStates.map(([code]) => code).join(', ');
      return {
        supportDelta,
        riskDelta: 4, // Increased from 3
        message: `Rally tour through ${targetStates}! Ground game strengthened.`
      };
    }
  },
  {
    id: 'bot_army',
    name: 'Deploy Bot Army',
    description: 'Risky propaganda bots. Locked above 75% risk. Angers Tech & Moderates.',
    cost: { funds: 25, clout: 8 }, // Increased costs
    perform: (state: GameState) => {
      return {
        supportDelta: { 'ALL': 4 }, // Increased from 3
        riskDelta: 10, // Reduced from 15 (more usable, but still risky)
        message: 'Bot army deployed! Support rises but you\'re attracting attention.'
      };
    }
  },

  // =====================
  // MEDIA & INFLUENCE ACTIONS
  // =====================
  {
    id: 'podcast',
    name: 'Podcast Appearance',
    description: 'Build credibility on popular shows. Safe, steady gains.',
    cost: { funds: 20 }, // Increased from 15
    perform: (state: GameState) => {
      return {
        cloutDelta: 10, // Reduced from 12
        riskDelta: 2,
        supportDelta: { 'ALL': 2 }, // Increased from 1
        message: 'Podcast appearance well-received! Building mainstream credibility.'
      };
    }
  },
  {
    id: 'hashtag',
    name: 'Coordinate Hashtag',
    description: 'Trend a hashtag in 2 states. Locked in Critical risk zone.',
    cost: { clout: 10 }, // Increased from 8
    perform: (state: GameState) => {
      const targetStates = getRandomStates(state.support, 2);
      const supportDelta: { [state: string]: number } = {};
      targetStates.forEach(s => {
        supportDelta[s] = 10; // Reduced from 12
      });
      return {
        supportDelta,
        riskDelta: 5, // Increased from 4
        cloutDelta: 2, // Reduced from 3
        message: `#YourMovement trends in ${targetStates.join(' and ')}!`
      };
    }
  },
  {
    id: 'debate',
    name: 'Debate Challenge',
    description: 'High-stakes debate. Requires 30 clout. 40% success rate. 2-turn cooldown.',
    cost: { funds: 30, clout: 15 }, // Increased costs
    perform: (state: GameState) => {
      // Success rate now 40% (was 60%), but scales with clout
      const cloutBonus = Math.min(state.clout / 200, 0.2); // Up to +20% at 200 clout
      const successRate = 0.4 + cloutBonus;
      const success = Math.random() < successRate;

      if (success) {
        return {
          supportDelta: { 'ALL': 5 }, // Reduced from 6
          cloutDelta: 20, // Reduced from 25
          riskDelta: 6, // Reduced from 8
          message: `Debate victory! (${Math.round(successRate * 100)}% chance succeeded)`
        };
      } else {
        return {
          supportDelta: { 'ALL': -3 }, // Increased penalty from -2
          cloutDelta: -10, // Increased penalty from -5
          riskDelta: 10, // Reduced from 12
          message: `Debate loss. Your opponent had good talking points.`
        };
      }
    }
  },

  // =====================
  // GRASSROOTS ACTIONS
  // =====================
  {
    id: 'canvass',
    name: 'Grassroots Canvassing',
    description: 'Door-to-door outreach in 5 states. Low risk, steady progress.',
    cost: { funds: 45 }, // Increased from 40
    perform: (state: GameState) => {
      const targetStates = getRandomStates(state.support, 5);
      const supportDelta: { [state: string]: number } = {};
      targetStates.forEach(s => {
        supportDelta[s] = 5; // Reduced from 6
      });
      return {
        supportDelta,
        riskDelta: 1,
        cloutDelta: 2, // Added small clout gain
        message: `Canvassing in ${targetStates.length} states. Building real connections.`
      };
    }
  },

  // =====================
  // HIGH-COST ACTIONS (Gated)
  // =====================
  {
    id: 'influencer',
    name: 'Influencer Partnership',
    description: 'Partner with major influencers. Available from turn 5. 2-turn cooldown.',
    cost: { funds: 60, clout: 20 }, // Increased from 50/15
    perform: (state: GameState) => {
      return {
        supportDelta: { 'ALL': 4 }, // Reduced from 5
        cloutDelta: 15, // Reduced from 20
        riskDelta: 5, // Reduced from 6
        message: 'Influencer collab successful! Millions reached.'
      };
    }
  },
  {
    id: 'legal_fund',
    name: 'Legal Defense Fund',
    description: 'Hire lawyers to reduce risk by 15. $150 cost. 3-turn cooldown.',
    cost: { funds: 150 }, // Increased from 80
    perform: (state: GameState) => {
      const riskReduction = Math.min(state.risk, 15); // Reduced from 20
      return {
        riskDelta: -riskReduction,
        cloutDelta: 3, // Reduced from 5
        message: `Legal team engaged! Risk reduced by ${riskReduction}.`
      };
    }
  },
  {
    id: 'platform_hop',
    name: 'Platform Migration',
    description: 'Move to a new platform. -25% risk but lose 4% support. 4-turn cooldown.',
    cost: { clout: 25 }, // Increased from 20
    perform: (state: GameState) => {
      const currentRisk = state.risk;
      const riskReduction = Math.floor(currentRisk * 0.25); // Reduced from 40%
      return {
        supportDelta: { 'ALL': -4 }, // Increased penalty from -3
        riskDelta: -riskReduction,
        cloutDelta: 5, // Reduced from 10
        message: `Migration complete! Risk -${riskReduction}, but lost some followers.`
      };
    }
  }
];
