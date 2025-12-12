"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Calendar, Flame, Trophy, X, Check, Star } from "lucide-react";
import {
  LoginStreak,
  ChallengeReward,
  DailyChallenge,
  getDailyChallenge,
  loadLoginStreak,
  saveLoginStreak,
  processLogin,
  getStreakReward,
  getCurrentStreakDay,
  getDifficultyColor,
  getDifficultyLabel,
  isChallengeAvailable,
  loadDailyProgress,
} from "@/lib/game/dailyChallenge";
import GlassPanel from "./GlassPanel";

// ================================
// LOGIN STREAK DISPLAY
// ================================

interface StreakDisplayProps {
  streak: LoginStreak;
  onCollectReward: (reward: ChallengeReward) => void;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, onCollectReward }) => {
  const [showReward, setShowReward] = useState(false);
  const [pendingReward, setPendingReward] = useState<ChallengeReward | null>(null);

  useEffect(() => {
    // Check for uncollected reward on mount
    const { updatedStreak, reward } = processLogin(streak);
    if (reward && updatedStreak.currentStreak !== streak.currentStreak) {
      setPendingReward(reward);
      setShowReward(true);
      saveLoginStreak(updatedStreak);
    }
  }, [streak]);

  const handleCollect = () => {
    if (pendingReward) {
      onCollectReward(pendingReward);
      setPendingReward(null);
      setShowReward(false);
    }
  };

  const currentDay = getCurrentStreakDay(streak);

  return (
    <>
      <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
        <div className="flex items-center gap-2">
          <Flame className="text-orange-400" size={20} />
          <div>
            <p className="text-xs text-white/60">Daily Streak</p>
            <p className="text-lg font-bold text-orange-400">{streak.currentStreak} days</p>
          </div>
        </div>

        {/* 7-day progress */}
        <div className="flex-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const isCollected = streak.rewardsCollected.includes(day);
              const isCurrent = day === currentDay;
              const reward = getStreakReward(day);

              return (
                <motion.div
                  key={day}
                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-semibold ${
                    isCollected
                      ? "bg-emerald-500/30 border border-emerald-500/50 text-emerald-400"
                      : isCurrent && pendingReward
                      ? "bg-yellow-500/30 border border-yellow-500/50 text-yellow-400 animate-pulse"
                      : day < currentDay
                      ? "bg-white/10 border border-white/20 text-white/40"
                      : "bg-white/5 border border-white/10 text-white/20"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  title={`Day ${day + 1}: +${reward.prestige} prestige`}
                >
                  {isCollected ? <Check size={12} /> : day + 1}
                </motion.div>
              );
            })}
          </div>
          <p className="text-[10px] text-white/40 mt-1 text-center">
            {streak.longestStreak > 0 && `Best: ${streak.longestStreak} days`}
          </p>
        </div>

        {/* Collect button */}
        {pendingReward && (
          <motion.button
            onClick={handleCollect}
            className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-sm font-bold shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Gift size={16} className="inline mr-1" />
            Claim!
          </motion.button>
        )}
      </div>

      {/* Reward popup */}
      <AnimatePresence>
        {showReward && pendingReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={handleCollect}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-yellow-500/30 text-center max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-6xl mb-4"
              >
                🎁
              </motion.div>

              <h3 className="text-xl font-bold text-white mb-2">
                Day {streak.currentStreak} Reward!
              </h3>

              <div className="space-y-2 mb-4">
                {pendingReward.prestige > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-2 text-purple-400"
                  >
                    <Star size={16} />
                    <span>+{pendingReward.prestige} Prestige</span>
                  </motion.div>
                )}
                {pendingReward.clout > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-2 text-cyan-400"
                  >
                    <Trophy size={16} />
                    <span>+{pendingReward.clout} Clout</span>
                  </motion.div>
                )}
                {pendingReward.funds > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-emerald-400"
                  >
                    <span>💵</span>
                    <span>+${pendingReward.funds}</span>
                  </motion.div>
                )}
                {pendingReward.title && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-yellow-400 font-semibold"
                  >
                    Title Unlocked: &quot;{pendingReward.title}&quot;
                  </motion.div>
                )}
              </div>

              <motion.button
                onClick={handleCollect}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Collect Reward
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ================================
// DAILY CHALLENGE CARD
// ================================

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  isAvailable: boolean;
  onStartChallenge: () => void;
}

