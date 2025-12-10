import { useEffect, useRef, useCallback } from 'react';
import {
  showAchievementToast,
  showCriticalHit,
  showStreakBonus,
  showVictory,
  showGameOver,
  ACHIEVEMENTS,
} from '../components/game/AchievementToast';

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
  totalCriticalHits?: number;
}

interface UseFeedbackOptions {
  enableAchievements?: boolean;
  enableCriticalHits?: boolean;
  enableStreaks?: boolean;
}

// Swing states for achievement tracking
const SWING_STATES = ['PA', 'MI', 'WI', 'AZ', 'GA'];
const MIDWEST_STATES = ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'];

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
  const maxRiskReached = useRef(0);
  const minSupportReached = useRef(100);

  const getAvgSupport = useCallback((support: { [key: string]: number }) => {
    const values = Object.values(support);
    return values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  }, []);

  // Helper to check if all states meet a threshold
  const allStatesMeet = useCallback((support: { [key: string]: number }, threshold: number) => {
    return Object.values(support).every(v => v >= threshold);
  }, []);

  // Helper to check if specific states meet a threshold
  const specificStatesMeet = useCallback((support: { [key: string]: number }, states: string[], threshold: number) => {
    return states.every(s => support[s] >= threshold);
  }, []);

  useEffect(() => {
    if (!enableAchievements) return;

    const prev = prevState.current;
    const avgSupport = getAvgSupport(state.support);
    const prevAvgSupport = prev ? getAvgSupport(prev.support) : 0;

    // Track extremes for hidden achievements
    maxRiskReached.current = Math.max(maxRiskReached.current, state.risk);
    minSupportReached.current = Math.min(minSupportReached.current, avgSupport);

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

    // Perfectly balanced hidden achievement
    if (avgSupport === 50 && !shownAchievements.current.has('PERFECTLY_BALANCED')) {
      shownAchievements.current.add('PERFECTLY_BALANCED');
      showAchievementToast(ACHIEVEMENTS.PERFECTLY_BALANCED);
    }

    // Resource milestones
    if (state.funds >= 500 && !shownAchievements.current.has('WEALTHY')) {
      shownAchievements.current.add('WEALTHY');
      showAchievementToast(ACHIEVEMENTS.WEALTHY);
    }
    if (state.clout >= 150 && !shownAchievements.current.has('INFLUENCER')) {
      shownAchievements.current.add('INFLUENCER');
      showAchievementToast(ACHIEVEMENTS.INFLUENCER);
    }
    if (state.clout >= 200 && !shownAchievements.current.has('CLOUT_KING')) {
      shownAchievements.current.add('CLOUT_KING');
      showAchievementToast(ACHIEVEMENTS.CLOUT_KING);
    }

    // Risk achievements
    if (state.risk === 0 && prev && prev.risk > 0 && !shownAchievements.current.has('RISK_ZERO')) {
      shownAchievements.current.add('RISK_ZERO');
      showAchievementToast(ACHIEVEMENTS.RISK_ZERO);
    }
    if (prev && prev.risk >= 90 && state.risk < 50 && !shownAchievements.current.has('CRISIS_AVERTED')) {
      shownAchievements.current.add('CRISIS_AVERTED');
      showAchievementToast(ACHIEVEMENTS.CRISIS_AVERTED);
    }

    // Critical hit milestones
    const totalCrits = state.totalCriticalHits || 0;
    if (totalCrits >= 5 && !shownAchievements.current.has('CRIT_MASTER')) {
      shownAchievements.current.add('CRIT_MASTER');
      showAchievementToast(ACHIEVEMENTS.CRIT_MASTER);
    }
    if (totalCrits >= 10 && !shownAchievements.current.has('CRIT_LEGEND')) {
      shownAchievements.current.add('CRIT_LEGEND');
      showAchievementToast(ACHIEVEMENTS.CRIT_LEGEND);
    }

    // State-based achievements
    if (allStatesMeet(state.support, 50) && !shownAchievements.current.has('COMPLETIONIST')) {
      shownAchievements.current.add('COMPLETIONIST');
      showAchievementToast(ACHIEVEMENTS.COMPLETIONIST);
    }
    if (allStatesMeet(state.support, 80) && !shownAchievements.current.has('DOMINATION')) {
      shownAchievements.current.add('DOMINATION');
      showAchievementToast(ACHIEVEMENTS.DOMINATION);
    }
    if (specificStatesMeet(state.support, SWING_STATES, 80) && !shownAchievements.current.has('SWING_STATE_MASTER')) {
      shownAchievements.current.add('SWING_STATE_MASTER');
      showAchievementToast(ACHIEVEMENTS.SWING_STATE_MASTER);
    }
    if (state.support['CA'] >= 90 && state.support['NY'] >= 90 && !shownAchievements.current.has('COASTAL_ELITE')) {
      shownAchievements.current.add('COASTAL_ELITE');
      showAchievementToast(ACHIEVEMENTS.COASTAL_ELITE);
    }
    if (specificStatesMeet(state.support, MIDWEST_STATES, 70) && !shownAchievements.current.has('HEARTLAND_HERO')) {
      shownAchievements.current.add('HEARTLAND_HERO');
      showAchievementToast(ACHIEVEMENTS.HEARTLAND_HERO);
    }

    // Marathon achievement
    if (state.turn >= 100 && !shownAchievements.current.has('MARATHON')) {
      shownAchievements.current.add('MARATHON');
      showAchievementToast(ACHIEVEMENTS.MARATHON);
    }

    // Victory achievements
    if (state.victory && (!prev || !prev.victory)) {
      showVictory();

      // First victory
      if (!shownAchievements.current.has('FIRST_VICTORY')) {
        shownAchievements.current.add('FIRST_VICTORY');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.FIRST_VICTORY), 2000);
      }

      // Speedrun achievements
      if (state.turn < 10 && !shownAchievements.current.has('BLITZ_VICTORY')) {
        shownAchievements.current.add('BLITZ_VICTORY');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.BLITZ_VICTORY), 3000);
      } else if (state.turn < 15 && !shownAchievements.current.has('SPEED_DEMON')) {
        shownAchievements.current.add('SPEED_DEMON');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.SPEED_DEMON), 3000);
      }

      // Patience achievement
      if (state.turn >= 50 && !shownAchievements.current.has('PATIENCE_PAYS')) {
        shownAchievements.current.add('PATIENCE_PAYS');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.PATIENCE_PAYS), 3000);
      }

      // Risk-based victory achievements
      if (state.risk >= 90 && !shownAchievements.current.has('CLOSE_CALL')) {
        shownAchievements.current.add('CLOSE_CALL');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.CLOSE_CALL), 2500);
      }
      if (maxRiskReached.current >= 95 && !shownAchievements.current.has('COMEBACK_KING')) {
        shownAchievements.current.add('COMEBACK_KING');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.COMEBACK_KING), 3500);
      }

      // Broke but winning
      if (state.funds === 0 && !shownAchievements.current.has('BROKE_BUT_WINNING')) {
        shownAchievements.current.add('BROKE_BUT_WINNING');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.BROKE_BUT_WINNING), 4000);
      }

      // Phoenix achievement
      if (minSupportReached.current <= 5 && avgSupport >= 80 && !shownAchievements.current.has('PHOENIX')) {
        shownAchievements.current.add('PHOENIX');
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.PHOENIX), 4500);
      }
    }

    // Game Over
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
  }, [state, enableAchievements, getAvgSupport, allStatesMeet, specificStatesMeet]);

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
    } else if (streak === 15 && prevStreak < 15) {
      if (!shownAchievements.current.has('STREAK_15')) {
        shownAchievements.current.add('STREAK_15');
        showAchievementToast(ACHIEVEMENTS.STREAK_15);
      }
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
