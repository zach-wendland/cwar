import React from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, Zap, Flame, Star, AlertTriangle, Crown } from 'lucide-react';

type ToastType = 'achievement' | 'milestone' | 'warning' | 'critical' | 'streak';

interface AchievementData {
  title: string;
  description: string;
  type?: ToastType;
}

const iconMap = {
  achievement: Trophy,
  milestone: Star,
  warning: AlertTriangle,
  critical: Zap,
  streak: Flame,
};

const colorMap = {
  achievement: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50',
  milestone: 'from-purple-500/20 to-pink-500/20 border-purple-500/50',
  warning: 'from-red-500/20 to-orange-500/20 border-red-500/50',
  critical: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50',
  streak: 'from-orange-500/20 to-red-500/20 border-orange-500/50',
};

const iconColorMap = {
  achievement: 'text-yellow-400',
  milestone: 'text-purple-400',
  warning: 'text-red-400',
  critical: 'text-cyan-400',
  streak: 'text-orange-400',
};

export const showAchievementToast = (data: AchievementData) => {
  const type = data.type || 'achievement';
  const Icon = iconMap[type];

  toast.custom(
    (t) => (
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className={`
          bg-gradient-to-r ${colorMap[type]}
          backdrop-blur-lg border rounded-xl p-4
          shadow-2xl max-w-md flex items-center gap-4
        `}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={iconColorMap[type]}
        >
          <Icon size={32} />
        </motion.div>
        <div>
          <h4 className={`font-bold text-lg ${iconColorMap[type]}`}>
            {data.title}
          </h4>
          <p className="text-sm text-white/90">{data.description}</p>
        </div>
      </motion.div>
    ),
    { duration: 4000, position: 'top-right' }
  );
};

export const showCriticalHit = (multiplier: number = 2) => {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        className="bg-gradient-to-r from-yellow-400/30 to-orange-500/30 backdrop-blur-lg border-2 border-yellow-400 rounded-xl p-6 shadow-2xl text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3, repeat: 2 }}
          className="text-5xl font-black text-yellow-400 mb-2"
        >
          {multiplier}X!
        </motion.div>
        <div className="flex items-center justify-center gap-2 text-white font-bold text-xl">
          <Zap className="text-yellow-400" />
          CRITICAL HIT!
          <Zap className="text-yellow-400" />
        </div>
      </motion.div>
    ),
    { duration: 2500, position: 'top-center' }
  );
};

export const showStreakBonus = (streak: number, bonus: string) => {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gradient-to-r from-orange-500/30 to-red-500/30 backdrop-blur-lg border border-orange-400/50 rounded-xl p-4 shadow-2xl flex items-center gap-4"
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.4, repeat: 1 }}
        >
          <Flame size={36} className="text-orange-400" />
        </motion.div>
        <div>
          <h4 className="font-bold text-orange-400 text-lg">
            {streak} Turn Streak!
          </h4>
          <p className="text-white/90">{bonus}</p>
        </div>
      </motion.div>
    ),
    { duration: 3500, position: 'top-right' }
  );
};

export const showVictory = () => {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-r from-yellow-500/40 to-green-500/40 backdrop-blur-lg border-2 border-yellow-400 rounded-2xl p-8 shadow-2xl text-center"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <Crown size={64} className="text-yellow-400 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-3xl font-black text-yellow-400 mb-2">VICTORY!</h2>
        <p className="text-white text-lg">You have dominated the culture!</p>
      </motion.div>
    ),
    { duration: 6000, position: 'top-center' }
  );
};

export const showGameOver = () => {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-r from-red-500/40 to-gray-900/40 backdrop-blur-lg border-2 border-red-500 rounded-2xl p-8 shadow-2xl text-center"
      >
        <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-red-400 mb-2">GAME OVER</h2>
        <p className="text-white text-lg">Your movement has been neutralized.</p>
      </motion.div>
    ),
    { duration: 6000, position: 'top-center' }
  );
};

// Achievement definitions for milestones
export const ACHIEVEMENTS = {
  FIRST_ACTION: { title: 'First Move', description: 'You made your first action!' },
  SUPPORT_25: { title: 'Gaining Ground', description: 'Reached 25% average support', type: 'milestone' as ToastType },
  SUPPORT_50: { title: 'Rising Star', description: 'Reached 50% average support', type: 'milestone' as ToastType },
  SUPPORT_75: { title: 'Movement Leader', description: 'Reached 75% average support', type: 'milestone' as ToastType },
  STREAK_3: { title: 'On a Roll', description: '3 turns without increasing risk' },
  STREAK_5: { title: 'Calculated', description: '5 turns without increasing risk' },
  STREAK_10: { title: 'Master Strategist', description: '10 turns without increasing risk' },
  SURVIVED_HIGH_RISK: { title: 'Narrow Escape', description: 'Survived with risk above 80%', type: 'warning' as ToastType },
  CRITICAL_HIT: { title: 'Lucky Strike!', description: 'Your action had double effect!', type: 'critical' as ToastType },
};
