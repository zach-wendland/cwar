"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Skull, Lock } from "lucide-react";
import { getRiskZone, RISK_ZONES, RiskZone } from "@/lib/game/GameContext";

interface RiskMeterProps {
  risk: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  showZoneInfo?: boolean;
}

const ZONE_CONFIG: Record<RiskZone, { icon: React.ElementType; message: string; classes: string }> = {
  SAFE: {
    icon: Shield,
    message: "All clear - operate freely",
    classes: "text-emerald-400"
  },
  CAUTION: {
    icon: AlertTriangle,
    message: "Advisors getting nervous",
    classes: "text-yellow-400"
  },
  DANGER: {
    icon: AlertTriangle,
    message: "Costs +20% | High scrutiny",
    classes: "text-orange-400"
  },
  CRITICAL: {
    icon: Skull,
    message: "Costs +30% | Actions LOCKED",
    classes: "text-red-400"
  }
};

const RiskMeter: React.FC<RiskMeterProps> = ({
  risk,
  showLabel = true,
  size = "md",
  showZoneInfo = true,
}) => {
  const zone = getRiskZone(risk);
  const zoneInfo = RISK_ZONES[zone];
  const config = ZONE_CONFIG[zone];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  // Calculate zone segment widths for the background
  const zoneSegments = [
    { width: "50%", color: "bg-emerald-900/30" },  // SAFE: 0-49
    { width: "25%", color: "bg-yellow-900/30" },   // CAUTION: 50-74
    { width: "15%", color: "bg-orange-900/30" },   // DANGER: 75-89
    { width: "10%", color: "bg-red-900/30" },      // CRITICAL: 90-99
  ];

  return (
    <div className="risk-meter-container">
      {showLabel && (
        <div className="risk-meter-header">
          <div className={`risk-meter-label ${config.classes} flex items-center gap-1.5`}>
            <Icon size={14} />
            <span className="font-semibold">{zoneInfo.label}</span>
            {zone === 'CRITICAL' && <Lock size={12} className="animate-pulse" />}
          </div>
          <span className={`risk-meter-value font-mono font-bold ${config.classes}`}>
            {risk}%
          </span>
        </div>
      )}

      {/* Zone segmented background */}
      <div className={`risk-meter ${sizeClasses[size]} relative overflow-hidden rounded-full`}>
        <div className="absolute inset-0 flex">
          {zoneSegments.map((seg, i) => (
            <div key={i} className={`${seg.color}`} style={{ width: seg.width }} />
          ))}
        </div>
        <motion.div
          className={`risk-meter__fill absolute top-0 left-0 h-full rounded-full ${
            zone === 'SAFE' ? 'bg-emerald-500' :
            zone === 'CAUTION' ? 'bg-yellow-500' :
            zone === 'DANGER' ? 'bg-orange-500' :
            'bg-red-500 animate-pulse'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(risk, 100)}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Zone info message */}
      {showZoneInfo && (
        <motion.div
          className={`risk-zone-info text-xs mt-1 ${config.classes}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span>{config.message}</span>
        </motion.div>
      )}

      {/* Critical warning */}
      {zone === 'CRITICAL' && (
        <motion.div
          className="risk-warning bg-red-500/20 border border-red-500/50 rounded px-2 py-1 mt-2 flex items-center gap-1.5 text-red-400 text-xs"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Skull size={12} className="animate-pulse" />
          <span className="font-semibold">One wrong move = GAME OVER</span>
        </motion.div>
      )}
    </div>
  );
};

export default RiskMeter;
