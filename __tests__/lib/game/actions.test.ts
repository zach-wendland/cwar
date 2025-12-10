import { actionsConfig } from "@/lib/game/actions";
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
  });

  it("should have 11 actions defined", () => {
    expect(actionsConfig.length).toBe(11);
  });

  describe("meme_campaign action", () => {
    const action = actionsConfig.find((a) => a.id === "meme_campaign");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have clout cost of 10", () => {
      expect(action?.cost?.clout).toBe(10);
    });

    it("should increase support in random states", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.supportDelta).toBeDefined();
      expect(Object.keys(outcome?.supportDelta || {}).length).toBeGreaterThan(0);
    });

    it("should increase risk by 5", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(5);
    });

    it("should return clout delta of 5", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.cloutDelta).toBe(5);
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

    it("should add 50 funds", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.fundsDelta).toBe(50);
    });

    it("should increase risk by 2", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(2);
    });
  });

  describe("rally action", () => {
    const action = actionsConfig.find((a) => a.id === "rally");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have funds cost of 30", () => {
      expect(action?.cost?.funds).toBe(30);
    });

    it("should target the state with lowest support", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      // FL has the lowest support (30)
      expect(outcome?.supportDelta?.FL).toBe(10);
    });

    it("should increase risk by 3", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(3);
    });
  });

  describe("bot_army action", () => {
    const action = actionsConfig.find((a) => a.id === "bot_army");

    it("should exist", () => {
      expect(action).toBeDefined();
    });

    it("should have funds cost of 20 and clout cost of 5", () => {
      expect(action?.cost?.funds).toBe(20);
      expect(action?.cost?.clout).toBe(5);
    });

    it("should increase support in ALL states by 3", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.supportDelta?.ALL).toBe(3);
    });

    it("should increase risk by 15", () => {
      const state = createMockState();
      const outcome = action?.perform(state);
      expect(outcome?.riskDelta).toBe(15);
    });
  });
});
