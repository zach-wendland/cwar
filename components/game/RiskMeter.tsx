"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, Skull } from "lucide-react";

interface RiskMeterProps {
  risk: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const RiskMeter: React.FC<RiskMeterProps> = ({
  risk,
  showLabel = true,
  size = "md",
}) => {
  const getRiskLevel = () => {
    if (risk >= 90) return { level: "critical", label: "CRITICAL", icon: Skull };
    if (risk >= 70)
      return { level: "high", label: "HIGH RISK", icon: AlertTriangle };
    if (risk >= 40)
      return { level: "medium", label: "MODERATE", icon: AlertTriangle };
    return { level: "low", label: "SAFE", icon: Shield };
  };

  const { level, label, icon: Icon } = getRiskLevel();
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="risk-meter-container">
      {showLabel && (
        <div className="risk-meter-header">
          <div className={`risk-meter-label risk-meter-label--${level}`}>
            <Icon size={14} />
            <span>{label}</span>
          </div>
          <span className={`risk-meter-value risk-meter-value--${level}`}>
            {risk}%
          </span>
        </div>
      )}
      <div className={`risk-meter ${sizeClasses[size]}`}>
        <motion.div
          className={`risk-meter__fill risk-meter__fill--${level}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(risk, 100)}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {risk >= 80 && (
        <motion.div
          className="risk-warning"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <AlertTriangle size={12} />
          <span>Platform ban imminent!</span>
        </motion.div>
      )}
    </div>
  );
};

export default RiskMeter;
