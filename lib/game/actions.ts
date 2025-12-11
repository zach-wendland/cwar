// actions.ts - define the available player actions and their effects
import { EventOutcome, GameState } from './GameContext';
import {
  PoliticalFactionId,
  getActionModifiers,
  getAdjustedCost,
} from './politicalFactions';

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

// List of playable actions
export const actionsConfig: GameActionConfig[] = [
  // =====================
  // ORIGINAL 4 ACTIONS
  // =====================
  {
    id: 'meme_campaign',
    name: 'Launch Meme Campaign',
    description: 'Spend clout to create a viral meme campaign that boosts your support base online.',
    cost: { clout: 10 },
    perform: (state: GameState) => {
      const supportDelta: { [state: string]: number } = {};
      const states = Object.keys(state.support);
      for (let i = 0; i < 3; i++) {
        const randState = states[Math.floor(Math.random() * states.length)];
        supportDelta[randState] = (supportDelta[randState] || 0) + 5;
      }
      return {
        supportDelta,
        riskDelta: 5,
        cloutDelta: 5,
        message: 'Your meme campaign goes viral, boosting support in several states!'
      };
    }
  },
  {
    id: 'fundraise',
    name: 'Fundraise',
    description: 'Raise funds from supporters through online crowdfunding.',
    cost: {},
    perform: (state: GameState) => {
      return {
        fundsDelta: 50,
        riskDelta: 2,
        message: 'You held a successful fundraiser and gained $50k in donations.'
      };
    }
  },
  {
    id: 'rally',
    name: 'Organize Rally',
    description: 'Spend funds to organize a rally in a target region to boost local support.',
    cost: { funds: 30 },
    perform: (state: GameState) => {
      let lowestState: string | null = null;
      let minSupport = 101;
      for (const s in state.support) {
        if (state.support[s] < minSupport) {
          minSupport = state.support[s];
          lowestState = s;
        }
      }
      const supportDelta: { [state: string]: number } = {};
      if (lowestState) {
        supportDelta[lowestState] = 10;
      }
      return {
        supportDelta,
        riskDelta: 3,
        message: `A rally is held in ${lowestState}, giving a boost to support there.`
      };
    }
  },
  {
    id: 'bot_army',
    name: 'Deploy Bot Army',
    description: 'Secretly deploy a bot army to spread propaganda (high risk, high reward).',
    cost: { funds: 20, clout: 5 },
    perform: (state: GameState) => {
      return {
        supportDelta: { 'ALL': 3 },
        riskDelta: 15,
        message: 'Bot army deployed nationwide, boosting influence everywhere (but greatly increasing exposure risk).'
      };
    }
  },

  // =====================
  // NEW ACTIONS
  // =====================
  {
    id: 'podcast',
    name: 'Podcast Appearance',
    description: 'Appear on a popular podcast to build credibility and reach new audiences.',
    cost: { funds: 15 },
    perform: (state: GameState) => {
      return {
        cloutDelta: 12,
        riskDelta: 2,
        supportDelta: { 'ALL': 1 },
        message: 'Your podcast appearance was well-received! Clout boosted with minimal risk.'
      };
    }
  },
  {
    id: 'hashtag',
    name: 'Coordinate Hashtag',
    description: 'Coordinate followers to trend a hashtag targeting specific regions.',
    cost: { clout: 8 },
    perform: (state: GameState) => {
      // Boost 2 random states significantly
      const targetStates = getRandomStates(state.support, 2);
      const supportDelta: { [state: string]: number } = {};
      targetStates.forEach(s => {
        supportDelta[s] = 12;
      });
      return {
        supportDelta,
        riskDelta: 4,
        cloutDelta: 3,
        message: `#YourMovement trends in ${targetStates.join(' and ')}! Significant support boost in those regions.`
      };
    }
  },
  {
    id: 'debate',
    name: 'Debate Challenge',
    description: 'Challenge critics to a public debate. High risk, but potentially huge rewards.',
    cost: { funds: 25, clout: 10 },
    perform: (state: GameState) => {
      // Random outcome - debates can go either way
      const success = Math.random() > 0.4; // 60% success rate
      if (success) {
        return {
          supportDelta: { 'ALL': 6 },
          cloutDelta: 25,
          riskDelta: 8,
          message: 'You dominated the debate! Clips go viral and support surges nationwide.'
        };
      } else {
        return {
          supportDelta: { 'ALL': -2 },
          cloutDelta: -5,
          riskDelta: 12,
          message: 'The debate didn\'t go as planned. Your opponent scored some points.'
        };
      }
    }
  },
  {
    id: 'canvass',
    name: 'Grassroots Canvassing',
    description: 'Deploy volunteers for door-to-door outreach. Slow but steady gains.',
    cost: { funds: 40 },
    perform: (state: GameState) => {
      // Boost 5 random states modestly
      const targetStates = getRandomStates(state.support, 5);
      const supportDelta: { [state: string]: number } = {};
      targetStates.forEach(s => {
        supportDelta[s] = 6;
      });
      return {
        supportDelta,
        riskDelta: 1,
        message: `Grassroots canvassing completed in ${targetStates.length} states. Steady progress made.`
      };
    }
  },
  {
    id: 'influencer',
    name: 'Influencer Partnership',
    description: 'Partner with major influencers to reach new demographics.',
    cost: { funds: 50, clout: 15 },
    perform: (state: GameState) => {
      return {
        supportDelta: { 'ALL': 5 },
        cloutDelta: 20,
        riskDelta: 6,
        message: 'Influencer collaboration was a hit! Your message reached millions of new people.'
      };
    }
  },
  {
    id: 'legal_fund',
    name: 'Legal Defense Fund',
    description: 'Invest in legal protection to reduce your exposure and risk.',
    cost: { funds: 80 },
    perform: (state: GameState) => {
      const riskReduction = Math.min(state.risk, 20); // Can't go below 0
      return {
        riskDelta: -riskReduction,
        cloutDelta: 5,
        message: `Legal team engaged! Risk reduced by ${riskReduction} points. You\'re better protected now.`
      };
    }
  },
  {
    id: 'platform_hop',
    name: 'Platform Migration',
    description: 'Migrate to a new platform to reduce dependency and risk, but lose some support.',
    cost: { clout: 20 },
    perform: (state: GameState) => {
      const currentRisk = state.risk;
      const riskReduction = Math.floor(currentRisk * 0.4); // Reduce risk by 40%
      return {
        supportDelta: { 'ALL': -3 },
        riskDelta: -riskReduction,
        cloutDelta: 10,
        message: `Platform migration complete! Risk reduced by ${riskReduction} but lost some casual followers.`
      };
    }
  }
];
