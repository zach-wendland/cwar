import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Flame, Trophy, X } from 'lucide-react';
import {
  DailyChallengeData,
  DailyChallenge,
  loadChallengeData,
  getTodayChallenge,
  startDailyChallenge,
  isChallengeActive,
  getDifficultyColor,
} from '../../lib/game/challenges';
import GlassPanel from './GlassPanel';

interface DailyChallengePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

const DailyChallengePanel: React.FC<DailyChallengePanelProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [challengeData, setChallengeData] = useState<DailyChallengeData>(loadChallengeData());
  const [todayChallenge, setTodayChallenge] = useState<DailyChallenge>(getTodayChallenge());

  useEffect(() => {
    setChallengeData(loadChallengeData());
    setTodayChallenge(getTodayChallenge());
  }, [isOpen]);

  const isActive = isChallengeActive();
  const streakBonus = Math.min(challengeData.dailyStreak * 10, 50);

  const handleStart = () => {
    const newData = startDailyChallenge();
    setChallengeData(newData);
    onStart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-purple-500/30 max-w-md w-full overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <Calendar className="text-purple-400" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-white">Daily Challenge</h2>
                  <p className="text-white/60 text-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2 mt-4 bg-orange-500/20 rounded-lg p-3">
                <Flame className="text-orange-400" size={24} />
                <div>
                  <p className="text-orange-400 font-bold">{challengeData.dailyStreak} Day Streak</p>
                  <p className="text-xs text-white/60">
                    {streakBonus > 0 ? `+${streakBonus}% bonus rewards!` : 'Complete challenges to build your streak'}
                  </p>
                </div>
              </div>
            </div>

            {/* Challenge Card */}
            <div className="p-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{todayChallenge.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-lg">{todayChallenge.name}</h3>
                      <span className={`text-xs font-medium ${getDifficultyColor(todayChallenge.difficulty)}`}>
                        {todayChallenge.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white/70 mt-1">{todayChallenge.description}</p>
                    <div className="mt-3 bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-white/50">Modifier:</p>
                      <p className="text-sm text-purple-300">{todayChallenge.modifier.description}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Trophy className="text-yellow-400" size={16} />
                      <span className="text-yellow-400 font-bold">
                        +{Math.round(todayChallenge.bonusLegacy * (1 + streakBonus / 100))} Legacy Points
                      </span>
                      {streakBonus > 0 && (
                        <span className="text-xs text-orange-400">(+{streakBonus}% streak bonus)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              {challengeData.completed && challengeData.challengeDate === new Date().toISOString().split('T')[0] ? (
                <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-bold">Challenge Completed!</p>
                  <p className="text-xs text-white/60 mt-1">Come back tomorrow for a new challenge</p>
                </div>
              ) : isActive ? (
                <div className="mt-4 bg-purple-500/20 border border-purple-500/50 rounded-lg p-4 text-center">
                  <p className="text-purple-400 font-bold">Challenge In Progress</p>
                  <p className="text-xs text-white/60 mt-1">Win a game to complete the challenge</p>
                </div>
              ) : (
                <motion.button
                  className="mt-4 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-bold"
                  onClick={handleStart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Challenge
                </motion.button>
              )}
            </div>

            {/* Stats */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-cyan-400">{challengeData.totalChallengesCompleted}</p>
                  <p className="text-xs text-white/60">Total Completed</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold text-orange-400">{challengeData.dailyStreak}</p>
                  <p className="text-xs text-white/60">Best Streak</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Small indicator component for the main UI
export const DailyChallengeIndicator: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [data, setData] = useState<DailyChallengeData>(loadChallengeData());
  const isActive = isChallengeActive();
  const challenge = getTodayChallenge();

  useEffect(() => {
    setData(loadChallengeData());
  }, []);

  if (!isActive) return null;

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span>{challenge.icon}</span>
      <span className="font-medium">{challenge.name}</span>
      <Flame size={14} className="text-orange-400" />
    </motion.button>
  );
};

export default DailyChallengePanel;
