"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameContext, TutorialStep } from "@/lib/game/GameContext";

interface TutorialContent {
  title: string;
  description: string;
  tip?: string;
}

const TUTORIAL_CONTENT: Record<TutorialStep, TutorialContent> = {
  WELCOME: {
    title: "Welcome",
    description: "Start your digital movement!",
  },
  FIRST_ACTION: {
    title: "Choose Your First Action",
    description: "Click an action card on the right to begin. Try 'Fundraise' - it's free and safe!",
    tip: "Green actions are safer, red ones are risky but powerful.",
  },
  RESOURCES_INTRO: {
    title: "Your Resources",
    description: "You have three main resources: Clout (reputation), Funds (money), and Risk (danger level).",
    tip: "Keep Risk below 100% or you'll be banned!",
  },
  MAP_INTRO: {
    title: "The Support Map",
    description: "Each state has its own support level. Darker green = more support. Aim for 80% average!",
    tip: "Hover over states to see their current support.",
  },
  SPIN_MODE: {
    title: "Spin Mode",
    description: "The 3-reel system lets you combine actions for bonus effects. Lock reels you like and reroll the rest!",
    tip: "Matching combos give multipliers to your effects.",
  },
  FACTION_INTRO: {
    title: "Factions",
    description: "Five factions track your movement. Each has preferences - you can't please everyone!",
    tip: "Get any faction to 95% loyalty for an alternate victory.",
  },
  VICTORY_PATHS: {
    title: "Multiple Victory Paths",
    description: "You can win by: 80% avg support, faction dominance (95%), economic power ($500 + 200 clout), or speed run (75% by turn 20).",
    tip: "Track your progress in the Victory Tracker!",
  },
  RISK_WARNING: {
    title: "Risk Zone Warning!",
    description: "You've entered the CAUTION zone. Action costs increase by 10%. Be careful!",
    tip: "Use 'Cover Story' or 'Legal Fund' to reduce risk.",
  },
};

interface TutorialOverlayProps {
  step: TutorialStep;
  position?: "top" | "bottom" | "center";
  onComplete?: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  position = "bottom",
  onComplete,
}) => {
  const { dispatch } = useGameContext();
  const content = TUTORIAL_CONTENT[step];

  const handleComplete = () => {
    dispatch({ type: "COMPLETE_TUTORIAL_STEP", step });
    onComplete?.();
  };

  const handleSkipAll = () => {
    // Mark all tutorial steps as complete
    Object.keys(TUTORIAL_CONTENT).forEach((s) => {
      dispatch({ type: "COMPLETE_TUTORIAL_STEP", step: s as TutorialStep });
    });
    onComplete?.();
  };

  const positionClasses = {
    top: "top-4 left-1/2 -translate-x-1/2",
    bottom: "bottom-4 left-1/2 -translate-x-1/2",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed z-40 ${positionClasses[position]} max-w-md w-full mx-4`}
        initial={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="bg-card/95 backdrop-blur-md border border-primary/40 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-border">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {content.title}
              </span>
            </div>
            <button
              onClick={handleSkipAll}
              className="p-1 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Skip all tutorials"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              {content.description}
            </p>

            {content.tip && (
              <div className="bg-amber/10 border border-amber/30 rounded-lg p-2 mb-3">
                <p className="text-xs text-amber flex items-start gap-1.5">
                  <span className="font-semibold flex-shrink-0">Tip:</span>
                  {content.tip}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkipAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip all hints
              </button>
              <Button
                size="sm"
                onClick={handleComplete}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
              >
                Got it
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook to use tutorial overlay with automatic step detection
export function useTutorialOverlay() {
  const { state, dispatch } = useGameContext();

  const showTutorial = (step: TutorialStep) => {
    if (
      state.tutorial.tutorialDismissed &&
      !state.tutorial.completedSteps.includes(step)
    ) {
      dispatch({ type: "SET_TUTORIAL_STEP", step });
    }
  };

  const hideTutorial = () => {
    dispatch({ type: "SET_TUTORIAL_STEP", step: null });
  };

  const completeTutorial = (step: TutorialStep) => {
    dispatch({ type: "COMPLETE_TUTORIAL_STEP", step });
  };

  const markFeatureSeen = (
    feature: keyof typeof state.tutorial.firstTimeFeatures
  ) => {
    dispatch({ type: "MARK_FEATURE_SEEN", feature });
  };

  return {
    currentStep: state.tutorial.currentStep,
    completedSteps: state.tutorial.completedSteps,
    firstTimeFeatures: state.tutorial.firstTimeFeatures,
    tutorialDismissed: state.tutorial.tutorialDismissed,
    showTutorial,
    hideTutorial,
    completeTutorial,
    markFeatureSeen,
  };
}

export default TutorialOverlay;
