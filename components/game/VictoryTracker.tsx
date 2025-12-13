"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";
import { useGameContext, VictoryType } from "@/lib/game/GameContext";

interface VictoryPath {
  id: VictoryType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  requirements: {
    label: string;
    current: number;
    target: number;
    unit?: string;
    prefix?: string;
  }[];
}

const VictoryTracker: React.FC = () => {
  const { state } = useGameContext();
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate victory progress metrics
  const avgSupport = Math.round(
    Object.values(state.support).reduce((a, b) => a + b, 0) /
      Object.keys(state.support).length
  );
  const statesControlled = Object.values(state.support).filter(
    (s) => s >= 60
  ).length;
  const highestFaction = Math.max(...Object.values(state.factionSupport));
  const bestFactionName =
    Object.entries(state.factionSupport).find(
      ([, v]) => v === highestFaction
    )?.[0] || "Unknown";

  // Define all 4 victory paths
  const victoryPaths: VictoryPath[] = [
    {
      id: "POPULAR_MANDATE",
      name: "Popular Mandate",
      description: "Win the hearts of America",
      icon: Trophy,
      color: "text-game-gold",
      bgColor: "bg-game-gold/10",
      requirements: [
        {
          label: "Avg Support",
          current: avgSupport,
          target: 80,
          unit: "%",
        },
        {
          label: "States at 60%+",
          current: statesControlled,
          target: 35,
        },
      ],
    },
    {
      id: "FACTION_DOMINANCE",
      name: "Faction Dominance",
      description: `Rally ${bestFactionName} to your cause`,
      icon: Users,
      color: "text-game-purple",
      bgColor: "bg-game-purple/10",
      requirements: [
        {
          label: `${bestFactionName} Loyalty`,
          current: Math.round(highestFaction),
          target: 95,
          unit: "%",
        },
      ],
    },
    {
      id: "ECONOMIC_POWER",
      name: "Economic Power",
      description: "Build an unstoppable war chest",
      icon: DollarSign,
      color: "text-game-green",
      bgColor: "bg-game-green/10",
      requirements: [
        {
          label: "Funds Earned",
          current: state.totalFundsEarned,
          target: 500,
          prefix: "$",
        },
        {
          label: "Clout Earned",
          current: state.totalCloutEarned,
          target: 200,
        },
      ],
    },
    {
      id: "SPEED_RUN",
      name: "Speed Run",
      description: "Win fast before turn 20",
      icon: Zap,
      color: "text-game-amber",
      bgColor: "bg-game-amber/10",
      requirements: [
        {
          label: "Support",
          current: avgSupport,
          target: 75,
          unit: "%",
        },
        {
          label: "Turns Left",
          current: Math.max(0, 20 - state.turn),
          target: 20,
        },
      ],
    },
  ];

  // Calculate overall progress for each path
  const getPathProgress = (path: VictoryPath): number => {
    const progressValues = path.requirements.map((req) => {
      // For "turns left", invert the progress logic
      if (req.label === "Turns Left") {
        return state.turn <= 20 ? 100 : 0; // Still valid if under 20 turns
      }
      return Math.min(100, (req.current / req.target) * 100);
    });
    return Math.round(
      progressValues.reduce((a, b) => a + b, 0) / progressValues.length
    );
  };

  // Find closest victory path
  const sortedPaths = [...victoryPaths].sort(
    (a, b) => getPathProgress(b) - getPathProgress(a)
  );
  const closestPath = sortedPaths[0];
  const closestProgress = getPathProgress(closestPath);

  return (
    <div className="victory-tracker" data-testid="victory-tracker">
      {/* Collapsed summary view */}
      <motion.button
        className="victory-tracker__summary"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="victory-tracker__header">
          <Target size={16} className="text-primary" />
          <span className="victory-tracker__title">Victory Progress</span>
        </div>

        <div className="victory-tracker__preview">
          <div className="victory-tracker__closest">
            <closestPath.icon size={14} className={closestPath.color} />
            <span className="text-xs text-muted-foreground">
              {closestPath.name}
            </span>
            <span className={`text-xs font-bold ${closestPath.color}`}>
              {closestProgress}%
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </motion.button>

      {/* Expanded detail view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="victory-tracker__details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {victoryPaths.map((path) => {
              const progress = getPathProgress(path);
              const Icon = path.icon;
              const isViable =
                path.id !== "SPEED_RUN" || state.turn <= 20;

              return (
                <motion.div
                  key={path.id}
                  className={`victory-path ${!isViable ? "victory-path--disabled" : ""}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isViable ? 1 : 0.5, x: 0 }}
                  transition={{ delay: 0.05 * victoryPaths.indexOf(path) }}
                >
                  <div className="victory-path__header">
                    <div className={`victory-path__icon ${path.bgColor}`}>
                      <Icon size={16} className={path.color} />
                    </div>
                    <div className="victory-path__info">
                      <h4 className="victory-path__name">{path.name}</h4>
                      <p className="victory-path__desc">{path.description}</p>
                    </div>
                    <div className={`victory-path__progress ${path.color}`}>
                      {progress}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="victory-path__bar-container">
                    <motion.div
                      className="victory-path__bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        backgroundColor: `hsl(var(--${path.color.replace("text-", "")}))`,
                      }}
                    />
                  </div>

                  {/* Requirements */}
                  <div className="victory-path__requirements">
                    {path.requirements.map((req, i) => (
                      <div key={i} className="victory-requirement">
                        <span className="victory-requirement__label">
                          {req.label}
                        </span>
                        <span
                          className={`victory-requirement__value ${
                            req.current >= req.target
                              ? "text-risk-safe"
                              : "text-muted-foreground"
                          }`}
                        >
                          {req.prefix}
                          {req.current}
                          {req.unit} / {req.prefix}
                          {req.target}
                          {req.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Victory indicator */}
                  {progress >= 100 && (
                    <motion.div
                      className="victory-path__complete"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Trophy size={12} />
                      <span>Victory Available!</span>
                    </motion.div>
                  )}

                  {/* Speed run warning */}
                  {path.id === "SPEED_RUN" && !isViable && (
                    <div className="victory-path__warning">
                      <Clock size={12} />
                      <span>Past turn 20 - no longer available</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VictoryTracker;
