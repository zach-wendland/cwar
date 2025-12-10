"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, DollarSign, Lock, Sparkles } from "lucide-react";

interface ActionCardProps {
  id: string;
  name: string;
  description: string;
  cost?: { funds?: number; clout?: number };
  disabled: boolean;
  onClick: () => void;
  isCriticalHit?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  id,
  name,
  description,
  cost,
  disabled,
  onClick,
  isCriticalHit = false,
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
          {disabled && <Lock size={14} className="action-btn__lock" />}
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
