"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { LeagueTier, LeagueInfo, LEAGUE_THRESHOLDS } from "@/server/models/GhostRun";

// ================================
// TYPES
// ================================

interface LeagueCardProps {
  league: LeagueInfo;
  elo: number;
  wins: number;
  losses: number;
  currentStreak: number;
  compact?: boolean;
}

// ================================
// LEAGUE PROGRESS BAR
// ================================

interface ProgressBarProps {
  tier: LeagueTier;
  division: number;
  points: number;
}

const LeagueProgressBar: React.FC<ProgressBarProps> = ({ tier, division, points }) => {
  const leagueInfo = LEAGUE_THRESHOLDS[tier];

  return (
    <div className="w-full">
      {/* Division indicators */}
      <div className="flex justify-between mb-1">
        {[1, 2, 3, 4].map((div) => (
          <div
            key={div}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              div < division
                ? "bg-white/20 text-white/60"
                : div === division
                ? "text-white"
                : "bg-white/5 text-white/30"
            }`}
            style={div === division ? { backgroundColor: leagueInfo.color } : {}}
          >
            {div}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: leagueInfo.color }}
          initial={{ width: 0 }}
          animate={{ width: `${points}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Points label */}
      <div className="flex justify-between mt-1 text-[10px] text-white/40">
        <span>Division {division}</span>
        <span>{points}/100 to next</span>
      </div>
    </div>
  );
};

// ================================
// MAIN LEAGUE CARD COMPONENT
// ================================

const LeagueCard: React.FC<LeagueCardProps> = ({
  league,
  elo,
  wins,
  losses,
  currentStreak,
  compact = false,
}) => {
  const leagueInfo = LEAGUE_THRESHOLDS[league.tier];
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
        <span className="text-xl">{leagueInfo.icon}</span>
        <div>
          <div className="flex items-center gap-1">
            <span style={{ color: leagueInfo.color }} className="font-bold text-sm">
              {league.tier}
            </span>
            <span className="text-white/40 text-xs">Div {league.division}</span>
          </div>
          <span className="text-white/60 text-xs">{elo} ELO</span>
        </div>
        {currentStreak !== 0 && (
          <div
            className={`ml-auto flex items-center gap-0.5 text-xs ${
              currentStreak > 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {currentStreak > 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {Math.abs(currentStreak)}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.span
            className="text-4xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {leagueInfo.icon}
          </motion.span>
          <div>
            <h3 style={{ color: leagueInfo.color }} className="text-xl font-bold">
              {league.tier}
            </h3>
            <p className="text-white/60 text-sm">Division {league.division}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{elo}</div>
          <div className="text-white/40 text-xs">ELO Rating</div>
        </div>
      </div>

      {/* Progress bar */}
      <LeagueProgressBar tier={league.tier} division={league.division} points={league.points} />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-emerald-400 font-bold">{wins}</div>
          <div className="text-[10px] text-white/40">Wins</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-red-400 font-bold">{losses}</div>
          <div className="text-[10px] text-white/40">Losses</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div className="text-cyan-400 font-bold">{winRate}%</div>
          <div className="text-[10px] text-white/40">Win Rate</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-lg">
          <div
            className={`font-bold flex items-center justify-center gap-0.5 ${
              currentStreak > 0
                ? "text-emerald-400"
                : currentStreak < 0
                ? "text-red-400"
                : "text-white/40"
            }`}
          >
            {currentStreak > 0 ? (
              <ChevronUp size={14} />
            ) : currentStreak < 0 ? (
              <ChevronDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            {Math.abs(currentStreak)}
          </div>
          <div className="text-[10px] text-white/40">Streak</div>
        </div>
      </div>

      {/* Rank */}
      {league.rank > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
          <Trophy size={14} className="text-amber-400" />
          <span className="text-white/60 text-sm">
            Global Rank: <span className="text-white font-bold">#{league.rank}</span>
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default LeagueCard;
