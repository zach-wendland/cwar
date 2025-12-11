"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, DollarSign, Lock, Sparkles, Clock, TrendingDown } from "lucide-react";

interface ActionCardProps {
  id: string;
  name: string;
  description: string;
  cost?: { funds?: number; clout?: number };
  disabled: boolean;
  onClick: () => void;
  isCriticalHit?: boolean;
  cooldownTurns?: number;
  disabledReason?: string;
  diminishedMultiplier?: number;
}

const ActionCard: React.FC<ActionCardProps> = ({
  id,
  name,
  description,
  cost,
  disabled,
  onClick,
  isCriticalHit = false,
  cooldownTurns = 0,
  disabledReason,
  diminishedMultiplier = 1,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsPressed(true);
    setShowRipple(true);
    onClick();
    setTimeout(() => {
      setIsPressed(false);
      setShowRipple(false);
    }, 300);
  };

  const hasCost = cost && (cost.funds || cost.clout);

  return (
    <motion.button
      className={`action-btn ${disabled ? "action-btn--disabled" : ""} ${
        isCriticalHit ? "action-btn--critical" : ""
      }`}
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      animate={
        isCriticalHit
          ? {
              boxShadow: [
                "0 0 20px rgba(251, 191, 36, 0)",
                "0 0 40px rgba(251, 191, 36, 0.5)",
                "0 0 20px rgba(251, 191, 36, 0)",
              ],
            }
          : {}
      }
      transition={isCriticalHit ? { duration: 0.5, repeat: 2 } : {}}
    >
      <AnimatePresence>
        {showRipple && (
          <motion.div
            className="action-ripple"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      <div className="action-btn__content">
        <div className="action-btn__header">
          <strong className="action-btn__name">{name}</strong>
          {cooldownTurns > 0 && (
            <span className="cooldown-badge flex items-center gap-0.5 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
              <Clock size={10} />
              {cooldownTurns}
            </span>
          )}
          {disabled && !cooldownTurns && <Lock size={14} className="action-btn__lock" />}
          {isCriticalHit && (
            <motion.span
              className="critical-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            >
              <Sparkles size={14} /> CRIT!
            </motion.span>
          )}
        </div>
        <p className="action-btn__description">{description}</p>

        {/* Disabled reason tooltip */}
        {disabled && disabledReason && (
          <p className="text-xs text-red-400/80 mt-1 italic">{disabledReason}</p>
        )}

        {/* Diminishing returns warning */}
        {!disabled && diminishedMultiplier < 1 && (
          <p className="text-xs text-yellow-400/80 mt-1 flex items-center gap-1">
            <TrendingDown size={10} />
            {Math.round((1 - diminishedMultiplier) * 100)}% reduced effectiveness
          </p>
        )}

        {hasCost && (
          <div className="action-btn__cost">
            {cost?.funds && (
              <span className="cost-item cost-item--funds">
                <DollarSign size={12} />
                {cost.funds}
              </span>
            )}
            {cost?.clout && (
              <span className="cost-item cost-item--clout">
                <Zap size={12} />
                {cost.clout}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default ActionCard;
