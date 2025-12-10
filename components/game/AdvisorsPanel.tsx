"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Quote } from "lucide-react";
import { useGameContext } from "@/lib/game/GameContext";
import GlassPanel from "./GlassPanel";

const AdvisorsPanel: React.FC = () => {
  const { state } = useGameContext();
  const advisors = state.advisors;

  return (
    <GlassPanel title="Advisors" icon={Users} glowColor="purple">
      <div className="advisors-grid">
        {advisors.map((adv, idx) => (
          <motion.div
            key={idx}
            className="advisor-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="advisor-header">
              <div className="advisor-avatar">{adv.name.charAt(0)}</div>
              <div className="advisor-info">
                <strong className="advisor-name">{adv.name}</strong>
                <span className="advisor-role">{adv.role}</span>
              </div>
            </div>
            <div className="advisor-traits">{adv.traits}</div>
            <div className="advisor-quotes">
              {adv.quotes.slice(0, 2).map((q, qi) => (
                <div key={qi} className="advisor-quote">
                  <Quote size={12} className="quote-icon" />
                  <span>&quot;{q}&quot;</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  );
};

export default AdvisorsPanel;
