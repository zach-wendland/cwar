/**
 * Game Balance Constants
 *
 * This file contains all magic numbers used in game calculations.
 * Each constant is documented with its purpose and design rationale.
 */

// =============================================================================
// CRITICAL HIT SYSTEM
// =============================================================================

/**
 * Base chance for a critical hit on any action.
 * 8% was chosen to make crits feel special but not rare:
 * - Lower than 10% to prevent expectation of frequent crits
 * - Higher than 5% to ensure players experience them in most sessions
 * - Roughly 1 crit per 12-13 actions
 */
export const CRITICAL_HIT_CHANCE = 0.08;

/**
 * Multiplier applied to all positive outcomes on critical hit.
 * 1.75x was chosen for satisfying impact without being overpowered:
 * - Not 2x because that would make late-game crits too swingy
 * - Not 1.5x because that doesn't feel impactful enough
 * - 1.75x provides a noticeable boost that feels rewarding
 */
export const CRITICAL_MULTIPLIER = 1.75;

// =============================================================================
// VICTORY CONDITIONS
// =============================================================================

/**
 * Average support threshold for Popular Mandate victory.
 * 80% was chosen as the primary win condition:
 * - High enough to require sustained effort across many states
 * - Low enough to be achievable within 30-50 turns
 * - Represents a clear majority without requiring perfection (100%)
 */
export const VICTORY_AVG_SUPPORT_THRESHOLD = 80;

/**
 * Number of states required to control for Speed Run victory.
 * 35 out of 51 states (including DC) = ~69% of states:
 * - Creates tension between speed and thoroughness
 * - Allows for strategic state selection rather than full coverage
 */
export const VICTORY_STATES_CONTROLLED_THRESHOLD = 35;

/**
 * Support threshold to consider a state "controlled".
 * 60% was chosen as a moderate majority:
 * - Above simple majority (51%) to ensure stable control
 * - Below overwhelming (75%+) to allow faster progression
 */
export const STATE_CONTROL_THRESHOLD = 60;

/**
 * Minimum average support required for Speed Run victory.
 * Lower than normal victory (60% vs 80%) to balance the turn constraint.
 */
export const SPEED_RUN_SUPPORT_THRESHOLD = 60;

/**
 * Maximum turns allowed for Speed Run victory.
 * 10 turns forces aggressive, high-risk strategies.
 */
export const SPEED_RUN_TURN_LIMIT = 10;

/**
 * Faction support threshold for Faction Dominance victory.
 * 95% represents near-total faction loyalty.
 */
export const FACTION_DOMINANCE_THRESHOLD = 95;

/**
 * Total funds earned required for Economic Power victory.
 */
export const ECONOMIC_POWER_FUNDS_THRESHOLD = 2000;

/**
 * Total clout earned required for Economic Power victory.
 */
export const ECONOMIC_POWER_CLOUT_THRESHOLD = 1000;

// =============================================================================
// DEFEAT CONDITIONS
// =============================================================================

/**
 * Risk level that triggers instant game over.
 * 100% represents complete exposure and movement collapse.
 */
export const RISK_DEFEAT_THRESHOLD = 100;

/**
 * Minimum faction support before abandonment defeat.
 * Below 10% means the faction actively works against you.
 */
export const FACTION_ABANDONMENT_THRESHOLD = 10;

/**
 * Turns at zero funds before bankruptcy defeat.
 * 3 consecutive turns gives player recovery opportunity.
 */
export const BANKRUPTCY_TURNS_THRESHOLD = 3;

// =============================================================================
// EVENT SYSTEM
// =============================================================================

/**
 * Base chance for an event to generate each turn.
 * 30% creates variety without overwhelming the player:
 * - Not every turn has an event, creating breathing room
 * - Frequent enough to maintain engagement
 */
export const EVENT_GENERATION_CHANCE = 0.30;

/**
 * First turn when events can appear.
 * Turn 3 gives players time to learn core mechanics first.
 */
export const EVENT_START_TURN = 3;

// =============================================================================
// RESOURCE STARTING VALUES
// =============================================================================

/**
 * Starting clout (reputation currency).
 * 50 allows 2-3 medium actions without earning more.
 */
export const STARTING_CLOUT = 50;

/**
 * Starting funds (money).
 * 100 allows 3-4 medium actions without fundraising.
 */
export const STARTING_FUNDS = 100;

/**
 * Starting risk level.
 * 0% represents a fresh movement with no exposure.
 */
export const STARTING_RISK = 0;

/**
 * Starting support in each state.
 * 20% represents minimal awareness in each state.
 */
export const STARTING_STATE_SUPPORT = 20;

// =============================================================================
// UI TIMING CONSTANTS
// =============================================================================

/**
 * Duration of screen shake effect in milliseconds.
 */
export const SCREEN_SHAKE_DURATION = 400;

/**
 * Duration of particle animations in milliseconds.
 */
export const PARTICLE_DURATION = 2000;

/**
 * Debounce delay for localStorage saves in milliseconds.
 * 500ms prevents excessive writes while ensuring saves happen promptly.
 */
export const LOCALSTORAGE_DEBOUNCE_MS = 500;

// =============================================================================
// ANIMATION EASING
// =============================================================================

/**
 * Custom cubic-bezier curve for snappy, responsive animations.
 * [0.16, 1, 0.3, 1] creates a quick start with a smooth finish.
 * Used across glass panels, modals, and UI transitions.
 */
export const EASING_SNAPPY: [number, number, number, number] = [0.16, 1, 0.3, 1];
