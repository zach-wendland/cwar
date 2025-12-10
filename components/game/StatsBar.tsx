"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Hash,
  Flame,
} from "lucide-react";

interface StatItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "cyan" | "green" | "yellow" | "red" | "purple";
  suffix?: string;
  prefix?: string;
}

const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
}> = ({ value, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [trend, setTrend] = useState<"up" | "down" | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setTrend(value > prevValue.current ? "up" : "down");
      setIsAnimating(true);

      const startValue = prevValue.current;
      const endValue = value;
      const duration = 300;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(
          Math.round(startValue + (endValue - startValue) * easeOut)
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            setIsAnimating(false);
            setTrend(null);
          }, 500);
        }
      };

      requestAnimationFrame(animate);
      prevValue.current = value;
    }
  }, [value]);

  const trendClass = isAnimating
    ? trend === "up"
      ? "animated-counter--increase"
      : "animated-counter--decrease"
    : "";

  return (
    <motion.span
      className={`animated-counter ${trendClass}`}
      animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      {prefix}
      {displayValue}
      {suffix}
    </motion.span>
  );
};

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  icon,
  color,
  suffix = "",
  prefix = "",
}) => {
  return (
    <motion.div
      className={`stat-card stat-card--${color}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`stat-icon stat-icon--${color}`}>{icon}</div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </div>
    </motion.div>
  );
};

interface StatsBarProps {
  turn: number;
  clout: number;
  funds: number;
  risk: number;
  avgSupport: number;
  streak?: number;
}

const StatsBar: React.FC<StatsBarProps> = ({
  turn,
  clout,
  funds,
  risk,
  avgSupport,
  streak = 0,
}) => {
  const riskColor = risk >= 70 ? "red" : risk >= 40 ? "yellow" : "green";
  const supportColor =
    avgSupport >= 60 ? "green" : avgSupport >= 30 ? "yellow" : "red";

  return (
    <motion.div
      className="stats-bar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StatItem
        label="Turn"
        value={turn}
        icon={<Hash size={18} />}
        color="purple"
      />
      <StatItem
        label="Clout"
        value={clout}
        icon={<Zap size={18} />}
        color="cyan"
      />
      <StatItem
        label="Funds"
        value={funds}
        icon={<DollarSign size={18} />}
        color="green"
        prefix="$"
      />
      <StatItem
        label="Risk"
        value={risk}
        icon={<AlertTriangle size={18} />}
        color={riskColor}
        suffix="%"
      />
      <StatItem
        label="Support"
        value={avgSupport}
        icon={<TrendingUp size={18} />}
        color={supportColor}
        suffix="%"
      />
      {streak > 0 && (
        <motion.div
          className="stat-card stat-card--streak"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Flame size={18} className="streak-icon" />
          <div className="stat-content">
            <span className="stat-label">Streak</span>
            <span className="streak-value">{streak}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StatsBar;