const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  challenge,
  isAvailable,
  onStartChallenge,
}) => {
  const difficultyColor = getDifficultyColor(challenge.difficulty);

  return (
    <div
      className="p-4 rounded-xl border transition-all"
      style={{
        background: `linear-gradient(135deg, ${difficultyColor}10, ${difficultyColor}05)`,
        borderColor: `${difficultyColor}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-white/60" />
            <span className="text-xs text-white/60">Daily Challenge</span>
          </div>
          <h4 className="text-lg font-bold text-white">{challenge.name}</h4>
        </div>
        <span
          className="px-2 py-1 rounded text-xs font-bold"
          style={{ backgroundColor: `${difficultyColor}30`, color: difficultyColor }}
        >
          {getDifficultyLabel(challenge.difficulty)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-white/70 mb-3">{challenge.description}</p>

      {/* Constraints */}
      {challenge.constraints.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/40 mb-1">Constraints:</p>
          <div className="space-y-1">
            {challenge.constraints.map((constraint, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-400">
                <span>⚠️</span>
                <span>{constraint.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal */}
      <div className="mb-3 p-2 bg-white/5 rounded-lg">
        <p className="text-xs text-white/40">Goal:</p>
        <p className="text-sm text-cyan-400">{challenge.goal.description}</p>
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-white/40">Rewards:</span>
        {challenge.reward.prestige > 0 && (
          <span className="text-xs text-purple-400">+{challenge.reward.prestige} prestige</span>
        )}
        {challenge.reward.clout > 0 && (
          <span className="text-xs text-cyan-400">+{challenge.reward.clout} clout</span>
        )}
        {challenge.reward.funds > 0 && (
          <span className="text-xs text-emerald-400">+${challenge.reward.funds}</span>
        )}
        {challenge.reward.title && (
          <span className="text-xs text-yellow-400">&quot;{challenge.reward.title}&quot;</span>
        )}
      </div>

      {/* Start Button */}
      <motion.button
        onClick={onStartChallenge}
        disabled={!isAvailable}
        className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
          isAvailable
            ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
        whileHover={isAvailable ? { scale: 1.02 } : {}}
        whileTap={isAvailable ? { scale: 0.98 } : {}}
      >
        {isAvailable ? "Start Challenge" : "Completed Today"}
      </motion.button>
    </div>
  );
};

// ================================
// MAIN DAILY REWARD COMPONENT
// ================================

interface DailyRewardProps {
  onCollectReward?: (reward: ChallengeReward) => void;
  onStartChallenge?: (challenge: DailyChallenge) => void;
}

const DailyReward: React.FC<DailyRewardProps> = ({ onCollectReward, onStartChallenge }) => {
  const [streak, setStreak] = useState<LoginStreak | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    // Load streak and challenge data
    const loadedStreak = loadLoginStreak();
    setStreak(loadedStreak);

    const dailyChallenge = getDailyChallenge();
    setChallenge(dailyChallenge);

    const progress = loadDailyProgress();
    setIsAvailable(isChallengeAvailable(progress));
  }, []);

  const handleCollectReward = useCallback(
    (reward: ChallengeReward) => {
      if (onCollectReward) {
        onCollectReward(reward);
      }
      // Reload streak after collecting
      setStreak(loadLoginStreak());
    },
    [onCollectReward]
  );

  const handleStartChallenge = useCallback(() => {
    if (challenge && onStartChallenge) {
      onStartChallenge(challenge);
    }
  }, [challenge, onStartChallenge]);

  if (!streak) return null;

  return (
    <GlassPanel title="Daily Rewards" icon={Gift} glowColor="yellow" className="mb-4">
      <div className="space-y-4">
        {/* Login Streak */}
        <StreakDisplay streak={streak} onCollectReward={handleCollectReward} />

        {/* Daily Challenge */}
        {challenge && (
          <DailyChallengeCard
            challenge={challenge}
            isAvailable={isAvailable}
            onStartChallenge={handleStartChallenge}
          />
        )}
      </div>
    </GlassPanel>
  );
};

export default DailyReward;
