"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, MessageCircle, Activity, Users, Search, Zap, Clock, CheckCircle } from "lucide-react";
import { useGameContext } from "@/lib/game/GameContext";
import GlassPanel from "./GlassPanel";
import StatsBar from "./StatsBar";
import RiskMeter from "./RiskMeter";
import {
  FACTION_DISPLAY_NAMES,
  MOOD_THRESHOLDS,
  getSentimentEffectMultiplier,
} from "@/lib/game/sentimentEngine";

// Investigation cost constant (must match GameContext)
const INVESTIGATION_CLOUT_COST = 10;

const EventFeed: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const [showFactionDetails, setShowFactionDetails] = useState(false);
  const [showIntel, setShowIntel] = useState(false);

  const newsItems = state.newsLog;
  const tweets = state.socialFeed;
  const avgSupport = Math.round(
    Object.values(state.support).reduce((a, b) => a + b, 0) /
      Object.keys(state.support).length
  );

  // Calculate Social Pulse values
  const sentiment = state.sentiment;
  const globalMomentum = sentiment?.globalMomentum || 50;
  const sentimentMultiplier = sentiment ? getSentimentEffectMultiplier(sentiment) : 1;
  const factionData = sentiment?.factions || {};

  // Determine pulse color based on momentum (-100 to +100)
  const getPulseColor = (momentum: number) => {
    if (momentum >= 50) return "#22c55e"; // Green - very positive
    if (momentum >= 20) return "#3b82f6"; // Blue - positive
    if (momentum >= -20) return "#eab308"; // Yellow - neutral
    if (momentum >= -50) return "#f97316"; // Orange - negative
    return "#ef4444"; // Red - very negative
  };

  const getPulseLabel = (momentum: number) => {
    if (momentum >= 50) return "Coalition Energized";
    if (momentum >= 20) return "Coalition Engaged";
    if (momentum >= -20) return "Coalition Neutral";
    if (momentum >= -50) return "Coalition Wary";
    return "Coalition Hostile";
  };

  const pulseColor = getPulseColor(globalMomentum);
  const pulseLabel = getPulseLabel(globalMomentum);
  // Normalize momentum from -100..100 to 0..100 for progress bar
  const pulsePercent = Math.max(0, Math.min(100, (globalMomentum + 100) / 2));

  return (
    <div className="event-feed-container">
      {/* Stats Bar */}
      <StatsBar
        turn={state.turn}
        clout={state.clout}
        funds={state.funds}
        risk={state.risk}
        avgSupport={avgSupport}
        streak={state.streak}
      />

      {/* Risk Meter */}
      <GlassPanel className="mb-4" animate={false}>
        <RiskMeter risk={state.risk} />
      </GlassPanel>

      {/* Social Pulse Meter (Sprint 6a) */}
      <GlassPanel className="mb-4" animate={false}>
        <div className="social-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: pulseColor }} />
              <span className="text-sm font-medium">Social Pulse</span>
            </div>
            <button
              onClick={() => setShowFactionDetails(!showFactionDetails)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-3 h-3" />
              {showFactionDetails ? "Hide" : "Show"} Factions
            </button>
          </div>

          {/* Pulse Bar */}
          <div className="relative h-3 bg-background/50 rounded-full overflow-hidden mb-2">
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ backgroundColor: pulseColor }}
              initial={{ width: 0 }}
              animate={{ width: `${pulsePercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {/* Center marker at 50% (neutral) */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30" />
          </div>

          {/* Pulse Info */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: pulseColor }}>{pulseLabel}</span>
            <span className="text-muted-foreground">
              Clout {sentimentMultiplier >= 1 ? "+" : ""}{Math.round((sentimentMultiplier - 1) * 100)}%
            </span>
          </div>

          {/* Faction Details (expandable) */}
          <AnimatePresence>
            {showFactionDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  {Object.entries(factionData).map(([factionId, faction]) => {
                    const moodInfo = MOOD_THRESHOLDS[faction.mood];
                    const factionName = FACTION_DISPLAY_NAMES[factionId] || factionId;
                    return (
                      <div key={factionId} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          <span>{moodInfo.icon}</span>
                          <span className="text-muted-foreground">{factionName}</span>
                        </span>
                        <span style={{ color: moodInfo.color }}>{moodInfo.label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassPanel>

      {/* Intel Panel - Upcoming Events (Sprint 7) */}
      {state.upcomingEvents.length > 0 && (
        <GlassPanel className="mb-4" animate={false}>
          <div className="intel-panel">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Intel</span>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  {state.upcomingEvents.length} upcoming
                </span>
              </div>
              <button
                onClick={() => setShowIntel(!showIntel)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showIntel ? "Hide" : "Show"} Details
              </button>
            </div>

            {/* Event previews */}
            <AnimatePresence>
              {showIntel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2">
                    {state.upcomingEvents.map((queuedEvent) => {
                      const isInvestigated = state.investigatedEventIds.includes(queuedEvent.eventId);
                      const canAfford = state.clout >= INVESTIGATION_CLOUT_COST;

                      return (
                        <div
                          key={queuedEvent.eventId}
                          className={`p-2 rounded-lg border ${
                            isInvestigated
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "bg-amber-500/10 border-amber-500/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock size={12} className="text-amber-400" />
                                <span className="text-xs text-amber-400">
                                  {queuedEvent.turnsUntil > 0
                                    ? `${queuedEvent.turnsUntil} turn${queuedEvent.turnsUntil > 1 ? "s" : ""} away`
                                    : "Imminent!"}
                                </span>
                                {isInvestigated && (
                                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                                    <CheckCircle size={10} />
                                    Prepared
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/60 italic">
                                {isInvestigated
                                  ? `"${queuedEvent.event.title}" - You know what's coming`
                                  : "🔮 Something's brewing in the network..."}
                              </p>
                            </div>

                            {!isInvestigated && (
                              <motion.button
                                onClick={() => dispatch({ type: "INVESTIGATE_EVENT", eventId: queuedEvent.eventId })}
                                disabled={!canAfford}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                                  canAfford
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                                    : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
                                }`}
                                whileHover={canAfford ? { scale: 1.05 } : {}}
                                whileTap={canAfford ? { scale: 0.95 } : {}}
                              >
                                <Search size={12} />
                                <span>{INVESTIGATION_CLOUT_COST}</span>
                                <Zap size={10} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Investigate to reveal event details and get +15% better outcomes
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed hint */}
            {!showIntel && (
              <p className="text-xs text-amber-400/60 italic">
                🔮 Whispers suggest events are coming... investigate to prepare
              </p>
            )}
          </div>
        </GlassPanel>
      )}

      {/* News Log Section */}
      <GlassPanel
        title="News"
        icon={Newspaper}
        className="mb-4"
        glowColor="purple"
      >
        <div className="news-feed max-h-48 overflow-y-auto">
          {newsItems.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              No news yet...
            </p>
          ) : (
            newsItems
              .slice(-10)
              .reverse()
              .map((text, idx) => (
                <motion.div
                  key={idx}
                  className="news-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <span className="news-marker">▪</span>
                  {text}
                </motion.div>
              ))
          )}
        </div>
      </GlassPanel>

      {/* Social Media Reactions Section */}
      <GlassPanel title="Social Media" icon={MessageCircle} glowColor="cyan">
        <div className="social-feed max-h-48 overflow-y-auto">
          {tweets.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              No reactions yet...
            </p>
          ) : (
            tweets
              .slice(-8)
              .reverse()
              .map((post, idx) => (
                <motion.div
                  key={idx}
                  className="tweet-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <span className="tweet-user">{post.user}</span>
                  <span className="tweet-content">{post.content}</span>
                </motion.div>
              ))
          )}
        </div>
      </GlassPanel>
    </div>
  );
};

export default EventFeed;
