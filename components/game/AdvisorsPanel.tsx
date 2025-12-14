import React from 'react';
import { motion } from 'framer-motion';
import { Users, Quote, Sparkles, Phone, Clock } from 'lucide-react';
import { useGameContext } from '../../lib/game/GameContext';
import { getAdvisorAbility } from '../../lib/game/advisorAbilities';
import GlassPanel from './GlassPanel';

const AdvisorsPanel: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const advisors = state.advisors;

  const handleConsult = (advisorName: string) => {
    dispatch({ type: 'CONSULT_ADVISOR', advisorName });
  };

  return (
    <GlassPanel title="Advisors" icon={Users} glowColor="purple">
      <div className="advisors-grid">
        {advisors.map((adv, idx) => {
          const ability = getAdvisorAbility(adv.name);
          const cooldown = state.advisorCooldowns[adv.name] || 0;
          const isConsulted = state.consultedAdvisor === adv.name;
          const canConsult = cooldown === 0 && !state.consultedAdvisor && !state.pendingEvent;

          return (
            <motion.div
              key={idx}
              className={`advisor-card ${isConsulted ? 'ring-2 ring-cyan-400' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="advisor-header">
                <div className={`advisor-avatar ${isConsulted ? 'bg-cyan-500' : ''}`}>
                  {adv.name.charAt(0)}
                </div>
                <div className="advisor-info">
                  <strong className="advisor-name">{adv.name}</strong>
                  <span className="advisor-role">{adv.role}</span>
                </div>
              </div>

              {/* Active Consultation Indicator */}
              {isConsulted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-cyan-500/20 border border-cyan-400/50 rounded-lg p-2 mb-2"
                >
                  <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium">
                    <Phone size={14} className="animate-pulse" />
                    Active - Next action +25%
                  </div>
                </motion.div>
              )}

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

              {/* Consult Button */}
              <div className="mt-2 pt-2 border-t border-white/10">
                {cooldown > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                    <Clock size={12} />
                    <span>Available in {cooldown} turn{cooldown > 1 ? 's' : ''}</span>
                  </div>
                ) : isConsulted ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 py-1">
                    <Phone size={12} className="animate-pulse" />
                    <span>On the line...</span>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => handleConsult(adv.name)}
                    disabled={!canConsult}
                    className={`w-full py-1.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      canConsult
                        ? 'bg-purple-600/50 hover:bg-purple-500/60 text-purple-100 border border-purple-400/30'
                        : 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                    }`}
                    whileHover={canConsult ? { scale: 1.02 } : {}}
                    whileTap={canConsult ? { scale: 0.98 } : {}}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Phone size={14} />
                      Consult
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export default AdvisorsPanel;
