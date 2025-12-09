import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameContext } from './game/GameContext';
import { useGameFeedback } from './hooks/useGameFeedback';
import MapView from './components/MapView';
import EventFeed from './components/EventFeed';
import ActionPanel from './components/ActionPanel';
import AdvisorsPanel from './components/AdvisorsPanel';
import IntroTutorial from './components/IntroTutorial';
import { showCriticalHit } from './components/modern/AchievementToast';

const App: React.FC = () => {
  const { state, dispatch } = useGameContext();

  // Initialize game feedback system
  useGameFeedback(state);

  // Handle critical hit toast display
  useEffect(() => {
    if (state.lastActionWasCritical) {
      showCriticalHit(2);
      // Clear the flag after showing
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_CRITICAL_FLAG' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.lastActionWasCritical, dispatch]);

  const pendingEvent = state.pendingEvent;

  const handleEventChoice = (choiceIndex: number) => {
    dispatch({ type: 'RESOLVE_EVENT', optionIndex: choiceIndex });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="app-container">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
        }}
      />

      <div className="container-fluid py-4">
        <IntroTutorial />

        <div className="row g-4">
          {/* Left column: Map view */}
          <motion.div
            className="col-lg-4 col-md-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MapView />
          </motion.div>

          {/* Center column: Event feed and stats */}
          <motion.div
            className="col-lg-4 col-md-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EventFeed />
          </motion.div>

          {/* Right column: Actions and Advisors */}
          <motion.div
            className="col-lg-4 col-md-12"
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
              className="modal-content p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <h4 className="text-[var(--color-text-primary)] mb-3">{pendingEvent.title}</h4>
              <p className="text-[var(--color-text-secondary)] mb-4">{pendingEvent.description}</p>
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
              className={`modal-content p-6 text-center ${state.victory ? 'victory-modal' : 'gameover-modal'}`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 15 }}
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
                  <h3 className="text-[var(--color-accent-gold)] text-2xl font-bold mb-2">
                    VICTORY!
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    You have dominated the culture!
                  </p>
                  <div className="text-sm text-[var(--color-text-muted)] mb-4">
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
                  <h3 className="text-[var(--color-accent-red)] text-2xl font-bold mb-2">
                    GAME OVER
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    Your movement has been neutralized.
                  </p>
                  <div className="text-sm text-[var(--color-text-muted)] mb-4">
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
                {state.victory ? 'Play Again' : 'Try Again'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
