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
  // ===================
  // BASIC MILESTONES
  // ===================
  FIRST_ACTION: { title: 'First Move', description: 'You made your first action!' },
  SUPPORT_25: { title: 'Gaining Ground', description: 'Reached 25% average support', type: 'milestone' as ToastType },
  SUPPORT_50: { title: 'Rising Star', description: 'Reached 50% average support', type: 'milestone' as ToastType },
  SUPPORT_75: { title: 'Movement Leader', description: 'Reached 75% average support', type: 'milestone' as ToastType },
  FIRST_VICTORY: { title: 'First Victory', description: 'Won your first game!', type: 'achievement' as ToastType },

  // ===================
  // STREAK ACHIEVEMENTS
  // ===================
  STREAK_3: { title: 'On a Roll', description: '3 turns without increasing risk' },
  STREAK_5: { title: 'Calculated', description: '5 turns without increasing risk' },
  STREAK_10: { title: 'Master Strategist', description: '10 turns without increasing risk' },
  STREAK_15: { title: 'Untouchable', description: '15 turns without increasing risk', type: 'milestone' as ToastType },

  // ===================
  // RISK ACHIEVEMENTS
  // ===================
  SURVIVED_HIGH_RISK: { title: 'Narrow Escape', description: 'Survived with risk above 80%', type: 'warning' as ToastType },
  RISK_ZERO: { title: 'Clean Record', description: 'Reduced risk back to 0', type: 'achievement' as ToastType },
  CLOSE_CALL: { title: 'Close Call', description: 'Won with risk above 90%', type: 'warning' as ToastType },
  COMEBACK_KING: { title: 'Comeback King', description: 'Won after reaching 95+ risk', type: 'milestone' as ToastType },

  // ===================
  // CRITICAL HITS
  // ===================
  CRITICAL_HIT: { title: 'Lucky Strike!', description: 'Your action had double effect!', type: 'critical' as ToastType },
  CRIT_MASTER: { title: 'Critical Master', description: 'Got 5 critical hits in one game', type: 'achievement' as ToastType },
  CRIT_LEGEND: { title: 'Critical Legend', description: 'Got 10 critical hits in one game', type: 'milestone' as ToastType },

  // ===================
  // SPEEDRUN ACHIEVEMENTS
  // ===================
  SPEED_DEMON: { title: 'Speed Demon', description: 'Won in under 15 turns', type: 'achievement' as ToastType },
  BLITZ_VICTORY: { title: 'Blitz Victory', description: 'Won in under 10 turns', type: 'milestone' as ToastType },
  PATIENCE_PAYS: { title: 'Patience Pays', description: 'Won after 50+ turns', type: 'achievement' as ToastType },

  // ===================
  // RESOURCE ACHIEVEMENTS
  // ===================
  WEALTHY: { title: 'Wealthy Movement', description: 'Accumulated $500+ funds', type: 'achievement' as ToastType },
  BROKE_BUT_WINNING: { title: 'Broke But Winning', description: 'Won with $0 funds', type: 'achievement' as ToastType },
  CLOUT_KING: { title: 'Clout King', description: 'Reached 200+ clout', type: 'achievement' as ToastType },
  INFLUENCER: { title: 'Top Influencer', description: 'Reached 150+ clout', type: 'milestone' as ToastType },

  // ===================
  // PLAYSTYLE ACHIEVEMENTS
  // ===================
  PACIFIST: { title: 'Pacifist', description: 'Won without using Bot Army', type: 'achievement' as ToastType },
  MEME_LORD: { title: 'Meme Lord', description: 'Used meme campaign 10 times in one game', type: 'achievement' as ToastType },
  FUNDRAISER_PRO: { title: 'Fundraiser Pro', description: 'Used Fundraise 10 times in one game', type: 'achievement' as ToastType },
  GRASSROOTS_HERO: { title: 'Grassroots Hero', description: 'Won using mostly rallies and canvassing', type: 'achievement' as ToastType },
  DIGITAL_WARRIOR: { title: 'Digital Warrior', description: 'Won using mostly online actions', type: 'achievement' as ToastType },
  HIGH_ROLLER: { title: 'High Roller', description: 'Used Debate Challenge 5 times in one game', type: 'achievement' as ToastType },

  // ===================
  // STATE ACHIEVEMENTS
  // ===================
  COMPLETIONIST: { title: 'Completionist', description: 'Got all 51 states to 50%+ support', type: 'milestone' as ToastType },
  DOMINATION: { title: 'Total Domination', description: 'Got all 51 states to 80%+ support', type: 'milestone' as ToastType },
  SWING_STATE_MASTER: { title: 'Swing State Master', description: 'Got PA, MI, WI, AZ, GA all to 80%+', type: 'achievement' as ToastType },
  COASTAL_ELITE: { title: 'Coastal Elite', description: 'Got CA and NY both to 90%+ support', type: 'achievement' as ToastType },
  HEARTLAND_HERO: { title: 'Heartland Hero', description: 'Got all Midwest states to 70%+', type: 'achievement' as ToastType },

  // ===================
  // EVENT ACHIEVEMENTS
  // ===================
  EVENT_MASTER: { title: 'Event Master', description: 'Resolved 20 events in one game', type: 'achievement' as ToastType },
  CHAIN_COMPLETER: { title: 'Chain Completer', description: 'Completed a full event chain', type: 'achievement' as ToastType },
  RISK_TAKER: { title: 'Risk Taker', description: 'Always chose the riskiest option in 5 events', type: 'warning' as ToastType },
  SAFE_PLAYER: { title: 'Playing It Safe', description: 'Always chose lowest risk option in 10 events', type: 'achievement' as ToastType },

  // ===================
  // HIDDEN ACHIEVEMENTS
  // ===================
  PERFECTLY_BALANCED: { title: 'Perfectly Balanced', description: 'Had exactly 50% average support', type: 'achievement' as ToastType },
  CRISIS_AVERTED: { title: 'Crisis Averted', description: 'Reduced risk from 90+ to under 50', type: 'milestone' as ToastType },
  UNDERDOG: { title: 'Underdog', description: 'Won starting from 1% average support', type: 'milestone' as ToastType },
  PHOENIX: { title: 'Phoenix', description: 'Reached 80% support after dropping to 5%', type: 'milestone' as ToastType },
  MARATHON: { title: 'Marathon Runner', description: 'Played for 100+ turns', type: 'achievement' as ToastType },
};
