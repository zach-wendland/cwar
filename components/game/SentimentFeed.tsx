"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, TrendingUp, TrendingDown, AlertTriangle, Flame, Users } from "lucide-react";
import { FactionReaction, MoodLevel, getMoodInfo } from "@/lib/game/sentimentEngine";

// ================================
// SINGLE REACTION ITEM
// ================================

interface ReactionItemProps {
  reaction: FactionReaction;
  index: number;
}

const ReactionItem: React.FC<ReactionItemProps> = ({ reaction, index }) => {
  const isPositive = reaction.impact > 0;
  const isMoodChange = !!reaction.moodChange;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ delay: index * 0.1 }}
      className={`p-2 rounded-lg border transition-all ${
        isMoodChange
          ? isPositive
            ? "bg-emerald-500/20 border-emerald-500/30"
            : "bg-red-500/20 border-red-500/30"
          : "bg-white/5 border-white/10"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <span className="text-lg shrink-0">{reaction.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white leading-relaxed">{reaction.message}</p>

          {/* Impact indicator */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-[10px] font-mono ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}{reaction.impact} sentiment
            </span>

            {isMoodChange && reaction.moodChange && (
              <span className="text-[10px] text-white/60 flex items-center gap-1">
                {getMoodInfo(reaction.moodChange.from).icon}
                →
                {getMoodInfo(reaction.moodChange.to).icon}
              </span>
            )}
          </div>
        </div>

        {/* Trend icon */}
        <div className="shrink-0">
          {isPositive ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ================================
// SENTIMENT FEED COMPONENT
// ================================

interface SentimentFeedProps {
  reactions: FactionReaction[];
  maxItems?: number;
}

const SentimentFeed: React.FC<SentimentFeedProps> = ({ reactions, maxItems = 5 }) => {
  const displayedReactions = reactions.slice(0, maxItems);

  if (displayedReactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-white/60">
        <MessageSquare size={12} />
        <span>Coalition Reactions</span>
      </div>

      <AnimatePresence mode="popLayout">
        {displayedReactions.map((reaction, index) => (
          <ReactionItem
            key={`${reaction.factionId}-${reaction.message}-${index}`}
            reaction={reaction}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ================================
// INLINE SENTIMENT TOAST
// ================================

interface SentimentToastProps {
  reaction: FactionReaction;
  onClose: () => void;
}

export const SentimentToast: React.FC<SentimentToastProps> = ({ reaction, onClose }) => {
  const isPositive = reaction.impact > 0;
  const isMoodChange = !!reaction.moodChange;

  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md max-w-sm ${
        isMoodChange
          ? isPositive
            ? "bg-emerald-900/90 border-emerald-500/50"
            : "bg-red-900/90 border-red-500/50"
          : isPositive
          ? "bg-slate-800/90 border-emerald-500/30"
          : "bg-slate-800/90 border-red-500/30"
      }`}
      onClick={onClose}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{reaction.icon}</span>
        <div>
          <p className="text-sm font-semibold text-white">{reaction.factionName}</p>
          <p className="text-xs text-white/70">{reaction.message}</p>
        </div>
        <span
          className={`text-lg font-bold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}{reaction.impact}
        </span>
      </div>
    </motion.div>
  );
};

// ================================
// MOOD CHANGE ANNOUNCEMENT
// ================================

interface MoodChangeAnnouncementProps {
  factionName: string;
  factionIcon: string;
  fromMood: MoodLevel;
  toMood: MoodLevel;
  onClose: () => void;
}

export const MoodChangeAnnouncement: React.FC<MoodChangeAnnouncementProps> = ({
  factionName,
  factionIcon,
  fromMood,
  toMood,
  onClose,
}) => {
  const toMoodInfo = getMoodInfo(toMood);
  const isPositive = ["ENTHUSIASTIC", "ENGAGED"].includes(toMood) &&
    ["APATHETIC", "HOSTILE"].includes(fromMood);

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-50 p-6 rounded-2xl shadow-2xl border backdrop-blur-md text-center ${
        isPositive
          ? "bg-emerald-900/95 border-emerald-500/50"
          : "bg-red-900/95 border-red-500/50"
      }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="text-5xl mb-3"
      >
        {factionIcon}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-white mb-1"
      >
        {factionName}
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-2 mb-2"
      >
        <span className="text-2xl">{getMoodInfo(fromMood).icon}</span>
        <span className="text-white/60">→</span>
        <span className="text-3xl">{toMoodInfo.icon}</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg font-semibold"
        style={{ color: toMoodInfo.color }}
      >
        {toMoodInfo.label.toUpperCase()}!
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-white/60 mt-2"
      >
        {toMood === "ENTHUSIASTIC"
          ? "+30% effectiveness with this faction!"
          : toMood === "HOSTILE"
          ? "Beware of sabotage events!"
          : toMood === "APATHETIC"
          ? "-30% effectiveness with this faction"
          : "Normal effectiveness"}
      </motion.p>
    </motion.div>
  );
};

export default SentimentFeed;
