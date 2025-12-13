/**
 * Shared game calculations
 *
 * This file centralizes cost and outcome calculations to ensure
 * consistency between UI display and actual game logic.
 */

import { getRiskZone, RISK_ZONES } from './GameContext';

/**
 * Cost calculation input parameters
 */
interface CostInput {
  baseFunds?: number;
  baseClout?: number;
}

/**
 * Discount rates from advisors or other sources
 */
interface DiscountRates {
  fundsDiscount: number;  // Percentage discount (0-100)
  cloutDiscount: number;  // Percentage discount (0-100)
}

/**
 * Calculated adjusted costs
 */
export interface AdjustedCosts {
  funds: number;
  clout: number;
}

/**
 * Calculate adjusted action costs considering:
 * - Base action cost
 * - Advisor discounts
 * - Risk zone multipliers
 *
 * This is the single source of truth for cost calculations.
 * Both UI display and game logic should use this function.
 *
 * @param baseCost - The base costs from action config
 * @param discounts - Discount percentages from advisors
 * @param riskLevel - Current risk level (0-100)
 * @returns Adjusted costs after all modifiers
 */
export function calculateAdjustedCosts(
  baseCost: CostInput | undefined,
  discounts: DiscountRates,
  riskLevel: number
): AdjustedCosts {
  if (!baseCost) {
    return { funds: 0, clout: 0 };
  }

  const riskZone = getRiskZone(riskLevel);
  const costMultiplier = RISK_ZONES[riskZone].costMultiplier;

  return {
    funds: baseCost.baseFunds
      ? Math.round(baseCost.baseFunds * (1 - discounts.fundsDiscount / 100) * costMultiplier)
      : 0,
    clout: baseCost.baseClout
      ? Math.round(baseCost.baseClout * (1 - discounts.cloutDiscount / 100) * costMultiplier)
      : 0,
  };
}

/**
 * Check if player can afford the adjusted costs
 *
 * @param adjustedCosts - Costs after all modifiers
 * @param playerFunds - Player's current funds
 * @param playerClout - Player's current clout
 * @returns Object with canAfford boolean and reason if not
 */
export function canAffordCosts(
  adjustedCosts: AdjustedCosts,
  playerFunds: number,
  playerClout: number
): { canAfford: boolean; reason?: string } {
  if (adjustedCosts.funds > 0 && playerFunds < adjustedCosts.funds) {
    return {
      canAfford: false,
      reason: `Need $${adjustedCosts.funds} (have $${playerFunds})`,
    };
  }

  if (adjustedCosts.clout > 0 && playerClout < adjustedCosts.clout) {
    return {
      canAfford: false,
      reason: `Need ${adjustedCosts.clout} clout (have ${playerClout})`,
    };
  }

  return { canAfford: true };
}

/**
 * Calculate average support across all states
 *
 * @param support - Support map by state code
 * @returns Average support percentage (0-100)
 */
export function calculateAverageSupport(support: { [stateCode: string]: number }): number {
  const values = Object.values(support);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Count states with support at or above a threshold
 *
 * @param support - Support map by state code
 * @param threshold - Minimum support percentage to count (default 60)
 * @returns Number of states meeting threshold
 */
export function countControlledStates(
  support: { [stateCode: string]: number },
  threshold: number = 60
): number {
  return Object.values(support).filter(v => v >= threshold).length;
}
