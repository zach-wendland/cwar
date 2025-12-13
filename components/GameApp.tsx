"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Focus trap hook for modal accessibility
const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab: go to previous
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: go to next
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef]);
};
import { Trophy, Star, Calendar, HelpCircle } from "lucide-react";
import { useGameContext } from "@/lib/game/GameContext";
import ComprehensiveTutorial from "./game/ComprehensiveTutorial";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import { useScreenShake } from "@/hooks/useScreenShake";
import {
  calculateLegacyPoints,
  loadPrestigeData,
  processPrestige,
  LegacyCalculation,
  PrestigeData,
} from "@/lib/game/prestige";
import {
  isChallengeActive,
  completeDailyChallenge,
} from "@/lib/game/challenges";
import MapView from "./game/MapView";
import EventFeed from "./game/EventFeed";
import ActionPanel from "./game/ActionPanel";
import AdvisorsPanel from "./game/AdvisorsPanel";
import FactionPanel from "./game/FactionPanel";
import PrestigePanel from "./game/PrestigePanel";
import DailyChallengePanel, {
  DailyChallengeIndicator,
} from "./game/DailyChallengePanel";
import IntroTutorial from "./game/IntroTutorial";
import { showCriticalHit } from "./game/AchievementToast";
import {
  FloatingNumbers,
  useFloatingNumbers,
} from "./game/FloatingNumbers";
import { ParticleSystem, useParticles } from "./game/ParticleSystem";
import CollapsibleStatsBar from "./game/CollapsibleStatsBar";
import BottomSheet from "./game/BottomSheet";
import VictoryTracker from "./game/VictoryTracker";
import { Users } from "lucide-react";

