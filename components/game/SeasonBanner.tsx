"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trophy, Users, ChevronRight, X, Zap, AlertTriangle } from "lucide-react";
import {
  SeasonalEvent,
  BreakingNews,
  CommunityGoal,
  getCurrentSeason,
  getSeasonRemainingTime,
  getGoalProgress,
  checkBreakingNews,
  getSeasonTypeIcon,
  getSeasonTypeLabel,
} from "@/lib/game/seasonalEvents";

// ================================
// BREAKING NEWS BANNER
// ================================

interface BreakingNewsBannerProps {
  news: BreakingNews;
  onDismiss: () => void;
}

const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({ news, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="relative bg-gradient-to-r from-red-900/90 to-orange-900/90 border-b border-red-500/50 px-4 py-2"
    >
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-2xl"
        >
          {news.icon}
        </motion.span>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
              BREAKING
            </span>
            <span className="text-sm font-bold text-white">{news.headline}</span>
          </div>
          <p className="text-xs text-white/70">{news.description}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <Clock size={12} />
          <span>{news.duration}h left</span>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X size={14} className="text-white/60" />
        </button>
      </div>

      {/* Effect preview */}
      <div className="flex items-center gap-3 mt-1 text-[10px]">
        <span className="text-white/40">Effects:</span>
        {news.effect.cloutDelta && (
          <span className={news.effect.cloutDelta > 0 ? "text-cyan-400" : "text-red-400"}>
            {news.effect.cloutDelta > 0 ? "+" : ""}{news.effect.cloutDelta} clout
          </span>
        )}
        {news.effect.riskDelta && (
          <span className={news.effect.riskDelta < 0 ? "text-emerald-400" : "text-red-400"}>
            {news.effect.riskDelta > 0 ? "+" : ""}{news.effect.riskDelta} risk
          </span>
        )}
        {news.effect.fundsDelta && (
          <span className="text-emerald-400">+${news.effect.fundsDelta}</span>
        )}
      </div>
    </motion.div>
  );
};

// ================================
// COMMUNITY GOAL CARD
// ================================

interface CommunityGoalCardProps {
  goal: CommunityGoal;
}

const CommunityGoalCard: React.FC<CommunityGoalCardProps> = ({ goal }) => {
  const progress = getGoalProgress(goal);

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-purple-400" />
          <span className="text-xs text-white/60">Community Goal</span>
        </div>
        {goal.completed && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded">
            COMPLETED
          </span>
        )}
      </div>

      <p className="text-sm text-white mb-2">{goal.description}</p>

      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-1">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            goal.completed
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
              : "bg-gradient-to-r from-purple-500 to-pink-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/40">
          {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
        </span>
        <span className="text-purple-400">{progress}%</span>
      </div>

      {/* Reward preview */}
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-[10px]">
        <Trophy size={10} className="text-yellow-400" />
        <span className="text-white/40">Reward:</span>
        <span className="text-yellow-400">{goal.reward.name}</span>
      </div>
    </div>
  );
};

// ================================
// SEASON DETAILS MODAL
// ================================

interface SeasonDetailsProps {
  season: SeasonalEvent;
  onClose: () => void;
}

