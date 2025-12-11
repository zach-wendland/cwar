import {
  actionsConfig,
  canPerformAction,
  getDiminishingReturnsMultiplier,
  isActionOnCooldown,
  tickCooldowns,
  setActionCooldown,
  updateConsecutiveUses,
  ACTION_COOLDOWNS,
  DIMINISHING_RETURNS,
} from "@/lib/game/actions";
import { GameState } from "@/lib/game/GameContext";

describe("actionsConfig", () => {
  const createMockState = (): GameState => ({
    turn: 1,
    support: {
      CA: 50,
      TX: 40,
      NY: 60,
      FL: 30,
    },
    clout: 50,
    funds: 100,
    risk: 20,
    advisors: [],
    newsLog: [],
    socialFeed: [],
    pendingEvent: undefined,
    victory: false,
    gameOver: false,
    victoryType: undefined,
    defeatType: undefined,
    streak: 0,
    highestStreak: 0,
    lastActionWasCritical: false,
    totalCriticalHits: 0,
    sessionFirstAction: true,
    achievementsUnlocked: [],
    factionSupport: {
      tech_workers: 50,
      rural_voters: 50,
      young_activists: 50,
      moderates: 50,
      business_class: 50,
    },
    actionCooldowns: {},
    consecutiveActionUses: {},
    totalFundsEarned: 0,
    totalCloutEarned: 0,
    consecutiveNegativeFunds: 0,
    previousRiskZone: 'SAFE',
  });

  it("should have 11 actions defined", () => {
    expect(actionsConfig.length).toBe(11);
  });

  describe("meme_campaign action", () => {
    const action = actionsConfig.find((a) => a.id === "meme_campaign");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have clout cost of 12 (rebalanced)", () => {
      expect(action?.cost?.clout).toBe(12);
    });

    it("should increase support in random states", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.supportDelta).toBeDefined();
      expect(Object.keys(outcome?.supportDelta || {}).length).toBeGreaterThan(0);
    });

    it("should increase risk by 6 (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(6);
    });

    it("should return clout delta of 3 (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.cloutDelta).toBe(3);
    });
  });

  describe("fundraise action", () => {
    const action = actionsConfig.find((a) => a.id === "fundraise");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have no cost", () => {
      expect(action?.cost?.funds).toBeUndefined();
      expect(action?.cost?.clout).toBeUndefined();
    });

    it("should add 40 funds (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.fundsDelta).toBe(40);
    });

    it("should increase risk by 5 (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(5);
    });
  });

  describe("rally action", () => {
    const action = actionsConfig.find((a) => a.id === "rally");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have funds cost of 35 (rebalanced)", () => {
      expect(action?.cost?.funds).toBe(35);
    });

    it("should target the 3 lowest states with graduated support boost", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      // FL has the lowest support (30), should get highest boost
      expect(outcome?.supportDelta?.FL).toBe(12);
      // TX is second lowest (40), should get 10
      expect(outcome?.supportDelta?.TX).toBe(10);
      // CA is third lowest (50), should get 8
      expect(outcome?.supportDelta?.CA).toBe(8);
    });

    it("should increase risk by 4 (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(4);
    });
  });

  describe("bot_army action", () => {
    const action = actionsConfig.find((a) => a.id === "bot_army");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have funds cost of 25 and clout cost of 8 (rebalanced)", () => {
      expect(action?.cost?.funds).toBe(25);
      expect(action?.cost?.clout).toBe(8);
    });

    it("should increase support in ALL states by 4 (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.supportDelta?.ALL).toBe(4);
    });

    it("should increase risk by 10 (rebalanced)", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(10);
    });
  });

  // New tests for action economy system
  describe("action cooldown system", () => {
    it("should define cooldowns for specific actions", () => {
      expect(ACTION_COOLDOWNS.legal_fund).toBe(3);
      expect(ACTION_COOLDOWNS.debate).toBe(2);
      expect(ACTION_COOLDOWNS.influencer).toBe(2);
      expect(ACTION_COOLDOWNS.platform_hop).toBe(4);
    });

    it("should check if action is on cooldown", () => {
      const cooldowns = { legal_fund: 2 };
      const result = isActionOnCooldown("legal_fund", cooldowns);
      expect(result.onCooldown).toBe(true);
      expect(result.turnsRemaining).toBe(2);
    });

    it("should tick cooldowns down each turn", () => {
      const cooldowns = { legal_fund: 3, debate: 1 };
      const updated = tickCooldowns(cooldowns);
      expect(updated.legal_fund).toBe(2);
      // debate: 1 - 1 = 0, which is kept but at 0 (or removed - check actual implementation)
      expect(updated.debate === undefined || updated.debate === 0).toBe(true);
    });

    it("should set cooldown after action use", () => {
      const cooldowns = {};
      const updated = setActionCooldown("legal_fund", cooldowns);
      expect(updated.legal_fund).toBe(3);
    });
  });

  describe("diminishing returns system", () => {
    it("should define diminishing returns for specific actions", () => {
      expect(DIMINISHING_RETURNS.fundraise).toBeDefined();
      expect(DIMINISHING_RETURNS.fundraise.maxStacks).toBe(3);
      expect(DIMINISHING_RETURNS.fundraise.reductionPerStack).toBe(0.25);
    });

    it("should return 1.0 multiplier when no consecutive uses", () => {
      const multiplier = getDiminishingReturnsMultiplier("fundraise", {});
      expect(multiplier).toBe(1);
    });

    it("should reduce multiplier based on consecutive uses", () => {
      const multiplier = getDiminishingReturnsMultiplier("fundraise", { fundraise: 2 });
      expect(multiplier).toBe(0.5); // 1 - (2 * 0.25)
    });

    it("should cap multiplier reduction at minimum", () => {
      const multiplier = getDiminishingReturnsMultiplier("fundraise", { fundraise: 10 });
      expect(multiplier).toBe(0.25); // Capped at minimum
    });

    it("should track and decay consecutive uses", () => {
      const uses = { fundraise: 2, meme_campaign: 1 };
      const updated = updateConsecutiveUses("fundraise", uses);
      expect(updated.fundraise).toBe(3); // Incremented
      expect(updated.meme_campaign).toBe(0); // Decayed
    });
  });

  describe("action prerequisites", () => {
    it("should block bot_army at high risk", () => {
      const state = createMockState();
      state.risk = 80;
      const result = canPerformAction("bot_army", state, {}, {});
      expect(result.canPerform).toBe(false);
      expect(result.reason).toContain("risky");
    });

    it("should allow bot_army at low risk", () => {
      const state = createMockState();
      state.risk = 20;
      const result = canPerformAction("bot_army", state, {}, {});
      expect(result.canPerform).toBe(true);
    });

    it("should block debate without enough clout", () => {
      const state = createMockState();
      state.clout = 20;
      const result = canPerformAction("debate", state, {}, {});
      expect(result.canPerform).toBe(false);
      expect(result.reason).toContain("clout");
    });

    it("should block influencer before turn 5", () => {
      const state = createMockState();
      state.turn = 3;
      const result = canPerformAction("influencer", state, {}, {});
      expect(result.canPerform).toBe(false);
      expect(result.reason).toContain("turn 5");
    });
  });
});
