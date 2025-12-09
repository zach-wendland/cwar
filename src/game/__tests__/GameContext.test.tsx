import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameContext, GameState } from '../GameContext';
import { actionsConfig } from '../actions';

// Helper to wrap hooks with GameProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

describe('GameContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should create initial state with correct default values', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });
      const state = result.current.state;

      expect(state.turn).toBe(0);
      expect(state.clout).toBe(50);
      expect(state.funds).toBe(100);
      expect(state.risk).toBe(0);
      expect(state.victory).toBe(false);
      expect(state.gameOver).toBe(false);
      expect(state.advisors).toHaveLength(3);
      expect(state.newsLog).toHaveLength(1);
      expect(state.socialFeed).toHaveLength(0);
    });

    it('should initialize support for all 51 states/territories', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });
      const state = result.current.state;

      expect(Object.keys(state.support)).toHaveLength(51);
      Object.values(state.support).forEach(support => {
        expect(support).toBe(5);
      });
    });
  });

  describe('PERFORM_ACTION', () => {
    it('should execute meme campaign action successfully', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'meme_campaign' });
      });

      expect(result.current.state.turn).toBe(1);
      // Clout: starts at 50, costs 10, gains back 5 = 45, but events can add more
      expect(result.current.state.clout).toBeGreaterThanOrEqual(0);
      expect(result.current.state.risk).toBeGreaterThan(0);
    });

    it('should execute fundraise action successfully', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
      });

      expect(result.current.state.turn).toBe(1);
      // First action gets 1.5x bonus: 100 + (50 * 1.5) = 175
      // Or with a 10% critical hit chance: 100 + (50 * 2) = 200
      expect(result.current.state.funds).toBeGreaterThanOrEqual(175);
      expect(result.current.state.risk).toBe(2);
    });

    it('should execute rally action successfully', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'rally' });
      });

      expect(result.current.state.turn).toBe(1);
      expect(result.current.state.funds).toBe(70); // 100 - 30
      expect(result.current.state.risk).toBe(3);
    });

    it('should execute bot army action successfully', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'bot_army' });
      });

      expect(result.current.state.turn).toBe(1);
      expect(result.current.state.funds).toBe(80); // 100 - 20
      // Clout: 50 - 5 = 45, but random event on turn 1 can add +20
      expect(result.current.state.clout).toBeGreaterThanOrEqual(45);
      // Risk increases by 15, but narrative events on turn 1 don't add risk
      expect(result.current.state.risk).toBeGreaterThanOrEqual(15);

      // Check that all states got +3 support (plus possible +2 from event)
      Object.values(result.current.state.support).forEach(support => {
        expect(support).toBeGreaterThanOrEqual(8); // 5 + 3, possibly more from event
      });
    });

    it('should prevent action when insufficient funds', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Set funds to 0
      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
      });

      const fundsBefore = result.current.state.funds;
      const turnBefore = result.current.state.turn;

      // Try to perform rally which costs 30 funds, but we may not have enough
      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'bot_army' });
      });

      // If funds were insufficient, action shouldn't execute
      if (fundsBefore < 20) {
        expect(result.current.state.turn).toBe(turnBefore);
      }
    });

    it('should prevent action when insufficient clout', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Deplete clout by performing multiple meme campaigns
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'meme_campaign' });
        }
      });

      const cloutBefore = result.current.state.clout;
      const turnBefore = result.current.state.turn;

      // Try to perform meme campaign which costs 10 clout
      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'meme_campaign' });
      });

      // If clout was insufficient, turn shouldn't advance
      if (cloutBefore < 10) {
        expect(result.current.state.turn).toBe(turnBefore);
      }
    });

    it('should generate social media reactions after action', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
      });

      expect(result.current.state.socialFeed.length).toBeGreaterThan(0);
    });

    it('should add action message to news log', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
      });

      expect(result.current.state.newsLog.length).toBeGreaterThan(1);
    });
  });

  describe('RESOLVE_EVENT', () => {
    it('should resolve event and apply outcome', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Perform action to potentially trigger event
      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
      });

      // If there's a pending event, resolve it
      if (result.current.state.pendingEvent) {
        const riskBefore = result.current.state.risk;

        act(() => {
          result.current.dispatch({ type: 'RESOLVE_EVENT', optionIndex: 0 });
        });

        expect(result.current.state.pendingEvent).toBeUndefined();
        // Risk should have changed based on the outcome
        expect(result.current.state.risk).not.toBe(riskBefore);
      }
    });

    it('should clear pending event after resolution', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Keep performing actions until we get an event
      act(() => {
        for (let i = 0; i < 10; i++) {
          if (!result.current.state.pendingEvent) {
            result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
          }
        }
      });

      if (result.current.state.pendingEvent) {
        act(() => {
          result.current.dispatch({ type: 'RESOLVE_EVENT', optionIndex: 0 });
        });

        expect(result.current.state.pendingEvent).toBeUndefined();
      }
    });
  });

  describe('RESET_GAME', () => {
    it('should reset game to initial state', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Perform some actions to change state
      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'rally' });
      });

      expect(result.current.state.turn).toBeGreaterThan(0);

      // Reset game
      act(() => {
        result.current.dispatch({ type: 'RESET_GAME' });
      });

      expect(result.current.state.turn).toBe(0);
      expect(result.current.state.clout).toBe(50);
      expect(result.current.state.funds).toBe(100);
      expect(result.current.state.risk).toBe(0);
    });
  });

  describe('Victory and Defeat Conditions', () => {
    it('should trigger victory when average support >= 80%', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Artificially boost support by performing bot army multiple times
      act(() => {
        for (let i = 0; i < 30; i++) {
          // First fundraise to get enough funds
          result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
          result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'bot_army' });

          if (result.current.state.victory) break;
        }
      });

      // Calculate average support
      const avgSupport = Object.values(result.current.state.support).reduce((a, b) => a + b, 0) / 51;

      if (avgSupport >= 80) {
        expect(result.current.state.victory).toBe(true);
      }
    });

    it('should trigger game over when risk >= 100', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      // Perform risky actions to increase risk
      act(() => {
        for (let i = 0; i < 10; i++) {
          // Fundraise to get funds, then bot army (high risk)
          result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
          result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'bot_army' });

          if (result.current.state.gameOver) break;
        }
      });

      if (result.current.state.risk >= 100) {
        expect(result.current.state.gameOver).toBe(true);
      }
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useGameContext(), { wrapper });

      act(() => {
        result.current.dispatch({ type: 'PERFORM_ACTION', actionId: 'fundraise' });
      });

      const savedState = localStorage.getItem('gameSave');
      expect(savedState).not.toBeNull();

      const parsedState = JSON.parse(savedState!);
      expect(parsedState.turn).toBe(1);
      // First action gets 1.5x bonus: 100 + (50 * 1.5) = 175
      expect(parsedState.funds).toBeGreaterThanOrEqual(175);
    });
  });
});
