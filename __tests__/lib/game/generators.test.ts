import {
  generateAdvisors,
  generateEvent,
  generateTweets,
} from "@/lib/game/generators";
import { GameState } from "@/lib/game/GameContext";

describe("generators", () => {
  describe("generateAdvisors", () => {
    it("should return an array of 3 advisors", () => {
      const advisors = generateAdvisors();
      expect(advisors.length).toBe(3);
    });

    it("should return advisors with required properties", () => {
      const advisors = generateAdvisors();
      advisors.forEach((advisor) => {
        expect(advisor).toHaveProperty("name");
        expect(advisor).toHaveProperty("role");
        expect(advisor).toHaveProperty("ideology");
        expect(advisor).toHaveProperty("traits");
        expect(advisor).toHaveProperty("quotes");
        expect(Array.isArray(advisor.quotes)).toBe(true);
        expect(advisor.quotes.length).toBeGreaterThan(0);
      });
    });

    it("should include MemeLord advisor", () => {
      const advisors = generateAdvisors();
      const memeLord = advisors.find((a) => a.name.includes("MemeLord"));
      expect(memeLord).toBeDefined();
    });
  });

  describe("generateEvent", () => {
    const mockState: GameState = {
      turn: 1,
      support: { CA: 50, TX: 40, NY: 60, FL: 30 },
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
    };

    it("should return an event with title and description", () => {
      const event = generateEvent(mockState);
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("description");
      expect(typeof event.title).toBe("string");
      expect(typeof event.description).toBe("string");
    });

    it("should return either interactive or narrative event", () => {
      const event = generateEvent(mockState);
      const hasOptions =
        event.options && Array.isArray(event.options) && event.options.length > 0;
      const hasOutcome = event.outcome !== undefined;
      // Either has options (interactive) or has direct outcome (narrative)
      expect(hasOptions || hasOutcome).toBe(true);
    });

    it("interactive events should have valid options", () => {
      // Run multiple times to ensure we get an interactive event
      for (let i = 0; i < 20; i++) {
        const event = generateEvent(mockState);
        if (event.options && event.options.length > 0) {
          event.options.forEach((option) => {
            expect(option).toHaveProperty("text");
            expect(option).toHaveProperty("outcome");
          });
          return;
        }
      }
    });
  });

  describe("generateTweets", () => {
    it("should return an array of 3 tweets", () => {
      const tweets = generateTweets("Test Action");
      expect(tweets.length).toBe(3);
    });

    it("should return tweets with user and content", () => {
      const tweets = generateTweets("Test Action");
      tweets.forEach((tweet) => {
        expect(tweet).toHaveProperty("user");
        expect(tweet).toHaveProperty("content");
        expect(typeof tweet.user).toBe("string");
        expect(typeof tweet.content).toBe("string");
      });
    });

    it("should include the action name in tweets", () => {
      const actionName = "Launch Meme Campaign";
      const tweets = generateTweets(actionName);
      const containsActionName = tweets.some((tweet) =>
        tweet.content.includes(actionName)
      );
      expect(containsActionName).toBe(true);
    });

    it("should use @ handles for users", () => {
      const tweets = generateTweets("Test");
      tweets.forEach((tweet) => {
        expect(tweet.user.startsWith("@")).toBe(true);
      });
    });
  });
});
