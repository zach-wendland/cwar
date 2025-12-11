"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Flame, Users } from "lucide-react";
import {
  SentimentState,
  FactionSentiment,
  MoodLevel,
  getMoodInfo,
  FACTION_INTERESTS,
} from "@/lib/game/sentimentEngine";
import GlassPanel from "./GlassPanel";

// ================================
// FACTION DISPLAY NAMES & ICONS
// ================================

const FACTION_CONFIG: Record<string, { name: string; icon: string; shortName: string }> = {
  "tech-elite": { name: "Tech Elite", icon: "💻", shortName: "Tech" },
  "rural-heartland": { name: "Rural Heartland", icon: "🌾", shortName: "Rural" },
  "urban-progressive": { name: "Urban Progressives", icon: "🏙️", shortName: "Urban" },
  "corporate-establishment": { name: "Corporate", icon: "🏢", shortName: "Corp" },
  "media-influencers": { name: "Media Influencers", icon: "📱", shortName: "Media" },
  "grassroots-activists": { name: "Grassroots", icon: "✊", shortName: "Grass" },
};

// ================================
// MOOD INDICATOR COMPONENT
// ================================

interface MoodIndicatorProps {
  mood: MoodLevel;
  momentum: number;
  compact?: boolean;
}

const MoodIndicator: React.FC<MoodIndicatorProps> = ({ mood, momentum, compact = false }) => {
  const moodInfo = getMoodInfo(mood);

  const getMomentumTrend = () => {
    if (momentum > 50) return <TrendingUp size={compact ? 10 : 12} className="text-emerald-400" />;
    if (momentum < -20) return <TrendingDown size={compact ? 10 : 12} className="text-red-400" />;
    return <Minus size={compact ? 10 : 12} className="text-white/40" />;
  };

  return (
    <div className="flex items-center gap-1">
      <span className={compact ? "text-sm" : "text-lg"}>{moodInfo.icon}</span>
      {!compact && (
        <span
          className="text-xs font-semibold"
          style={{ color: moodInfo.color }}
        >
          {moodInfo.label}
        </span>
      )}
      {getMomentumTrend()}
    </div>
  );
};

// ================================
// SINGLE FACTION CARD
// ================================

interface FactionCardProps {
  factionId: string;
  sentiment: FactionSentiment;
  compact?: boolean;
}

