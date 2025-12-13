"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, BookOpen, Target, AlertTriangle, Trophy, Users, DollarSign, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGameContext } from "@/lib/game/GameContext";

interface IntroTutorialProps {
  onDismiss?: () => void;
  onOpenFullTutorial?: () => void;
}

const IntroTutorial: React.FC<IntroTutorialProps> = ({ onDismiss, onOpenFullTutorial }) => {
  const { state, dispatch } = useGameContext();
  const [showFullBriefing, setShowFullBriefing] = React.useState(false);

  // Don't render if tutorial is already dismissed
  if (state.tutorial.tutorialDismissed) {
    return null;
  }

  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_TUTORIAL' });
    dispatch({ type: 'COMPLETE_TUTORIAL_STEP', step: 'WELCOME' });
    onDismiss?.();
  };

  const handleSkip = () => {
    // Mark tutorial as dismissed and skip all steps
    dispatch({ type: 'DISMISS_TUTORIAL' });
    dispatch({ type: 'COMPLETE_TUTORIAL_STEP', step: 'WELCOME' });
    dispatch({ type: 'COMPLETE_TUTORIAL_STEP', step: 'FIRST_ACTION' });
    dispatch({ type: 'COMPLETE_TUTORIAL_STEP', step: 'RESOURCES_INTRO' });
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

        {/* Modal content */}
        <motion.div
          className="relative max-w-2xl w-full bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header with close button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleSkip}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Skip tutorial"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Gradient header */}
          <div className="p-6 pb-4 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent">
            <Badge variant="cyan" className="mb-2 text-xs uppercase tracking-wider">
              Briefing
            </Badge>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Culture War: Rise or Vanish
            </h2>
            <p className="text-muted-foreground text-sm">
              Lead a digital movement. Shape narratives, build support across states, and avoid getting banned.
            </p>
          </div>

          {/* Quick overview or full briefing */}
          <div className="p-6 pt-2">
            {!showFullBriefing ? (
              <div className="space-y-4">
                {/* Victory conditions - simplified */}
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Target size={16} className="text-primary" />
                    How to Win
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Trophy size={14} className="text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">80% avg support</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={14} className="text-purple mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">95% faction loyalty</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign size={14} className="text-green mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">$500 + 200 clout earned</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="text-amber mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">75% by turn 20</span>
                    </div>
                  </div>
                </div>

                {/* Defeat warning */}
                <div className="bg-risk-danger/10 rounded-lg p-4 border border-risk-danger/30">
                  <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-risk-danger" />
                    How to Lose
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Risk reaches 100%, faction abandons you, or you go bankrupt for 3+ turns.
                  </p>
                </div>

                {/* Resource badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="cyan">Clout = Reputation</Badge>
                  <Badge variant="green">Funds = Money</Badge>
                  <Badge variant="yellow">Risk = Danger Level</Badge>
                </div>
              </div>
            ) : (
              <FullBriefing />
            )}
          </div>

          {/* Action buttons */}
          <div className="p-6 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/20">
            <div className="flex gap-2">
              <button
                onClick={() => setShowFullBriefing(!showFullBriefing)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <BookOpen size={14} />
                {showFullBriefing ? "Quick View" : "More Details"}
              </button>
              {onOpenFullTutorial && (
                <button
                  onClick={() => {
                    handleDismiss();
                    onOpenFullTutorial();
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  <BookOpen size={14} />
                  Full Guide
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={handleDismiss}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
              >
                <Play size={14} />
                Start Playing
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Full briefing component for detailed tutorial
const FullBriefing: React.FC = () => (
  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
    <div className="bg-muted/30 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-2">Your Toolkit</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li><strong className="text-cyan">Clout</strong>: Reputation for high-profile actions</li>
        <li><strong className="text-green">Funds</strong>: Money to deploy across campaigns</li>
        <li><strong className="text-risk-danger">Risk</strong>: Platform scrutiny - keep it low!</li>
        <li><strong className="text-foreground">Support</strong>: State-by-state backing</li>
      </ul>
    </div>

    <div className="bg-muted/30 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-2">Turn Flow</h4>
      <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
        <li>Choose an <strong>Action</strong> to invest clout or funds</li>
        <li>Watch <strong>News</strong> and <strong>Social</strong> feeds react</li>
        <li>Handle any <strong>Events</strong> that appear</li>
        <li>Check the <strong>Map</strong> for shifting support</li>
      </ol>
    </div>

    <div className="bg-muted/30 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-2">Pro Tips</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>Chain low-cost moves before big swings</li>
        <li>Pair growth actions with cover stories</li>
        <li>Advisors give discounts - read their abilities!</li>
        <li>CAUTION zone (50+ risk) increases costs by 10%</li>
      </ul>
    </div>
  </div>
);

export default IntroTutorial;
