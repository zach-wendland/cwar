"use client";

import React from "react";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { useGameContext, getRiskZone, RISK_ZONES } from "@/lib/game/GameContext";
import {
  actionsConfig,
  canPerformAction,
  isActionOnCooldown,
  getDiminishingReturnsMultiplier
} from "@/lib/game/actions";
import { getActionDiscount } from "@/lib/game/advisorAbilities";
import GlassPanel from "./GlassPanel";
import ActionCard from "./ActionCard";

const ActionPanel: React.FC = () => {
  const { state, dispatch } = useGameContext();

  const handleActionClick = (actionId: string) => {
    dispatch({ type: "PERFORM_ACTION", actionId });
  };

  // Get current risk zone for cost multiplier display
  const riskZone = getRiskZone(state.risk);
  const costMultiplier = RISK_ZONES[riskZone].costMultiplier;

  return (
    <GlassPanel title="Actions" icon={Swords} className="mb-4" glowColor="cyan">
      {costMultiplier > 1 && (
        <div className="mb-3 px-2 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400">
          ⚠️ High risk zone: All costs +{Math.round((costMultiplier - 1) * 100)}%
        </div>
      )}
      <div className="actions-grid">
        {actionsConfig.map((action, idx) => {
          // Use new action economy system
          const actionCheck = canPerformAction(
            action.id,
            state,
            state.actionCooldowns || {},
            state.consecutiveActionUses || {}
          );

          const cooldownCheck = isActionOnCooldown(action.id, state.actionCooldowns || {});
          const diminishedMultiplier = getDiminishingReturnsMultiplier(
            action.id,
            state.consecutiveActionUses || {}
          );

          // Get advisor discounts (matches GameContext.tsx calculation)
          const advisorNames = state.advisors.map(a => a.name);
          const { fundsDiscount, cloutDiscount } = getActionDiscount(action.id, advisorNames);

          // Check basic resource costs (with advisor discount + risk zone multiplier)
          // Uses Math.round to match GameContext.tsx exactly
          let resourceDisabled = false;
          let resourceReason = "";
          if (action.cost) {
            const adjustedFundsCost = action.cost.funds
              ? Math.round(action.cost.funds * (1 - fundsDiscount / 100) * costMultiplier)
              : 0;
            const adjustedCloutCost = action.cost.clout
              ? Math.round(action.cost.clout * (1 - cloutDiscount / 100) * costMultiplier)
              : 0;

            if (adjustedFundsCost && state.funds < adjustedFundsCost) {
              resourceDisabled = true;
              resourceReason = `Need $${adjustedFundsCost} (have $${state.funds})`;
            }
            if (adjustedCloutCost && state.clout < adjustedCloutCost) {
              resourceDisabled = true;
              resourceReason = `Need ${adjustedCloutCost} clout (have ${state.clout})`;
            }
          }

          // Determine final disabled state and reason
          let disabled = false;
          let disabledReason: string | undefined;

          if (state.pendingEvent) {
            disabled = true;
            disabledReason = "Resolve event first";
          } else if (state.victory || state.gameOver) {
            disabled = true;
            disabledReason = "Game ended";
          } else if (cooldownCheck.onCooldown) {
            disabled = true;
            disabledReason = `On cooldown (${cooldownCheck.turnsRemaining} turns)`;
          } else if (!actionCheck.canPerform) {
            disabled = true;
            disabledReason = actionCheck.reason;
          } else if (resourceDisabled) {
            disabled = true;
            disabledReason = resourceReason;
          }

          // Adjust displayed cost to match actual charges (advisor discount + risk zone)
          const displayCost = action.cost ? {
            funds: action.cost.funds
              ? Math.round(action.cost.funds * (1 - fundsDiscount / 100) * costMultiplier)
              : undefined,
            clout: action.cost.clout
              ? Math.round(action.cost.clout * (1 - cloutDiscount / 100) * costMultiplier)
              : undefined,
          } : undefined;

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ActionCard
                id={action.id}
                name={action.name}
                description={action.description}
                cost={displayCost}
                disabled={disabled}
                onClick={() => handleActionClick(action.id)}
                cooldownTurns={cooldownCheck.onCooldown ? cooldownCheck.turnsRemaining : 0}
                disabledReason={disabledReason}
                diminishedMultiplier={diminishedMultiplier}
              />
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export default ActionPanel;
