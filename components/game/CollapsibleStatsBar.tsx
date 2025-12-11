"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Hash,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getRiskZone, RISK_ZONES, RiskZone } from "@/lib/game/GameContext";

interface CollapsibleStatsBarProps {
  turn: number;
  clout: number;
  funds: number;
  risk: number;
  avgSupport: number;
  streak?: number;
}

const ZONE_COLORS: Record<RiskZone, string> = {
  SAFE: "text-emerald-400",
  CAUTION: "text-yellow-400",
  DANGER: "text-orange-400",
  CRITICAL: "text-red-400",
};

// Static Tailwind classes - dynamic interpolation doesn't work with Tailwind's JIT compiler
const ZONE_BG_STYLES: Record<RiskZone, string> = {
  SAFE: "bg-emerald-500/10 border-emerald-500/30",
  CAUTION: "bg-yellow-500/10 border-yellow-500/30",
  DANGER: "bg-orange-500/10 border-orange-500/30",
  CRITICAL: "bg-red-500/10 border-red-500/30",
};

const CollapsibleStatsBar: React.FC<CollapsibleStatsBarProps> = ({
  turn,
  clout,
  funds,
  risk,
  avgSupport,
  streak = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const riskZone = getRiskZone(risk);
  const riskColor = ZONE_COLORS[riskZone];

  // Key stats shown when collapsed
  const keyStats = [
    { label: "Turn", value: turn, icon: Hash, color: "text-purple-400" },
    { label: "Funds", value: `$${funds}`, icon: DollarSign, color: "text-emerald-400" },
    { label: "Risk", value: `${risk}%`, icon: AlertTriangle, color: riskColor },
  ];

  // Additional stats shown when expanded
  const additionalStats = [
    { label: "Clout", value: clout, icon: Zap, color: "text-cyan-400" },
    { label: "Support", value: `${avgSupport}%`, icon: TrendingUp, color: avgSupport >= 60 ? "text-emerald-400" : avgSupport >= 30 ? "text-yellow-400" : "text-red-400" },
  ];

  return (
    <div className="lg:hidden mb-4">
      {/* Collapsed view - key stats */}
      <motion.div
        className="glass-panel p-3 rounded-xl cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {keyStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon size={14} className={stat.color} />
                <span className={`font-mono font-bold text-sm ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
            ))}
            {streak > 0 && (
              <div className="flex items-center gap-1">
                <Flame size={14} className="text-orange-400" />
                <span className="font-mono font-bold text-sm text-orange-400">
                  {streak}
                </span>
              </div>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} className="text-white/50" />
          </motion.div>
        </div>

        {/* Expanded view - all stats */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10 mt-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  {additionalStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
                    >
                      <stat.icon size={16} className={stat.color} />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">
                          {stat.label}
                        </span>
                        <span className={`font-mono font-bold ${stat.color}`}>
                          {stat.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Risk zone indicator */}
                <div className={`mt-3 px-3 py-2 rounded-lg border ${ZONE_BG_STYLES[riskZone]}`}>
                  <div className={`text-xs ${riskColor} flex items-center gap-1.5`}>
                    <AlertTriangle size={12} />
                    <span className="font-semibold">{RISK_ZONES[riskZone].label}</span>
                    {RISK_ZONES[riskZone].costMultiplier > 1 && (
                      <span className="ml-auto text-[10px] opacity-80">
                        Costs +{Math.round((RISK_ZONES[riskZone].costMultiplier - 1) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CollapsibleStatsBar;
