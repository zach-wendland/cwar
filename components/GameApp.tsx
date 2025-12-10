"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameContext } from "@/lib/game/GameContext";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import MapView from "./game/MapView";
import EventFeed from "./game/EventFeed";
import ActionPanel from "./game/ActionPanel";
import AdvisorsPanel from "./game/AdvisorsPanel";
import IntroTutorial from "./game/IntroTutorial";
import { showCriticalHit } from "./game/AchievementToast";
import { Button } from "./ui/button";

const GameApp: React.FC = () => {
  const { state, dispatch } = useGameContext();

  // Initialize game feedback system
  useGameFeedback(state);

  // Handle critical hit toast display
  useEffect(() => {
    if (state.lastActionWasCritical) {
      showCriticalHit(2);
      // Clear the flag after showing
      const timer = setTimeout(() => {
        dispatch({ type: "CLEAR_CRITICAL_FLAG" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.lastActionWasCritical, dispatch]);

  const pendingEvent = state.pendingEvent;

  const handleEventChoice = (choiceIndex: number) => {
    dispatch({ type: "RESOLVE_EVENT", optionIndex: choiceIndex });
  };

  const handleReset = () => {
    dispatch({ type: "RESET_GAME" });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
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
            className="md:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ActionPanel />
            <AdvisorsPanel />
          </motion.div>
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {pendingEvent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content p-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <h4 className="text-foreground text-xl font-semibold mb-3">
                {pendingEvent.title}
              </h4>
              <p className="text-muted-foreground mb-4">
                {pendingEvent.description}
              </p>
              <div className="space-y-2">
                {pendingEvent.options?.map((opt, idx) => (
                  <motion.button
                    key={idx}
                    className="action-btn w-full"
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
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`modal-content p-8 text-center ${
                state.victory ? "victory-modal" : "gameover-modal"
              }`}
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
                  <h3 className="text-gold text-2xl font-bold mb-2">VICTORY!</h3>
                  <p className="text-muted-foreground mb-4">
                    You have dominated the culture!
                  </p>
                  <div className="text-sm text-muted-foreground mb-4 space-y-1">
                    <p>Turns: {state.turn}</p>
                    <p>Highest Streak: {state.highestStreak}</p>
                    <p>Critical Hits: {state.totalCriticalHits}</p>
                  </div>
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
                  <h3 className="text-red-500 text-2xl font-bold mb-2">
                    GAME OVER
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your movement has been neutralized.
                  </p>
                  <div className="text-sm text-muted-foreground mb-4 space-y-1">
                    <p>Survived {state.turn} turns</p>
                    <p>Highest Streak: {state.highestStreak}</p>
                  </div>
                </>
              )}
              <motion.button
                className="action-btn inline-block px-8"
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