const GameApp: React.FC = () => {
  const { state, dispatch, avgSupport } = useGameContext();
  const [mounted, setMounted] = useState(false);
  const [prestigePanelOpen, setPrestigePanelOpen] = useState(false);
  const [challengePanelOpen, setChallengePanelOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [legacyEarned, setLegacyEarned] = useState<LegacyCalculation | null>(
    null
  );
  const [challengeBonus, setChallengeBonus] = useState<number>(0);
  const [prestigeData, setPrestigeData] = useState<PrestigeData>(
    loadPrestigeData()
  );
  const prevStateRef = useRef(state);

  // Modal refs for focus trap
  const eventModalRef = useRef<HTMLDivElement>(null);
  const endGameModalRef = useRef<HTMLDivElement>(null);

  // Apply focus trap to modals
  useFocusTrap(!!state.pendingEvent, eventModalRef);
  useFocusTrap((state.victory || state.gameOver) && !state.pendingEvent, endGameModalRef);

  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // UI Juice hooks
  const { shakeStyle, triggerShake } = useScreenShake();
  const { numbers, addNumber, removeNumber } = useFloatingNumbers();
  const { particles, emit: emitParticles } = useParticles();

  // Initialize game feedback system
  useGameFeedback(state);

  // Handle critical hit toast display and effects
  useEffect(() => {
    if (state.lastActionWasCritical) {
      showCriticalHit(2);
      triggerShake({ intensity: 15, duration: 400 });
      emitParticles("critical");
      // Clear the flag after showing
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_CRITICAL_FLAG" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.lastActionWasCritical, dispatch, triggerShake, emitParticles]);

  // Track stat changes for floating numbers with responsive positions
  useEffect(() => {
    const prev = prevStateRef.current;

    // Show floating numbers for significant changes
    if (state.turn > prev.turn) {
      const cloutDiff = state.clout - prev.clout;
      const fundsDiff = state.funds - prev.funds;
      const riskDiff = state.risk - prev.risk;

      // Calculate average support change using memoized previous vs current
      const prevAvgSupport =
        Object.values(prev.support).reduce((a, b) => a + b, 0) /
        Math.max(Object.keys(prev.support).length, 1);
      const supportDiff = Math.round(avgSupport - prevAvgSupport);

      // Responsive positions - center of viewport with offsets
      const getResponsivePosition = (index: number) => {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const baseX = Math.min(viewportWidth * 0.3, 150);
        const spacing = Math.min(viewportWidth * 0.15, 100);
        return {
          x: baseX + (spacing * index),
          y: 80, // Fixed vertical position below header
        };
      };

      if (cloutDiff !== 0) addNumber(cloutDiff, "clout", getResponsivePosition(0));
      if (fundsDiff !== 0) addNumber(fundsDiff, "funds", getResponsivePosition(1));
      if (riskDiff !== 0) addNumber(riskDiff, "risk", getResponsivePosition(2));
      if (supportDiff !== 0) addNumber(supportDiff, "support", getResponsivePosition(3));
    }

    // Victory particles
    if (state.victory && !prev.victory) {
      emitParticles("victory");
      triggerShake({ intensity: 5, duration: 800 });
    }

    // Streak milestone effects
    if (
      state.streak > prev.streak &&
      (state.streak === 3 || state.streak === 5 || state.streak === 10)
    ) {
      emitParticles("streak");
    }

    prevStateRef.current = state;
  }, [state.turn, state.clout, state.funds, state.risk, state.victory, state.streak, avgSupport, addNumber, emitParticles, triggerShake]);

  // Calculate legacy points on victory
  useEffect(() => {
    if (state.victory && !legacyEarned) {
      const legacy = calculateLegacyPoints(state);
      setLegacyEarned(legacy);

      // Check if daily challenge was completed
      if (isChallengeActive()) {
        const { bonusLegacy } = completeDailyChallenge();
        setChallengeBonus(bonusLegacy);
      }
    }
    if (!state.victory) {
      setLegacyEarned(null);
      setChallengeBonus(0);
    }
  }, [state.victory, state, legacyEarned]);

  const pendingEvent = state.pendingEvent;

  const handleEventChoice = (choiceIndex: number) => {
    dispatch({ type: "RESOLVE_EVENT", optionIndex: choiceIndex });
  };

  const handleReset = () => {
    // Process prestige if victorious
    if (state.victory) {
      const newData = processPrestige(state, prestigeData);
      setPrestigeData(newData);
    }
    dispatch({ type: "RESET_GAME" });
  };

  const availablePoints =
    prestigeData.totalLegacyPoints - prestigeData.spentLegacyPoints;

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={shakeStyle}>
      {/* Floating Numbers & Particles */}
      <FloatingNumbers numbers={numbers} onComplete={removeNumber} />
      <ParticleSystem particles={particles} />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
          },
        }}
      />

      {/* Prestige Panel */}
      <PrestigePanel
        isOpen={prestigePanelOpen}
        onClose={() => setPrestigePanelOpen(false)}
      />

      {/* Daily Challenge Panel */}
      <DailyChallengePanel
        isOpen={challengePanelOpen}
        onClose={() => setChallengePanelOpen(false)}
        onStart={() => dispatch({ type: "RESET_GAME" })}
      />

      <div className="container mx-auto px-4 py-4 pb-20 lg:pb-4">
        {/* Header Buttons */}
        <div className="flex justify-end gap-2 sm:gap-3 mb-2">
          {/* Help/Tutorial Button */}
          <motion.button
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors min-h-[44px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open game tutorial"
          >
            <HelpCircle size={18} />
            <span className="font-medium hidden sm:inline">Help</span>
          </motion.button>

          {/* Daily Challenge Indicator */}
          <DailyChallengeIndicator
            onClick={() => setChallengePanelOpen(true)}
          />

          {/* Daily Challenge Button */}
          <motion.button
            onClick={() => setChallengePanelOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors min-h-[44px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={18} />
            <span className="font-medium hidden sm:inline">Daily</span>
          </motion.button>

          {/* Legacy Points Button */}
          <motion.button
            onClick={() => setPrestigePanelOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors min-h-[44px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trophy size={18} />
            <span className="font-medium">{availablePoints}</span>
            <Star size={14} />
          </motion.button>
        </div>

        <IntroTutorial onOpenFullTutorial={() => setHelpOpen(true)} />

        {/* Mobile Collapsible Stats Bar */}
        <CollapsibleStatsBar
          turn={state.turn}
          clout={state.clout}
          funds={state.funds}
          risk={state.risk}
          avgSupport={avgSupport}
          streak={state.streak}
        />

        {/* Victory Progress Tracker */}
        <div className="mb-4">
          <VictoryTracker />
        </div>

        {/* Desktop 3-column layout / Mobile stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Map view */}
          <motion.div
            className="order-1 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MapView />
          </motion.div>

          {/* Center column: Event feed and stats (hidden on mobile, shown in desktop) */}
          <motion.div
            className="order-3 lg:order-2 hidden lg:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EventFeed />
          </motion.div>

          {/* Right column: Actions (priority on mobile) */}
          <motion.div
            className="order-2 lg:order-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ActionPanel />
            {/* Desktop only: Advisors and Factions inline */}
            <div className="hidden lg:block">
              <AdvisorsPanel />
              <div className="mt-4">
                <FactionPanel />
              </div>
            </div>
          </motion.div>

          {/* Mobile only: Event feed below actions */}
          <motion.div
            className="order-4 lg:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <EventFeed />
          </motion.div>
        </div>

        {/* Mobile Bottom Sheet for Advisors & Factions */}
        <BottomSheet
          title="Advisors & Factions"
          icon={<Users size={18} className="text-cyan-400" />}
          peekHeight={56}
        >
          <div className="space-y-4">
            <AdvisorsPanel />
            <FactionPanel />
          </div>
        </BottomSheet>
      </div>

      {/* Event Modal - Accessible with focus trap and ARIA */}
      <AnimatePresence>
        {pendingEvent && (
          <motion.div
            ref={eventModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-title"
            aria-describedby="event-description"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 max-w-2xl w-full p-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <h4 id="event-title" className="text-white text-2xl font-bold mb-3">
                {pendingEvent.title}
              </h4>
              <p id="event-description" className="text-white/70 mb-4">{pendingEvent.description}</p>
              <div className="space-y-2" role="group" aria-label="Event choices">
                {pendingEvent.options?.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    onClick={() => handleEventChoice(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleEventChoice(idx);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={`Choice ${idx + 1}: ${opt.text}`}
                  >
                    {opt.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comprehensive Tutorial */}
      <AnimatePresence>
        {helpOpen && (
          <ComprehensiveTutorial onClose={() => setHelpOpen(false)} />
        )}
      </AnimatePresence>

      {/* Victory/Game Over Modal - Accessible */}
      <AnimatePresence>
        {(state.victory || state.gameOver) && !pendingEvent && (
          <motion.div
            ref={endGameModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="endgame-title"
            aria-describedby="endgame-description"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 max-w-md w-full p-6 text-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              {state.victory && (
                <>
                  {/* Victory crown - no infinite animation to save CPU */}
                  <div className="text-6xl mb-4" aria-hidden="true">
                    👑
                  </div>
                  <h3 id="endgame-title" className="text-yellow-400 text-2xl font-bold mb-2">
                    VICTORY!
                  </h3>
                  <p id="endgame-description" className="text-white/70 mb-4">
                    You have dominated the culture!
                  </p>
                  <div className="text-sm text-white/50 mb-4">
                    <p>Turns: {state.turn}</p>
                    <p>Highest Streak: {state.highestStreak}</p>
                    <p>Critical Hits: {state.totalCriticalHits}</p>
                  </div>
                  {/* Legacy Points Earned */}
                  {legacyEarned && (
                    <motion.div
                      className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                        <Star size={20} />
                        <span className="text-xl font-bold">
                          +{legacyEarned.total + challengeBonus} Legacy Points
                        </span>
                        <Star size={20} />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-white/60">
                        <span>Base: +{legacyEarned.basePoints}</span>
                        <span>Speed: +{legacyEarned.turnBonus}</span>
                        <span>Streak: +{legacyEarned.streakBonus}</span>
                        <span>Crits: +{legacyEarned.criticalBonus}</span>
                        <span>Risk: +{legacyEarned.riskBonus}</span>
                        <span>Factions: +{legacyEarned.factionBonus}</span>
                        {challengeBonus > 0 && (
                          <span className="col-span-2 text-purple-400">
                            Challenge: +{challengeBonus}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              {state.gameOver && (
                <>
                  {/* Game over skull - no infinite animation to save CPU */}
                  <div className="text-6xl mb-4" aria-hidden="true">
                    💀
                  </div>
                  <h3 id="endgame-title" className="text-red-400 text-2xl font-bold mb-2">
                    GAME OVER
                  </h3>
                  <p id="endgame-description" className="text-white/70 mb-4">
                    Your movement has been neutralized.
                  </p>
                  <div className="text-sm text-white/50 mb-4">
                    <p>Survived {state.turn} turns</p>
                    <p>Highest Streak: {state.highestStreak}</p>
                  </div>
                </>
              )}
              <motion.button
                className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={state.victory ? "Play again" : "Try again"}
              >
                {state.victory ? "Play Again" : "Try Again"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameApp;
