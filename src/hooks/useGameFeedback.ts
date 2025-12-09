import { useEffect, useRef, useCallback } from 'react';
import {
  showAchievementToast,
  showCriticalHit,
  showStreakBonus,
  showVictory,
  showGameOver,
  ACHIEVEMENTS,
} from '../components/modern/AchievementToast';

interface GameState {
  turn: number;
  clout: number;
  funds: number;
  risk: number;
  support: { [key: string]: number };
  streak?: number;
  highestStreak?: number;
  victory: boolean;
  gameOver: boolean;
  lastActionWasCritical?: boolean;
}

interface UseFeedbackOptions {
  enableAchievements?: boolean;
  enableCriticalHits?: boolean;
  enableStreaks?: boolean;
}

export const useGameFeedback = (
  state: GameState,
  options: UseFeedbackOptions = {}
) => {
  const {
    enableAchievements = true,
    enableCriticalHits = true,
    enableStreaks = true,
  } = options;

  const prevState = useRef<GameState | null>(null);
  const shownAchievements = useRef<Set<string>>(new Set());
  const sessionStarted = useRef(false);

  const getAvgSupport = useCallback((support: { [key: string]: number }) => {
    const values = Object.values(support);
    return values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  }, []);

  useEffect(() => {
    if (!enableAchievements) return;

    const prev = prevState.current;
    const avgSupport = getAvgSupport(state.support);
    const prevAvgSupport = prev ? getAvgSupport(prev.support) : 0;

    // First action achievement
    if (!sessionStarted.current && state.turn > 1) {
      sessionStarted.current = true;
      if (!shownAchievements.current.has('FIRST_ACTION')) {
        shownAchievements.current.add('FIRST_ACTION');
        showAchievementToast(ACHIEVEMENTS.FIRST_ACTION);
      }
    }

    // Support milestones
    if (prev && avgSupport >= 25 && prevAvgSupport < 25) {
      if (!shownAchievements.current.has('SUPPORT_25')) {
        shownAchievements.current.add('SUPPORT_25');
        showAchievementToast(ACHIEVEMENTS.SUPPORT_25);
      }
    }
    if (prev && avgSupport >= 50 && prevAvgSupport < 50) {
      if (!shownAchievements.current.has('SUPPORT_50')) {
        shownAchievements.current.add('SUPPORT_50');
        showAchievementToast(ACHIEVEMENTS.SUPPORT_50);
      }
    }
    if (prev && avgSupport >= 75 && prevAvgSupport < 75) {
      if (!shownAchievements.current.has('SUPPORT_75')) {
        shownAchievements.current.add('SUPPORT_75');
        showAchievementToast(ACHIEVEMENTS.SUPPORT_75);
      }
    }

    // Victory/Game Over
    if (state.victory && (!prev || !prev.victory)) {
      showVictory();
    }
    if (state.gameOver && (!prev || !prev.gameOver)) {
      showGameOver();
    }

    // Survived high risk
    if (prev && prev.risk >= 80 && state.risk < 80) {
      if (!shownAchievements.current.has('SURVIVED_HIGH_RISK')) {
        shownAchievements.current.add('SURVIVED_HIGH_RISK');
        showAchievementToast(ACHIEVEMENTS.SURVIVED_HIGH_RISK);
      }
    }

    prevState.current = { ...state };
  }, [state, enableAchievements, getAvgSupport]);

  // Streak tracking
  useEffect(() => {
    if (!enableStreaks) return;

    const streak = state.streak || 0;
    const prevStreak = prevState.current?.streak || 0;

    if (streak === 3 && prevStreak < 3) {
      showStreakBonus(3, '+5 Clout bonus!');
    } else if (streak === 5 && prevStreak < 5) {
      showStreakBonus(5, '+$20 Funds bonus!');
    } else if (streak === 10 && prevStreak < 10) {
      showStreakBonus(10, '+10% Support to a random state!');
    }
  }, [state.streak, enableStreaks]);

  // Critical hit detection
  useEffect(() => {
    if (!enableCriticalHits) return;

    if (state.lastActionWasCritical) {
      showCriticalHit(2);
    }
  }, [state.lastActionWasCritical, enableCriticalHits]);

  // Trigger functions for manual use
  const triggerCriticalHit = useCallback((multiplier: number = 2) => {
    if (enableCriticalHits) {
      showCriticalHit(multiplier);
    }
  }, [enableCriticalHits]);

  const triggerAchievement = useCallback((key: keyof typeof ACHIEVEMENTS) => {
    if (enableAchievements && !shownAchievements.current.has(key)) {
      shownAchievements.current.add(key);
      showAchievementToast(ACHIEVEMENTS[key]);
    }
  }, [enableAchievements]);

  return {
    triggerCriticalHit,
    triggerAchievement,
  };
};

export default useGameFeedback;
