"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Skull,
  Zap,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { GhostStateSnapshot, LEAGUE_THRESHOLDS, LeagueTier } from "@/server/models/GhostRun";
import { BattleComparison } from "@/lib/game/ghostRunner";

// ================================
// TYPES
// ================================

interface GhostBattleProps {
  isActive: boolean;
  ghostName: string;
  ghostElo: number;
  ghostLeague: LeagueTier;
  playerTurn: number;
  playerSupport: number;
  playerFunds: number;
  playerRisk: number;
  ghostSnapshot: GhostStateSnapshot | null;
  matchId: string;
  potentialGain: number;
  potentialLoss: number;
}

// ================================
// STAT COMPARISON COMPONENT
// ================================

interface StatCompareProps {
  label: string;
  playerValue: number;
  ghostValue: number;
  icon: React.ReactNode;
  format?: (val: number) => string;
  higherIsBetter?: boolean;
}

const StatCompare: React.FC<StatCompareProps> = ({
  label,
  playerValue,
  ghostValue,
  icon,
  format = (v) => v.toString(),
  higherIsBetter = true,
}) => {
  const diff = playerValue - ghostValue;
  const playerWinning = higherIsBetter ? diff > 0 : diff < 0;
  const tie = diff === 0;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-white/60 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Player value */}
        <span
          className={`font-mono text-sm ${
            playerWinning ? "text-emerald-400" : tie ? "text-white/60" : "text-red-400"
          }`}
        >
          {format(playerValue)}
        </span>

        {/* Comparison indicator */}
        <div className="w-6 flex justify-center">
          {tie ? (
            <Minus size={12} className="text-white/40" />
          ) : playerWinning ? (
            <TrendingUp size={12} className="text-emerald-400" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
        </div>

        {/* Ghost value */}
        <span
          className={`font-mono text-sm ${
            !playerWinning && !tie ? "text-emerald-400" : tie ? "text-white/60" : "text-red-400"
          }`}
        >
          {format(ghostValue)}
        </span>
      </div>
    </div>
  );
};

// ================================
// MAIN GHOST BATTLE COMPONENT
// ================================

const GhostBattle: React.FC<GhostBattleProps> = ({
  isActive,
  ghostName,
  ghostElo,
  ghostLeague,
  playerTurn,
  playerSupport,
  playerFunds,
  playerRisk,
  ghostSnapshot,
  matchId,
  potentialGain,
  potentialLoss,
}) => {
  const leagueInfo = LEAGUE_THRESHOLDS[ghostLeague];

  if (!isActive) return null;

  const ghostTurn = ghostSnapshot?.turn || 0;
  const ghostSupport = ghostSnapshot?.avgSupport || 5;
  const ghostFunds = ghostSnapshot?.funds || 100;
  const ghostRisk = ghostSnapshot?.risk || 0;

  const supportDiff = playerSupport - ghostSupport;
  const playerAhead = supportDiff > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-3 rounded-xl mb-4 border border-purple-500/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-purple-400">GHOST BATTLE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">vs</span>
          <span style={{ color: leagueInfo.color }} className="text-sm font-bold">
            {leagueInfo.icon} {ghostName}
          </span>
          <span className="text-xs text-white/40">({ghostElo} ELO)</span>
        </div>
      </div>

      {/* Battle status */}
      <div
        className={`mb-3 px-3 py-2 rounded-lg text-center ${
          playerAhead
            ? "bg-emerald-500/10 border border-emerald-500/30"
            : supportDiff === 0
            ? "bg-white/5 border border-white/10"
            : "bg-red-500/10 border border-red-500/30"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {playerAhead ? (
            <>
              <Crown size={16} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">
                You're ahead by {Math.abs(supportDiff).toFixed(0)}% support!
              </span>
            </>
          ) : supportDiff === 0 ? (
            <>
              <Minus size={16} className="text-white/60" />
              <span className="text-white/60 font-bold">Tied!</span>
            </>
          ) : (
            <>
              <Skull size={16} className="text-red-400" />
              <span className="text-red-400 font-bold">
                Ghost leads by {Math.abs(supportDiff).toFixed(0)}% support!
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stat comparisons */}
      <div className="space-y-0">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40 mb-1 px-1">
          <span>YOU</span>
          <span className="text-right">GHOST</span>
        </div>

        <StatCompare
          label="Turn"
          playerValue={playerTurn}
          ghostValue={ghostTurn}
          icon={<span className="text-purple-400">#</span>}
          higherIsBetter={false}
        />
        <StatCompare
          label="Support"
          playerValue={playerSupport}
          ghostValue={ghostSupport}
          icon={<TrendingUp size={12} className="text-cyan-400" />}
          format={(v) => `${v.toFixed(0)}%`}
        />
        <StatCompare
          label="Funds"
          playerValue={playerFunds}
          ghostValue={ghostFunds}
          icon={<DollarSign size={12} className="text-emerald-400" />}
          format={(v) => `$${v}`}
        />
        <StatCompare
          label="Risk"
          playerValue={playerRisk}
          ghostValue={ghostRisk}
          icon={<AlertTriangle size={12} className="text-orange-400" />}
          format={(v) => `${v}%`}
          higherIsBetter={false}
        />
      </div>

      {/* ELO stakes */}
      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-xs">
        <span className="text-white/40">
          Win: <span className="text-emerald-400 font-bold">+{potentialGain}</span> ELO
        </span>
        <span className="text-white/40">
          Lose: <span className="text-red-400 font-bold">{potentialLoss}</span> ELO
        </span>
      </div>
    </motion.div>
  );
};

export default GhostBattle;
