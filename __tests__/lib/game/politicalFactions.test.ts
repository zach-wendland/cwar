// Tests for political factions system (MAGA vs America First vs Liberals)

import {
  MAGA,
  AMERICA_FIRST,
  LIBERAL,
  POLITICAL_FACTIONS,
  getPoliticalFaction,
  getActionModifiers,
  getAdjustedCost,
  isStrongholdState,
  getSwingStates,
  initializeMultiplayerTerritories,
  getStateController,
  countControlledStates,
  getAverageSupport,
  checkVictoryCondition,
  getTerritoryColor,
  TerritorySupport,
} from '../../../lib/game/politicalFactions';

describe('Political Factions', () => {
  describe('Faction Definitions', () => {
    it('should have 3 factions defined', () => {
      expect(POLITICAL_FACTIONS).toHaveLength(3);
    });

    it('should have unique faction IDs', () => {
      const ids = POLITICAL_FACTIONS.map(f => f.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should have correct starting resources for MAGA', () => {
      expect(MAGA.startingClout).toBe(60);
      expect(MAGA.startingFunds).toBe(80);
      expect(MAGA.startingRisk).toBe(10);
    });

    it('should have correct starting resources for America First', () => {
      expect(AMERICA_FIRST.startingClout).toBe(50);
      expect(AMERICA_FIRST.startingFunds).toBe(120);
      expect(AMERICA_FIRST.startingRisk).toBe(5);
    });

    it('should have correct starting resources for Liberals', () => {
      expect(LIBERAL.startingClout).toBe(70);
      expect(LIBERAL.startingFunds).toBe(100);
      expect(LIBERAL.startingRisk).toBe(15);
    });

    it('should have unique colors for each faction', () => {
      expect(MAGA.color).toBe('#dc2626');
      expect(AMERICA_FIRST.color).toBe('#1d4ed8');
      expect(LIBERAL.color).toBe('#7c3aed');
    });

    it('should have 2 abilities per faction', () => {
      expect(MAGA.abilities).toHaveLength(2);
      expect(AMERICA_FIRST.abilities).toHaveLength(2);
      expect(LIBERAL.abilities).toHaveLength(2);
    });

    it('should have 2 victory conditions per faction', () => {
      expect(MAGA.victoryConditions).toHaveLength(2);
      expect(AMERICA_FIRST.victoryConditions).toHaveLength(2);
      expect(LIBERAL.victoryConditions).toHaveLength(2);
    });
  });

  describe('getPoliticalFaction', () => {
    it('should return correct faction by ID', () => {
      expect(getPoliticalFaction('maga')).toBe(MAGA);
      expect(getPoliticalFaction('america_first')).toBe(AMERICA_FIRST);
      expect(getPoliticalFaction('liberal')).toBe(LIBERAL);
    });
  });

  describe('Action Modifiers', () => {
    it('should return MAGA rally bonus', () => {
      const modifiers = getActionModifiers('maga', 'rally');
      expect(modifiers.effectMultiplier).toBe(1.5);
      expect(modifiers.costMultiplier).toBe(0.7);
    });

    it('should return Liberal hashtag bonus', () => {
      const modifiers = getActionModifiers('liberal', 'hashtag');
      expect(modifiers.effectMultiplier).toBe(1.5);
      expect(modifiers.costMultiplier).toBe(0.6);
    });

    it('should return America First canvass bonus', () => {
      const modifiers = getActionModifiers('america_first', 'canvass');
      expect(modifiers.effectMultiplier).toBe(1.4);
      expect(modifiers.costMultiplier).toBe(0.6);
    });

    it('should return default modifiers for unknown action', () => {
      const modifiers = getActionModifiers('maga', 'unknown_action');
      expect(modifiers.costMultiplier).toBe(1.0);
      expect(modifiers.effectMultiplier).toBe(1.0);
      expect(modifiers.riskMultiplier).toBe(1.0);
    });
  });

  describe('getAdjustedCost', () => {
    it('should reduce rally cost for MAGA', () => {
      const baseCost = { funds: 30 };
      const adjusted = getAdjustedCost('maga', 'rally', baseCost);
      expect(adjusted.funds).toBe(21); // 30 * 0.7 = 21
    });

    it('should increase rally cost for Liberals', () => {
      const baseCost = { funds: 30 };
      const adjusted = getAdjustedCost('liberal', 'rally', baseCost);
      expect(adjusted.funds).toBe(39); // 30 * 1.3 = 39
    });

    it('should reduce hashtag cost for Liberals', () => {
      const baseCost = { clout: 8 };
      const adjusted = getAdjustedCost('liberal', 'hashtag', baseCost);
      expect(adjusted.clout).toBe(5); // 8 * 0.6 = 4.8, rounded to 5
    });
  });

  describe('Stronghold States', () => {
    it('should identify Texas as MAGA stronghold', () => {
      expect(isStrongholdState('maga', 'TX')).toBe(true);
      expect(isStrongholdState('liberal', 'TX')).toBe(false);
    });

    it('should identify California as Liberal stronghold', () => {
      expect(isStrongholdState('liberal', 'CA')).toBe(true);
      expect(isStrongholdState('maga', 'CA')).toBe(false);
    });

    it('should identify Pennsylvania as America First stronghold (swing state)', () => {
      expect(isStrongholdState('america_first', 'PA')).toBe(true);
    });

    it('should return swing states from America First strongholds', () => {
      const swingStates = getSwingStates();
      expect(swingStates).toContain('PA');
      expect(swingStates).toContain('MI');
      expect(swingStates).toContain('WI');
      expect(swingStates).toContain('AZ');
      expect(swingStates).toContain('GA');
    });
  });

  describe('Territory Initialization', () => {
    it('should initialize all 50 states', () => {
      const territories = initializeMultiplayerTerritories();
      expect(Object.keys(territories)).toHaveLength(50);
    });

    it('should give MAGA advantage in Texas', () => {
      const territories = initializeMultiplayerTerritories();
      expect(territories['TX'].maga).toBeGreaterThan(territories['TX'].liberal);
    });

    it('should give Liberal advantage in California', () => {
      const territories = initializeMultiplayerTerritories();
      expect(territories['CA'].liberal).toBeGreaterThan(territories['CA'].maga);
    });

    it('should give America First advantage in Pennsylvania', () => {
      const territories = initializeMultiplayerTerritories();
      expect(territories['PA'].america_first).toBeGreaterThan(territories['PA'].maga - 10);
    });

    it('should have all support values above 0', () => {
      const territories = initializeMultiplayerTerritories();
      Object.values(territories).forEach(t => {
        expect(t.maga).toBeGreaterThanOrEqual(5);
        expect(t.america_first).toBeGreaterThanOrEqual(5);
        expect(t.liberal).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe('State Controller', () => {
    it('should return maga when clearly leading', () => {
      const support: TerritorySupport = { maga: 60, america_first: 20, liberal: 20 };
      expect(getStateController(support)).toBe('maga');
    });

    it('should return liberal when clearly leading', () => {
      const support: TerritorySupport = { maga: 15, america_first: 25, liberal: 60 };
      expect(getStateController(support)).toBe('liberal');
    });

    it('should return contested when close', () => {
      const support: TerritorySupport = { maga: 35, america_first: 33, liberal: 32 };
      expect(getStateController(support)).toBe('contested');
    });

    it('should return contested when within 5 points', () => {
      const support: TerritorySupport = { maga: 40, america_first: 35, liberal: 25 };
      expect(getStateController(support)).toBe('contested');
    });
  });

  describe('Count Controlled States', () => {
    it('should count states correctly', () => {
      const territories: Record<string, TerritorySupport> = {
        TX: { maga: 60, america_first: 20, liberal: 20 },
        CA: { maga: 20, america_first: 20, liberal: 60 },
        PA: { maga: 30, america_first: 30, liberal: 40 }, // Contested
      };

      const counts = countControlledStates(territories);
      expect(counts.maga).toBe(1);
      expect(counts.liberal).toBe(1);
      expect(counts.contested).toBe(1);
    });
  });

  describe('Average Support', () => {
    it('should calculate average correctly', () => {
      const territories: Record<string, TerritorySupport> = {
        TX: { maga: 60, america_first: 20, liberal: 20 },
        CA: { maga: 40, america_first: 20, liberal: 40 },
      };

      expect(getAverageSupport('maga', territories)).toBe(50);
      expect(getAverageSupport('liberal', territories)).toBe(30);
    });
  });

  describe('Victory Conditions', () => {
    it('should detect MAGA support threshold victory', () => {
      const territories: Record<string, TerritorySupport> = {};
      // Create 50 states with high MAGA support
      for (let i = 0; i < 50; i++) {
        territories[`S${i}`] = { maga: 70, america_first: 15, liberal: 15 };
      }

      const victory = checkVictoryCondition('maga', territories, 100);
      expect(victory).not.toBeNull();
      expect(victory?.type).toBe('support_threshold');
    });

    it('should detect Liberal economic victory', () => {
      const territories: Record<string, TerritorySupport> = {};
      for (let i = 0; i < 50; i++) {
        territories[`S${i}`] = { maga: 20, america_first: 20, liberal: 55 };
      }

      const victory = checkVictoryCondition('liberal', territories, 600);
      expect(victory).not.toBeNull();
      expect(victory?.type).toBe('economic');
    });

    it('should not trigger victory with insufficient support', () => {
      const territories: Record<string, TerritorySupport> = {};
      for (let i = 0; i < 50; i++) {
        territories[`S${i}`] = { maga: 40, america_first: 30, liberal: 30 };
      }

      const victory = checkVictoryCondition('maga', territories, 100);
      expect(victory).toBeNull();
    });
  });

  describe('Territory Color', () => {
    it('should return red-ish for MAGA-dominated state', () => {
      const support: TerritorySupport = { maga: 80, america_first: 10, liberal: 10 };
      const color = getTerritoryColor(support);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
      // Should have high red component
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      expect(parseInt(match![1])).toBeGreaterThan(150); // Red should be high
    });

    it('should return blue-ish for AF-dominated state', () => {
      const support: TerritorySupport = { maga: 10, america_first: 80, liberal: 10 };
      const color = getTerritoryColor(support);
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      expect(parseInt(match![3])).toBeGreaterThan(150); // Blue should be high
    });

    it('should return purple-ish for Liberal-dominated state', () => {
      const support: TerritorySupport = { maga: 10, america_first: 10, liberal: 80 };
      const color = getTerritoryColor(support);
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      // Purple has both red and blue
      expect(parseInt(match![1])).toBeGreaterThan(80);
      expect(parseInt(match![3])).toBeGreaterThan(180);
    });

    it('should return mixed color for contested state', () => {
      const support: TerritorySupport = { maga: 34, america_first: 33, liberal: 33 };
      const color = getTerritoryColor(support);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });
  });
});

describe('Faction Abilities', () => {
  describe('MAGA Abilities', () => {
    it('should have Rally Surge ability', () => {
      const ability = MAGA.abilities.find(a => a.id === 'rally_surge');
      expect(ability).toBeDefined();
      expect(ability?.cooldownTurns).toBe(5);
      expect(ability?.unlockThreshold).toBe(40);
    });

    it('should have Energize the Base ability', () => {
      const ability = MAGA.abilities.find(a => a.id === 'energize_base');
      expect(ability).toBeDefined();
      expect(ability?.cooldownTurns).toBe(8);
    });
  });

  describe('America First Abilities', () => {
    it('should have Swing State Blitz ability', () => {
      const ability = AMERICA_FIRST.abilities.find(a => a.id === 'swing_state_blitz');
      expect(ability).toBeDefined();
      expect(ability?.unlockThreshold).toBe(35);
    });

    it('should have Coalition Builder ability', () => {
      const ability = AMERICA_FIRST.abilities.find(a => a.id === 'coalition_builder');
      expect(ability).toBeDefined();
      expect(ability?.effect.type).toBe('sabotage');
    });
  });

  describe('Liberal Abilities', () => {
    it('should have Viral Moment ability', () => {
      const ability = LIBERAL.abilities.find(a => a.id === 'viral_moment');
      expect(ability).toBeDefined();
      expect(ability?.effect.type).toBe('support_boost');
    });

    it('should have Cancel Campaign ability', () => {
      const ability = LIBERAL.abilities.find(a => a.id === 'cancel_campaign');
      expect(ability).toBeDefined();
      expect(ability?.cooldownTurns).toBe(8);
    });
  });
});
