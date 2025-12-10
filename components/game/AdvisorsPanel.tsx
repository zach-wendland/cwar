import React from 'react';
import { motion } from 'framer-motion';
import { Users, Quote, Sparkles } from 'lucide-react';
import { useGameContext } from '../../lib/game/GameContext';
import { getAdvisorAbility } from '../../lib/game/advisorAbilities';
import GlassPanel from './GlassPanel';

const AdvisorsPanel: React.FC = () => {
  const { state } = useGameContext();
  const advisors = state.advisors;

  return (
    <GlassPanel title="Advisors" icon={Users} glowColor="purple">
      <div className="advisors-grid">
        {advisors.map((adv, idx) => {
          const ability = getAdvisorAbility(adv.name);
          return (
            <motion.div
              key={idx}
              className="advisor-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="advisor-header">
                <div className="advisor-avatar">
                  {adv.name.charAt(0)}
                </div>
                <div className="advisor-info">
                  <strong className="advisor-name">{adv.name}</strong>
                  <span className="advisor-role">{adv.role}</span>
                </div>
              </div>

              {/* Advisor Ability */}
              {ability && (
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{ability.icon}</span>
                    <span className="text-purple-300 font-medium text-sm">{ability.name}</span>
                    <Sparkles size={12} className="text-purple-400" />
                  </div>
                  <p className="text-xs text-white/60">{ability.description}</p>
                </div>
              )}

              <div className="advisor-traits">
                {adv.traits}
              </div>
              <div className="advisor-quotes">
                {adv.quotes.slice(0, 1).map((q, qi) => (
                  <div key={qi} className="advisor-quote">
                    <Quote size={12} className="quote-icon" />
                    <span>"{q}"</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export default AdvisorsPanel;
