import React from 'react';
import { motion } from 'framer-motion';
import { factions } from '../../lib/game/factions';
import { useGameContext } from '../../lib/game/GameContext';
import GlassPanel from './GlassPanel';

interface FactionBarProps {
  faction: typeof factions[0];
  support: number;
  index: number;
}

const FactionBar: React.FC<FactionBarProps> = ({ faction, support, index }) => {
  // Color based on support level
  const getBarColor = (support: number) => {
    if (support >= 70) return 'bg-green-500';
    if (support >= 50) return 'bg-cyan-500';
    if (support >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get sentiment text
  const getSentiment = (support: number) => {
    if (support >= 80) return 'Devoted';
    if (support >= 60) return 'Supportive';
    if (support >= 40) return 'Neutral';
    if (support >= 20) return 'Skeptical';
    return 'Hostile';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-3"
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{faction.icon}</span>
          <span className="text-white font-medium text-sm">{faction.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">{getSentiment(support)}</span>
          <span className="text-white font-bold text-sm">{Math.round(support)}%</span>
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getBarColor(support)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${support}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      </div>
      <p className="text-xs text-white/40 mt-1 truncate">{faction.description}</p>
    </motion.div>
  );
};

const FactionPanel: React.FC = () => {
  const { state } = useGameContext();

  // Sort factions by support level
  const sortedFactions = [...factions].sort((a, b) => {
    const supportA = state.factionSupport[a.id] || a.baseSupport;
    const supportB = state.factionSupport[b.id] || b.baseSupport;
    return supportB - supportA;
  });

  // Calculate overall faction sentiment
  const totalSupport = factions.reduce((sum, f) => sum + (state.factionSupport[f.id] || f.baseSupport), 0);
  const avgSupport = totalSupport / factions.length;

  return (
    <GlassPanel className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
          <span>Demographics</span>
        </h3>
        <div className="text-right">
          <span className="text-white/60 text-xs">Avg. Support</span>
          <div className="text-white font-bold">{Math.round(avgSupport)}%</div>
        </div>
      </div>

      <div className="space-y-2">
        {sortedFactions.map((faction, index) => (
          <FactionBar
            key={faction.id}
            faction={faction}
            support={state.factionSupport[faction.id] || faction.baseSupport}
            index={index}
          />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-xs text-white/50 text-center">
          Different groups respond differently to your actions. Tech workers hate bot armies,
          rural voters love rallies, and moderates appreciate legal protection.
        </p>
      </div>
    </GlassPanel>
  );
};

export default FactionPanel;
