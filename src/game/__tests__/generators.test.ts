import { generateAdvisors, generateEvent, generateTweets } from '../generators';
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
    advisors: [],
    newsLog: [],
    socialFeed: [],
    victory: false,
    gameOver: false,
    ...overrides
  };
};

describe('Generators', () => {
  describe('generateAdvisors', () => {
    it('should generate exactly 3 advisors', () => {
      const advisors = generateAdvisors();
      expect(advisors).toHaveLength(3);
    });

    it('should generate advisors with all required properties', () => {
      const advisors = generateAdvisors();

      advisors.forEach(advisor => {
        expect(advisor).toHaveProperty('name');
        expect(advisor).toHaveProperty('role');
        expect(advisor).toHaveProperty('ideology');
        expect(advisor).toHaveProperty('traits');
        expect(advisor).toHaveProperty('quotes');

        expect(typeof advisor.name).toBe('string');
        expect(typeof advisor.role).toBe('string');
        expect(typeof advisor.ideology).toBe('string');
        expect(typeof advisor.traits).toBe('string');
        expect(Array.isArray(advisor.quotes)).toBe(true);
      });
    });

    it('should generate advisors with 3 quotes each', () => {
      const advisors = generateAdvisors();

      advisors.forEach(advisor => {
        expect(advisor.quotes).toHaveLength(3);
        advisor.quotes.forEach(quote => {
          expect(typeof quote).toBe('string');
          expect(quote.length).toBeGreaterThan(0);
        });
      });
    });

    it('should generate specific advisors with expected names', () => {
      const advisors = generateAdvisors();
      const names = advisors.map(a => a.name);

      expect(names).toContain('Mike "MemeLord" Miller');
      expect(names).toContain('Dana Data');
      expect(names).toContain('Riley Rebel');
    });

    it('should generate advisors with different roles', () => {
      const advisors = generateAdvisors();
      const roles = advisors.map(a => a.role);

      expect(roles).toContain('Social Media Strategist');
      expect(roles).toContain('Analytics Guru');
      expect(roles).toContain('Grassroots Organizer');
    });

    it('should be deterministic (same output each time)', () => {
      const advisors1 = generateAdvisors();
      const advisors2 = generateAdvisors();

      expect(advisors1).toEqual(advisors2);
    });
  });

  describe('generateEvent', () => {
    it('should return an event object', () => {
      const state = createMockState();
      const event = generateEvent(state);

      expect(event).toBeDefined();
      expect(typeof event).toBe('object');
    });

    it('should have required event properties', () => {
      const state = createMockState();
      const event = generateEvent(state);

      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('description');
      expect(typeof event.title).toBe('string');
      expect(typeof event.description).toBe('string');
    });

    it('should generate either narrative or interactive events', () => {
      const state = createMockState();
      const events = [];

      // Generate multiple events to test randomness
      for (let i = 0; i < 20; i++) {
        events.push(generateEvent(state));
      }

      const narrativeEvents = events.filter(e => !e.options || e.options.length === 0);
      const interactiveEvents = events.filter(e => e.options && e.options.length > 0);

      // Should have both types
      expect(narrativeEvents.length).toBeGreaterThan(0);
      expect(interactiveEvents.length).toBeGreaterThan(0);
    });

    it('should have outcome for narrative events', () => {
      const state = createMockState();
      const events = [];

      // Generate events until we get a narrative one
      for (let i = 0; i < 20; i++) {
        const event = generateEvent(state);
        if (!event.options || event.options.length === 0) {
          events.push(event);
          break;
        }
      }

      if (events.length > 0) {
        const narrativeEvent = events[0];
        expect(narrativeEvent.outcome).toBeDefined();
        expect(narrativeEvent.outcome).toHaveProperty('cloutDelta');
      }
    });

    it('should have options for interactive events', () => {
      const state = createMockState();
      const events = [];

      // Generate events until we get an interactive one
      for (let i = 0; i < 20; i++) {
        const event = generateEvent(state);
        if (event.options && event.options.length > 0) {
          events.push(event);
          break;
        }
      }

      if (events.length > 0) {
        const interactiveEvent = events[0];
        expect(interactiveEvent.options).toBeDefined();
        expect(interactiveEvent.options!.length).toBeGreaterThan(0);
      }
    });

    it('should have valid event options structure', () => {
      const state = createMockState();
      let interactiveEvent;

      // Find an interactive event
      for (let i = 0; i < 20; i++) {
        const event = generateEvent(state);
        if (event.options && event.options.length > 0) {
          interactiveEvent = event;
          break;
        }
      }

      if (interactiveEvent && interactiveEvent.options) {
        interactiveEvent.options.forEach(option => {
          expect(option).toHaveProperty('text');
          expect(option).toHaveProperty('outcome');
          expect(typeof option.text).toBe('string');
          expect(typeof option.outcome).toBe('object');
        });
      }
    });

    it('interactive event should have exactly 3 options', () => {
      const state = createMockState();
      let interactiveEvent;

      // Find an interactive event
      for (let i = 0; i < 20; i++) {
        const event = generateEvent(state);
        if (event.options && event.options.length > 0) {
          interactiveEvent = event;
          break;
        }
      }

      if (interactiveEvent) {
        expect(interactiveEvent.options).toHaveLength(3);
      }
    });
  });

  describe('generateTweets', () => {
    it('should generate exactly 3 tweets', () => {
      const tweets = generateTweets('Test Action');
      expect(tweets).toHaveLength(3);
    });

    it('should generate tweets with required properties', () => {
      const tweets = generateTweets('Test Action');

      tweets.forEach(tweet => {
        expect(tweet).toHaveProperty('user');
        expect(tweet).toHaveProperty('content');
        expect(typeof tweet.user).toBe('string');
        expect(typeof tweet.content).toBe('string');
      });
    });

    it('should generate tweets with @ handles', () => {
      const tweets = generateTweets('Test Action');

      tweets.forEach(tweet => {
        expect(tweet.user).toMatch(/^@/);
      });
    });

    it('should reference the action name in tweets', () => {
      const actionName = 'Launch Meme Campaign';
      const tweets = generateTweets(actionName);

      // At least some tweets should reference the action
      const referenceCount = tweets.filter(t =>
        t.content.includes(actionName)
      ).length;

      expect(referenceCount).toBeGreaterThan(0);
    });

    it('should generate different tweets for different actions', () => {
      const tweets1 = generateTweets('Action One');
      const tweets2 = generateTweets('Action Two');

      // Content should be different
      expect(tweets1[0].content).not.toBe(tweets2[0].content);
    });

    it('should have non-empty tweet content', () => {
      const tweets = generateTweets('Test Action');

      tweets.forEach(tweet => {
        expect(tweet.content.length).toBeGreaterThan(0);
      });
    });

    it('should use random handles from predefined list', () => {
      const tweets = generateTweets('Test Action');
      const validHandles = ['@Anon123', '@MemeQueen', '@TruthHurts', '@SnarkyGuy', '@FanGirl'];

      tweets.forEach(tweet => {
        expect(validHandles).toContain(tweet.user);
      });
    });
  });

  describe('Generator Integration', () => {
    it('should work together to create complete game content', () => {
      const state = createMockState();

      // Generate all content types
      const advisors = generateAdvisors();
      const event = generateEvent(state);
      const tweets = generateTweets('Test Action');

      // All should be defined and valid
      expect(advisors).toHaveLength(3);
      expect(event).toBeDefined();
      expect(tweets).toHaveLength(3);
    });

    it('should produce consistent content types', () => {
      const state = createMockState();

      // Multiple calls should return objects of same structure
      const event1 = generateEvent(state);
      const event2 = generateEvent(state);

      expect(typeof event1.title).toBe(typeof event2.title);
      expect(typeof event1.description).toBe(typeof event2.description);
    });
  });
});