const FactionCard: React.FC<FactionCardProps> = ({ factionId, sentiment, compact = false }) => {
  const config = FACTION_CONFIG[factionId];
  const moodInfo = getMoodInfo(sentiment.mood);
  const interests = FACTION_INTERESTS[factionId];

  if (!config) return null;

  // Calculate momentum bar width (normalize to 0-100)
  const momentumPercent = Math.round((sentiment.momentum + 100) / 2);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${
          sentiment.mood === "HOSTILE"
            ? "bg-red-500/10 border-red-500/30"
            : sentiment.mood === "ENTHUSIASTIC"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-white/5 border-white/10"
        }`}
      >
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">{config.shortName}</div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: moodInfo.color }}
              initial={{ width: 0 }}
              animate={{ width: `${momentumPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <MoodIndicator mood={sentiment.mood} momentum={sentiment.momentum} compact />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl border transition-all ${
        sentiment.mood === "HOSTILE"
          ? "bg-red-500/10 border-red-500/30"
          : sentiment.mood === "ENTHUSIASTIC"
          ? "bg-emerald-500/10 border-emerald-500/30"
          : sentiment.mood === "APATHETIC"
          ? "bg-white/5 border-white/10"
          : "bg-blue-500/10 border-blue-500/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className="text-sm font-bold text-white">{config.name}</h4>
            <p className="text-[10px] text-white/40">{interests?.description?.slice(0, 40)}...</p>
          </div>
        </div>
        <MoodIndicator mood={sentiment.mood} momentum={sentiment.momentum} />
      </div>

      {/* Momentum bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-white/40 mb-1">
          <span>Hostile</span>
          <span>Momentum: {Math.round(sentiment.momentum)}</span>
          <span>Fired Up</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
          <motion.div
            className="absolute top-0 bottom-0 rounded-full"
            style={{
              backgroundColor: moodInfo.color,
              left: sentiment.momentum < 0 ? `${50 + sentiment.momentum / 2}%` : "50%",
              width: `${Math.abs(sentiment.momentum) / 2}%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.abs(sentiment.momentum) / 2}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Interests preview */}
      {interests && (
        <div className="flex flex-wrap gap-1">
          {interests.loves.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400"
            >
              ❤️ {tag}
            </span>
          ))}
          {interests.hates.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400"
            >
              💔 {tag}
            </span>
          ))}
        </div>
      )}

      {/* Recent actions */}
      {sentiment.recentActions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-[10px] text-white/40 mb-1">Recent impact:</p>
          <div className="space-y-0.5">
            {sentiment.recentActions.slice(0, 2).map((action, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-white/60 truncate max-w-[70%]">{action.reason}</span>
                <span
                  className={`font-mono ${
                    action.impact > 0 ? "text-emerald-400" : action.impact < 0 ? "text-red-400" : "text-white/40"
                  }`}
                >
                  {action.impact > 0 ? "+" : ""}
                  {action.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ================================
// MAIN FACTION MOOD PANEL
// ================================

interface FactionMoodProps {
  sentiment: SentimentState;
  compact?: boolean;
}

const FactionMood: React.FC<FactionMoodProps> = ({ sentiment, compact = false }) => {
  const factionIds = Object.keys(sentiment.factions);
  const hostileCount = Object.values(sentiment.factions).filter(f => f.mood === "HOSTILE").length;
  const enthusiasticCount = Object.values(sentiment.factions).filter(f => f.mood === "ENTHUSIASTIC").length;

  // Global momentum indicator
  const globalMomentumPercent = Math.round((sentiment.globalMomentum + 100) / 2);

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Global momentum bar */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
          <Users size={14} className="text-purple-400" />
          <div className="flex-1">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  sentiment.globalMomentum > 30
                    ? "bg-emerald-500"
                    : sentiment.globalMomentum < -10
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${globalMomentumPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-white/60">{Math.round(sentiment.globalMomentum)}</span>
        </div>

        {/* Compact faction grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {factionIds.map((id) => (
            <FactionCard key={id} factionId={id} sentiment={sentiment.factions[id]} compact />
          ))}
        </div>

        {/* Warnings */}
        {hostileCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 rounded text-[10px] text-red-400">
            <AlertTriangle size={10} />
            {hostileCount} hostile - expect sabotage!
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassPanel title="Coalition Sentiment" icon={Users} glowColor="purple" className="mb-4">
      {/* Global momentum */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Campaign Momentum</span>
          <div className="flex items-center gap-2">
            {enthusiasticCount > 0 && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Flame size={12} /> {enthusiasticCount} fired up
              </span>
            )}
            {hostileCount > 0 && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} /> {hostileCount} hostile
              </span>
            )}
          </div>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
          <motion.div
            className={`absolute top-0 bottom-0 rounded-full ${
              sentiment.globalMomentum > 30
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                : sentiment.globalMomentum < -10
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-blue-500 to-purple-500"
            }`}
            style={{
              left: sentiment.globalMomentum < 0 ? `${50 + sentiment.globalMomentum / 2}%` : "50%",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.abs(sentiment.globalMomentum) / 2}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/40 mt-1">
          <span>Coalition Fracturing</span>
          <span>Unified Movement</span>
        </div>
      </div>

      {/* Faction grid */}
      <div className="grid grid-cols-2 gap-2">
        {factionIds.map((id) => (
          <FactionCard key={id} factionId={id} sentiment={sentiment.factions[id]} />
        ))}
      </div>
    </GlassPanel>
  );
};

export default FactionMood;