const SeasonDetails: React.FC<SeasonDetailsProps> = ({ season, onClose }) => {
  const remaining = getSeasonRemainingTime(season);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border max-w-lg w-full max-h-[80vh] overflow-y-auto"
        style={{ borderColor: season.themeColor + "50" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{season.icon}</span>
            <div>
              <span className="text-xs text-white/40">{getSeasonTypeLabel(season.type)}</span>
              <h3 className="text-xl font-bold text-white">{season.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Time remaining */}
        <div
          className="flex items-center gap-3 p-3 rounded-lg mb-4"
          style={{ backgroundColor: season.themeColor + "20" }}
        >
          <Clock size={16} style={{ color: season.themeColor }} />
          <span className="text-sm text-white">
            {remaining.days > 0
              ? `${remaining.days}d ${remaining.hours}h remaining`
              : `${remaining.hours}h remaining`}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-white/70 mb-4">{season.description}</p>

        {/* Modifiers */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            Active Modifiers
          </h4>
          <div className="space-y-2">
            {season.modifiers.map((mod, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
              >
                <span className="text-xs text-white/60">{mod.description}</span>
                <span
                  className="text-xs font-mono"
                  style={{ color: mod.value > 1 ? "#f59e0b" : "#22c55e" }}
                >
                  {mod.value > 1 ? `+${Math.round((mod.value - 1) * 100)}%` : `${Math.round((1 - mod.value) * 100)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Community Goals */}
        {season.goals.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Users size={14} className="text-purple-400" />
              Community Goals
            </h4>
            <div className="space-y-2">
              {season.goals.map((goal) => (
                <CommunityGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            Season Rewards
          </h4>
          <div className="flex flex-wrap gap-2">
            {season.rewards.map((reward, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <span className="text-xs text-yellow-400">{reward.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ================================
// MAIN SEASON BANNER COMPONENT
// ================================

interface SeasonBannerProps {
  compact?: boolean;
}

const SeasonBanner: React.FC<SeasonBannerProps> = ({ compact = false }) => {
  const [season, setSeason] = useState<SeasonalEvent | null>(null);
  const [news, setNews] = useState<BreakingNews | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dismissedNews, setDismissedNews] = useState(false);

  useEffect(() => {
    setSeason(getCurrentSeason());

    // Check for breaking news
    const newsCheck = checkBreakingNews();
    setNews(newsCheck);
  }, []);

  if (!season && !news) return null;

  const remaining = season ? getSeasonRemainingTime(season) : null;

  return (
    <>
      {/* Breaking News Banner */}
      <AnimatePresence>
        {news && !dismissedNews && (
          <BreakingNewsBanner
            news={news}
            onDismiss={() => setDismissedNews(true)}
          />
        )}
      </AnimatePresence>

      {/* Season Banner */}
      {season && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden ${compact ? "p-2" : "p-3"}`}
          style={{
            background: `linear-gradient(135deg, ${season.themeColor}20, ${season.themeColor}05)`,
            borderBottom: `1px solid ${season.themeColor}30`,
          }}
          onClick={() => !compact && setShowDetails(true)}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <motion.span
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className={compact ? "text-xl" : "text-2xl"}
            >
              {season.icon}
            </motion.span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    backgroundColor: season.themeColor + "30",
                    color: season.themeColor,
                  }}
                >
                  {getSeasonTypeLabel(season.type).toUpperCase()}
                </span>
                <span className="text-sm font-bold text-white truncate">{season.name}</span>
              </div>

              {!compact && (
                <p className="text-xs text-white/60 truncate">{season.description}</p>
              )}
            </div>

            {/* Timer */}
            {remaining && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Clock size={12} />
                <span>
                  {remaining.days > 0 ? `${remaining.days}d` : `${remaining.hours}h`}
                </span>
              </div>
            )}

            {/* Modifiers indicator */}
            {season.modifiers.length > 0 && (
              <div className="flex items-center gap-1 text-xs" style={{ color: season.themeColor }}>
                <AlertTriangle size={12} />
                <span>{season.modifiers.length} effects</span>
              </div>
            )}

            {/* Expand button */}
            {!compact && (
              <motion.button
                whileHover={{ x: 3 }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={16} className="text-white/60" />
              </motion.button>
            )}
          </div>

          {/* Active modifiers preview (compact) */}
          {compact && season.modifiers.length > 0 && (
            <div className="flex items-center gap-2 mt-1 text-[10px]">
              {season.modifiers.slice(0, 2).map((mod, i) => (
                <span key={i} className="text-white/40">{mod.description}</span>
              ))}
            </div>
          )}

          {/* Animated background effect */}
          <motion.div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 80% 50%, ${season.themeColor}, transparent 50%)`,
            }}
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
        </motion.div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && season && (
          <SeasonDetails season={season} onClose={() => setShowDetails(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default SeasonBanner;
