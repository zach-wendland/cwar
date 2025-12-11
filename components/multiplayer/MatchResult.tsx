"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Skull,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Crown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { LeagueTier, LEAGUE_THRESHOLDS } from "@/server/models/GhostRun";
import { BattleWinReason } from "@/lib/game/ghostRunner";

// ================================
// TYPES
// ================================

interface MatchResultProps {
  isOpen: boolean;
  onClose: () => void;
  playerWon: boolean;
  reason: BattleWinReason;
  // Player stats
  playerSupport: number;
  playerTurn: number;
  // Ghost stats
  ghostName: string;
  ghostLeague: LeagueTier;
  ghostSupport: number;
  ghostTurn: number;
  // ELO changes
  eloChange: number;
  newElo: number;
  promoted: boolean;
  demoted: boolean;
  newLeague?: LeagueTier;
  // Match stats
  totalCombos: number;
  bestCombo: number;
  criticalHits: number;
}

// ================================
// WIN REASON MESSAGES
// ================================

const WIN_REASON_MESSAGES: Record<BattleWinReason, { title: string; subtitle: string }> = {
  PLAYER_VICTORY_FIRST: {
    title: "Speed Victory!",
    subtitle: "You achieved victory before your opponent!",
  },
  GHOST_VICTORY_FIRST: {
    title: "Too Slow!",
    subtitle: "Your opponent achieved victory first.",
  },
  PLAYER_HIGHER_SUPPORT: {
    title: "Popular Champion!",
    subtitle: "You ended with higher support than your opponent!",
  },
  GHOST_HIGHER_SUPPORT: {
    title: "Outmaneuvered!",
    subtitle: "Your opponent ended with higher support.",
  },
  PLAYER_DEFEAT: {
    title: "Campaign Collapsed!",
    subtitle: "Your movement fell apart before victory.",
  },
  GHOST_DEFEAT: {
    title: "Outlasted!",
    subtitle: "Your opponent's campaign collapsed!",
  },
  TIE_PLAYER_WINS: {
    title: "Home Advantage!",
    subtitle: "A tie goes to the challenger!",
  },
};

// ================================
// MAIN MATCH RESULT COMPONENT
// ================================

const MatchResult: React.FC<MatchResultProps> = ({
  isOpen,
  onClose,
  playerWon,
  reason,
  playerSupport,
  playerTurn,
  ghostName,
  ghostLeague,
  ghostSupport,
  ghostTurn,
  eloChange,
  newElo,
  promoted,
  demoted,
  newLeague,
  totalCombos,
  bestCombo,
  criticalHits,
}) => {
  if (!isOpen) return null;

  const ghostLeagueInfo = LEAGUE_THRESHOLDS[ghostLeague];
  const newLeagueInfo = newLeague ? LEAGUE_THRESHOLDS[newLeague] : null;
  const reasonInfo = WIN_REASON_MESSAGES[reason];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className={`max-w-md w-full rounded-2xl p-6 ${
          playerWon
            ? "bg-gradient-to-b from-emerald-900/90 to-slate-900/90 border-2 border-emerald-500/50"
            : "bg-gradient-to-b from-red-900/90 to-slate-900/90 border-2 border-red-500/50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-4"
          >
            {playerWon ? (
              <Trophy size={64} className="mx-auto text-amber-400" />
            ) : (
              <Skull size={64} className="mx-auto text-red-400" />
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-3xl font-black ${playerWon ? "text-emerald-400" : "text-red-400"}`}
          >
            {playerWon ? "VICTORY!" : "DEFEAT"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 mt-2"
          >
            {reasonInfo.title}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-sm"
          >
            {reasonInfo.subtitle}
          </motion.p>
        </div>

        {/* VS Summary */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xl font-bold text-white">{playerSupport.toFixed(0)}%</div>
            <div className="text-xs text-white/40">Your Support</div>
            <div className="text-xs text-white/60">Turn {playerTurn}</div>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-white/40 text-2xl font-bold">VS</span>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-xl font-bold" style={{ color: ghostLeagueInfo.color }}>
              {ghostSupport.toFixed(0)}%
            </div>
            <div className="text-xs text-white/40">{ghostName}</div>
            <div className="text-xs text-white/60">Turn {ghostTurn}</div>
          </div>
        </div>

        {/* ELO Change */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className={`mb-4 p-4 rounded-xl text-center ${
            eloChange > 0 ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {eloChange > 0 ? (
              <TrendingUp size={20} className="text-emerald-400" />
            ) : (
              <TrendingDown size={20} className="text-red-400" />
            )}
            <span
              className={`text-2xl font-black ${
                eloChange > 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {eloChange > 0 ? "+" : ""}
              {eloChange} ELO
            </span>
          </div>
          <div className="text-white/60">New Rating: {newElo}</div>
        </motion.div>

        {/* Promotion/Demotion */}
        {(promoted || demoted) && newLeagueInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`mb-4 p-3 rounded-xl text-center ${
              promoted ? "bg-amber-500/20 border border-amber-500/30" : "bg-red-500/20"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {promoted ? (
                <>
                  <ChevronUp size={20} className="text-amber-400" />
                  <span className="text-amber-400 font-bold">PROMOTED!</span>
                </>
              ) : (
                <>
                  <ChevronDown size={20} className="text-red-400" />
                  <span className="text-red-400 font-bold">Demoted</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-2xl">{newLeagueInfo.icon}</span>
              <span style={{ color: newLeagueInfo.color }} className="font-bold">
                {newLeague}
              </span>
            </div>
          </motion.div>
        )}

        {/* Match Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-purple-400 font-bold">
              <Star size={14} />
              {totalCombos}
            </div>
            <div className="text-[10px] text-white/40">Combos</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="text-amber-400 font-bold">{bestCombo.toFixed(1)}x</div>
            <div className="text-[10px] text-white/40">Best Combo</div>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-cyan-400 font-bold">
              <Zap size={14} />
              {criticalHits}
            </div>
            <div className="text-[10px] text-white/40">Criticals</div>
          </div>
        </div>

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            playerWon
              ? "bg-emerald-500 hover:bg-emerald-400 text-white"
              : "bg-red-500 hover:bg-red-400 text-white"
          }`}
        >
          {playerWon ? "Claim Victory!" : "Try Again"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default MatchResult;
