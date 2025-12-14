"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, Lock, Unlock, Zap, DollarSign, Play, Phone } from "lucide-react";
import { useGameContext } from "@/lib/game/GameContext";
import {
  SpinState,
  INITIAL_SPIN_STATE,
  performSpin,
  getRerollCost,
  canAffordReroll,
  getSpinCost,
  canExecuteSpin,
} from "@/lib/game/spinSystem";
import { calculateComboMultiplier, ComboResult } from "@/lib/game/comboEngine";
import { ReelItem } from "@/lib/game/reelConfigs";
import GlassPanel from "./GlassPanel";
import ComboPopup from "./ComboPopup";

// ================================
// REEL DISPLAY COMPONENT
// ================================

interface ReelDisplayProps {
  item: ReelItem | null;
  isLocked: boolean;
  onToggleLock: () => void;
  isSpinning: boolean;
  reelType: "action" | "modifier" | "target";
}

const ReelDisplay: React.FC<ReelDisplayProps> = ({
  item,
  isLocked,
  onToggleLock,
  isSpinning,
  reelType,
}) => {
  const reelLabels = {
    action: "ACTION",
    modifier: "MODIFIER",
    target: "TARGET",
  };

  const reelColors = {
    action: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    modifier: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    target: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] text-white/40 uppercase tracking-wider">
        {reelLabels[reelType]}
      </span>

      <motion.div
        className={`relative w-24 h-28 rounded-xl bg-gradient-to-b ${reelColors[reelType]} border backdrop-blur-sm overflow-hidden`}
        animate={isSpinning ? { y: [0, -5, 5, -3, 3, 0] } : {}}
        transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
      >
        {/* Lock indicator */}
        {isLocked && (
          <div className="absolute top-1 right-1 z-10">
            <Lock size={12} className="text-amber-400" />
          </div>
        )}

        {/* Reel content */}
        <AnimatePresence mode="wait">
          {item ? (
            <motion.div
              key={item.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="flex flex-col items-center justify-center h-full p-2"
            >
              <span className="text-3xl mb-1">{item.emoji}</span>
              <span className="text-xs font-semibold text-white text-center leading-tight">
                {item.name}
              </span>
              {/* Tag preview */}
              <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] px-1 py-0.5 bg-white/10 rounded text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full"
            >
              <span className="text-4xl text-white/20">?</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Lock toggle button */}
      <motion.button
        onClick={onToggleLock}
        disabled={!item}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
          isLocked
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
        } ${!item ? "opacity-50 cursor-not-allowed" : ""}`}
        whileTap={{ scale: 0.95 }}
      >
        {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
        {isLocked ? "Locked" : "Lock"}
      </motion.button>
    </div>
  );
};

// ================================
// MAIN SPIN WHEEL COMPONENT
// ================================

const SpinWheel: React.FC = () => {
  const { state, dispatch } = useGameContext();

  // Local spin state
  const [spinState, setSpinState] = useState<SpinState>(INITIAL_SPIN_STATE);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showCombo, setShowCombo] = useState(false);

  // Calculate current combo if we have a spin result
  const currentCombo: ComboResult | null = spinState.currentSpin
    ? calculateComboMultiplier(
        spinState.currentSpin.action,
        spinState.currentSpin.modifier,
        spinState.currentSpin.target
      )
    : null;

  // Calculate costs
  const lockedCount = Object.values(spinState.lockedReels).filter(Boolean).length;
  const rerollCost = getRerollCost(spinState.rerollsThisTurn, lockedCount);
  const spinCost = spinState.currentSpin ? getSpinCost(spinState.currentSpin) : null;

  // Validation
  const canReroll = canAffordReroll(state.clout, spinState.rerollsThisTurn, lockedCount);
  const executeCheck = canExecuteSpin(spinState.currentSpin, state);

  // ================================
  // HANDLERS
  // ================================

  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    // Deduct reroll cost if this is a reroll (before spinning)
    const isReroll = spinState.currentSpin !== null;
    if (isReroll && rerollCost > 0) {
      dispatch({ type: "REROLL_SPIN", cost: rerollCost });
    }

    setIsSpinning(true);
    setShowCombo(false);

    // Animate spin
    setTimeout(() => {
      const result = performSpin(state, spinState.lockedReels, spinState.currentSpin);

      setSpinState((prev) => ({
        ...prev,
        currentSpin: result,
        rerollsThisTurn: prev.currentSpin ? prev.rerollsThisTurn + 1 : 0,
      }));

      setIsSpinning(false);

      // Show combo popup if there's a match
      const combo = calculateComboMultiplier(result.action, result.modifier, result.target);
      if (combo.multiplier > 1) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 2000);
      }
    }, 600);
  }, [isSpinning, state, spinState, rerollCost, dispatch]);

  const handleToggleLock = useCallback((reel: "action" | "modifier" | "target") => {
    setSpinState((prev) => ({
      ...prev,
      lockedReels: {
        ...prev.lockedReels,
        [reel]: !prev.lockedReels[reel],
      },
    }));
  }, []);

  const handleExecute = useCallback(() => {
    if (!spinState.currentSpin || !executeCheck.canExecute) return;

    // Dispatch spin action to game context
    dispatch({
      type: "SPIN_ACTION",
      spinResult: spinState.currentSpin,
      comboResult: currentCombo,
    });

    // Reset spin state for next turn
    setSpinState({
      ...INITIAL_SPIN_STATE,
      lastCombo: currentCombo,
    });
  }, [spinState.currentSpin, executeCheck.canExecute, dispatch, currentCombo]);

  const handleReset = useCallback(() => {
    setSpinState(INITIAL_SPIN_STATE);
    setShowCombo(false);
  }, []);

  // ================================
  // RENDER
  // ================================

  return (
    <GlassPanel title="Spin to Act" icon={Dices} className="mb-4" glowColor="purple">
      {/* Combo popup */}
      <AnimatePresence>
        {showCombo && currentCombo && currentCombo.multiplier > 1 && (
          <ComboPopup combo={currentCombo} />
        )}
      </AnimatePresence>

      {/* Three reels */}
      <div className="flex justify-center gap-3 mb-4">
        <ReelDisplay
          item={spinState.currentSpin?.action || null}
          isLocked={spinState.lockedReels.action}
          onToggleLock={() => handleToggleLock("action")}
          isSpinning={isSpinning}
          reelType="action"
        />
        <ReelDisplay
          item={spinState.currentSpin?.modifier || null}
          isLocked={spinState.lockedReels.modifier}
          onToggleLock={() => handleToggleLock("modifier")}
          isSpinning={isSpinning}
          reelType="modifier"
        />
        <ReelDisplay
          item={spinState.currentSpin?.target || null}
          isLocked={spinState.lockedReels.target}
          onToggleLock={() => handleToggleLock("target")}
          isSpinning={isSpinning}
          reelType="target"
        />
      </div>

      {/* Combo indicator */}
      {currentCombo && currentCombo.multiplier > 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-3 px-3 py-2 rounded-lg text-center ${
            currentCombo.isJackpot
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
              : "bg-purple-500/20 border border-purple-500/30"
          }`}
        >
          <span
            className={`text-sm font-bold ${
              currentCombo.isJackpot ? "text-amber-400" : "text-purple-400"
            }`}
          >
            {currentCombo.comboName || "COMBO"} - {currentCombo.multiplier}x
          </span>
          {currentCombo.matchedTags.length > 0 && (
            <div className="flex justify-center gap-1 mt-1">
              {currentCombo.matchedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Cost display */}
      {spinCost && (spinCost.funds > 0 || spinCost.clout > 0) && (
        <div className="flex justify-center gap-3 mb-3 text-sm">
          {spinCost.funds > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <DollarSign size={14} />
              {spinCost.funds}
            </span>
          )}
          {spinCost.clout > 0 && (
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap size={14} />
              {spinCost.clout}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Spin/Reroll button */}
        <motion.button
          onClick={handleSpin}
          disabled={isSpinning || (spinState.currentSpin !== null && !canReroll)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
            isSpinning
              ? "bg-white/10 text-white/40 cursor-wait"
              : spinState.currentSpin
              ? canReroll
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
                : "bg-white/5 text-white/30 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400"
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <Dices size={18} className={isSpinning ? "animate-spin" : ""} />
          {spinState.currentSpin ? (
            <>
              Reroll ({rerollCost} <Zap size={12} />)
            </>
          ) : (
            "SPIN"
          )}
        </motion.button>

        {/* Execute button */}
        {spinState.currentSpin && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleExecute}
            disabled={!executeCheck.canExecute}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
              executeCheck.canExecute
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400"
                : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
            whileTap={{ scale: 0.98 }}
            title={executeCheck.reason}
          >
            <Play size={18} />
            EXECUTE
            {state.consultedAdvisor && (
              <span className="flex items-center gap-1 text-xs bg-cyan-400/20 px-1.5 py-0.5 rounded">
                <Phone size={10} className="animate-pulse" />
                +25%
              </span>
            )}
          </motion.button>
        )}
      </div>

      {/* Error message */}
      {!executeCheck.canExecute && spinState.currentSpin && (
        <p className="text-xs text-red-400/80 text-center mt-2">
          {executeCheck.reason}
        </p>
      )}

      {/* Reset button */}
      {spinState.currentSpin && (
        <button
          onClick={handleReset}
          className="w-full mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Reset spin
        </button>
      )}
    </GlassPanel>
  );
};

export default SpinWheel;
