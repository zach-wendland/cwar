import { actionsConfig } from '../actions';
import { GameState } from '../GameContext';

// Helper function to create a mock game state
const createMockState = (overrides?: Partial<GameState>): GameState => {
  const stateCodes = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI",
                      "ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN",
                      "MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH",
                      "OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
                      "WV","WI","WY"];
  const support: { [state: string]: number } = {};
  stateCodes.forEach(code => { support[code] = 5; });

  return {
    turn: 0,
    support,
    clout: 50,
    funds: 100,
    risk: 0,
    momentum: 50,
    advisors: [],
    availableAdvisors: [],
    newsLog: [],
    socialFeed: [],
    victory: false,
    gameOver: false,
    achievements: [],
    activePerks: [],
    regions: [
      { id: 'northeast', name: 'Northeast', states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'], influence: 0 },
      { id: 'southeast', name: 'Southeast', states: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'WV', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA'], influence: 0 },
      { id: 'midwest', name: 'Midwest', states: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'], influence: 0 },
      { id: 'southwest', name: 'Southwest', states: ['AZ', 'NM', 'OK', 'TX'], influence: 0 },
      { id: 'west', name: 'West', states: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA'], influence: 0 },
      { id: 'capital', name: 'Capital', states: ['DC'], influence: 0 }
    ],
    opposition: [
      { name: 'The Establishment', strength: 20, focus: ['NY', 'CA', 'DC'], strategy: 'defensive' },
      { name: 'Counter-Movement', strength: 15, focus: [], strategy: 'balanced' }
    ],
    activeNarratives: [],
    difficulty: 'normal',
    ...overrides
  };
};

describe('Actions', () => {
  describe('actionsConfig', () => {
    it('should have 11 actions defined', () => {
      expect(actionsConfig).toHaveLength(11);
    });

    it('should have all required action properties', () => {
      actionsConfig.forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('name');
        expect(action).toHaveProperty('description');
        expect(action).toHaveProperty('perform');
        expect(typeof action.perform).toBe('function');
      });
    });
  });

  describe('Meme Campaign Action', () => {
    const memeCampaign = actionsConfig.find(a => a.id === 'meme_campaign')!;

    it('should have correct cost', () => {
      expect(memeCampaign.cost).toEqual({ clout: 10 });
    });

    it('should increase support in some states', () => {
      const state = createMockState();
      const outcome = memeCampaign.perform(state);

      expect(outcome.supportDelta).toBeDefined();
      expect(Object.keys(outcome.supportDelta!).length).toBeGreaterThan(0);
    });

    it('should increase risk', () => {
      const state = createMockState();
      const outcome = memeCampaign.perform(state);

      expect(outcome.riskDelta).toBe(5);
    });

    it('should increase clout', () => {
      const state = createMockState();
      const outcome = memeCampaign.perform(state);

      expect(outcome.cloutDelta).toBe(5);
    });

    it('should return a message', () => {
      const state = createMockState();
      const outcome = memeCampaign.perform(state);

      expect(outcome.message).toBeDefined();
      expect(typeof outcome.message).toBe('string');
    });
  });

  describe('Fundraise Action', () => {
    const fundraise = actionsConfig.find(a => a.id === 'fundraise')!;

    it('should have no upfront cost', () => {
      expect(fundraise.cost).toEqual({});
    });

    it('should increase funds by 50', () => {
      const state = createMockState();
      const outcome = fundraise.perform(state);

      expect(outcome.fundsDelta).toBe(50);
    });

    it('should increase risk by 2', () => {
      const state = createMockState();
      const outcome = fundraise.perform(state);

      expect(outcome.riskDelta).toBe(2);
    });

    it('should return a message', () => {
      const state = createMockState();
      const outcome = fundraise.perform(state);

      expect(outcome.message).toBeDefined();
      expect(typeof outcome.message).toBe('string');
    });
  });

  describe('Rally Action', () => {
    const rally = actionsConfig.find(a => a.id === 'rally')!;

    it('should have correct cost', () => {
      expect(rally.cost).toEqual({ funds: 30 });
    });

    it('should increase support in the state with lowest support', () => {
      const state = createMockState({
        support: {
          ...createMockState().support,
          CA: 2,  // Lowest support
          TX: 10
        }
      });
      const outcome = rally.perform(state);

      expect(outcome.supportDelta).toBeDefined();
      expect(outcome.supportDelta!.CA).toBe(10);
    });

    it('should increase risk by 3', () => {
      const state = createMockState();
      const outcome = rally.perform(state);

      expect(outcome.riskDelta).toBe(3);
    });

    it('should return a message with state name', () => {
      const state = createMockState();
      const outcome = rally.perform(state);

      expect(outcome.message).toBeDefined();
      expect(typeof outcome.message).toBe('string');
      expect(outcome.message).toContain('rally');
    });
  });

  describe('Bot Army Action', () => {
    const botArmy = actionsConfig.find(a => a.id === 'bot_army')!;

    it('should have correct cost', () => {
      expect(botArmy.cost).toEqual({ funds: 20, clout: 5 });
    });

    it('should increase support in ALL states', () => {
      const state = createMockState();
      const outcome = botArmy.perform(state);

      expect(outcome.supportDelta).toBeDefined();
      expect(outcome.supportDelta!.ALL).toBe(3);
    });

    it('should increase risk by 15', () => {
      const state = createMockState();
      const outcome = botArmy.perform(state);

      expect(outcome.riskDelta).toBe(15);
    });

    it('should return a message', () => {
      const state = createMockState();
      const outcome = botArmy.perform(state);

      expect(outcome.message).toBeDefined();
      expect(typeof outcome.message).toBe('string');
    });
  });

  describe('Action Outcomes', () => {
    it('all actions should return valid outcomes', () => {
      const state = createMockState();

      actionsConfig.forEach(action => {
        const outcome = action.perform(state);

        // Outcome should be an object
        expect(typeof outcome).toBe('object');

        // If supportDelta exists, it should be an object
        if (outcome.supportDelta) {
          expect(typeof outcome.supportDelta).toBe('object');
        }

        // Deltas should be numbers if they exist
        if (outcome.cloutDelta !== undefined) {
          expect(typeof outcome.cloutDelta).toBe('number');
        }
        if (outcome.fundsDelta !== undefined) {
          expect(typeof outcome.fundsDelta).toBe('number');
        }
        if (outcome.riskDelta !== undefined) {
          expect(typeof outcome.riskDelta).toBe('number');
        }
      });
    });
  });

  describe('Action Costs', () => {
    it('should have costs that are reasonable', () => {
      actionsConfig.forEach(action => {
        if (action.cost?.funds) {
          expect(action.cost.funds).toBeGreaterThan(0);
          expect(action.cost.funds).toBeLessThan(1000);
        }
        if (action.cost?.clout) {
          expect(action.cost.clout).toBeGreaterThan(0);
          expect(action.cost.clout).toBeLessThan(100);
        }
      });
    });
  });

  describe('Deterministic vs Random Actions', () => {
    it('fundraise should have deterministic outcome', () => {
      const state = createMockState();
      const outcome1 = actionsConfig.find(a => a.id === 'fundraise')!.perform(state);
      const outcome2 = actionsConfig.find(a => a.id === 'fundraise')!.perform(state);

      expect(outcome1.fundsDelta).toBe(outcome2.fundsDelta);
      expect(outcome1.riskDelta).toBe(outcome2.riskDelta);
    });

    it('bot army should have deterministic outcome', () => {
      const state = createMockState();
      const outcome1 = actionsConfig.find(a => a.id === 'bot_army')!.perform(state);
      const outcome2 = actionsConfig.find(a => a.id === 'bot_army')!.perform(state);

      expect(outcome1.riskDelta).toBe(outcome2.riskDelta);
      expect(outcome1.supportDelta!.ALL).toBe(outcome2.supportDelta!.ALL);
    });
  });
});
