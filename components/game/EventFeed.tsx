"use client";

import React from "react";
import { motion } from "framer-motion";
import { Newspaper, MessageCircle } from "lucide-react";
import { useGameContext } from "@/lib/game/GameContext";
import GlassPanel from "./GlassPanel";
import StatsBar from "./StatsBar";
import RiskMeter from "./RiskMeter";

const EventFeed: React.FC = () => {
  const { state } = useGameContext();

  const newsItems = state.newsLog;
  const tweets = state.socialFeed;
  const avgSupport = Math.round(
    Object.values(state.support).reduce((a, b) => a + b, 0) /
      Object.keys(state.support).length
  );

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
