"use client";

import React, { useEffect, useState, useRef } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Calendar } from "lucide-react";
import { useGameContext } from "@/lib/game/GameContext";
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

const GameApp: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const [prestigePanelOpen, setPrestigePanelOpen] = useState(false);
  const [challengePanelOpen, setChallengePanelOpen] = useState(false);
  const [legacyEarned, setLegacyEarned] = useState<LegacyCalculation | null>(
    null
  );
  const [challengeBonus, setChallengeBonus] = useState<number>(0);
  const [prestigeData, setPrestigeData] = useState<PrestigeData>(
    loadPrestigeData()
  );
  const prevStateRef = useRef(state);

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

  // Track stat changes for floating numbers
  useEffect(() => {
    const prev = prevStateRef.current;

    // Show floating numbers for significant changes
    if (state.turn > prev.turn) {
      const cloutDiff = state.clout - prev.clout;
      const fundsDiff = state.funds - prev.funds;
      const riskDiff = state.risk - prev.risk;

      // Calculate average support change
      const prevAvgSupport =
        Object.values(prev.support).reduce((a, b) => a + b, 0) /
        Object.keys(prev.support).length;
      const currAvgSupport =
        Object.values(state.support).reduce((a, b) => a + b, 0) /
        Object.keys(state.support).length;
      const supportDiff = Math.round(currAvgSupport - prevAvgSupport);

      if (cloutDiff !== 0) addNumber(cloutDiff, "clout", { x: 200, y: 100 });
      if (fundsDiff !== 0) addNumber(fundsDiff, "funds", { x: 300, y: 100 });
      if (riskDiff !== 0) addNumber(riskDiff, "risk", { x: 400, y: 100 });
      if (supportDiff !== 0)
        addNumber(supportDiff, "support", { x: 500, y: 100 });
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
  }, [state, addNumber, emitParticles, triggerShake]);

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

      <div className="container mx-auto px-4 py-4">
        {/* Header Buttons */}
        <div className="flex justify-end gap-3 mb-2">
          {/* Daily Challenge Indicator */}
          <DailyChallengeIndicator
            onClick={() => setChallengePanelOpen(true)}
          />

          {/* Daily Challenge Button */}
          <motion.button
            onClick={() => setChallengePanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Calendar size={18} />
            <span className="font-medium">Daily</span>
          </motion.button>

          {/* Legacy Points Button */}
          <motion.button
            onClick={() => setPrestigePanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trophy size={18} />
            <span className="font-medium">{availablePoints}</span>
            <Star size={14} />
          </motion.button>
        </div>

        <IntroTutorial />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Left column: Map view */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MapView />
          </motion.div>

          {/* Center column: Event feed and stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EventFeed />
          </motion.div>

          {/* Right column: Actions and Advisors */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ActionPanel />
            <AdvisorsPanel />
            <div className="mt-4">
              <FactionPanel />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {pendingEvent && (
          <motion.div
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
              <h4 className="text-white text-2xl font-bold mb-3">
                {pendingEvent.title}
              </h4>
              <p className="text-white/70 mb-4">{pendingEvent.description}</p>
              <div className="space-y-2">
                {pendingEvent.options?.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                    onClick={() => handleEventChoice(idx)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {opt.text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory/Game Over Modal */}
      <AnimatePresence>
        {(state.victory || state.gameOver) && !pendingEvent && (
          <motion.div
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
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    👑
                  </motion.div>
                  <h3 className="text-yellow-400 text-2xl font-bold mb-2">
                    VICTORY!
                  </h3>
                  <p className="text-white/70 mb-4">
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
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    💀
                  </motion.div>
                  <h3 className="text-red-400 text-2xl font-bold mb-2">
                    GAME OVER
                  </h3>
                  <p className="text-white/70 mb-4">
                    Your movement has been neutralized.
                  </p>
                  <div className="text-sm text-white/50 mb-4">
                    <p>Survived {state.turn} turns</p>
                    <p>Highest Streak: {state.highestStreak}</p>
                  </div>
                </>
              )}
              <motion.button
                className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors inline-block"
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
