import React from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { useGameContext } from '../game/GameContext';
import { actionsConfig } from '../game/actions';
import GlassPanel from './modern/GlassPanel';
import ActionCard from './modern/ActionCard';

const ActionPanel: React.FC = () => {
  const { state, dispatch } = useGameContext();

  const handleActionClick = (actionId: string) => {
    dispatch({ type: 'PERFORM_ACTION', actionId });
  };

  return (
    <GlassPanel title="Actions" icon={Swords} className="mb-4" glowColor="cyan">
      <div className="actions-grid">
        {actionsConfig.map((action, idx) => {
          let disabled = false;
          if (action.cost) {
            if (action.cost.funds && state.funds < action.cost.funds) disabled = true;
            if (action.cost.clout && state.clout < action.cost.clout) disabled = true;
          }
          if (state.pendingEvent || state.victory || state.gameOver) {
            disabled = true;
          }

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <ActionCard
                id={action.id}
                name={action.name}
                description={action.description}
                cost={action.cost}
                disabled={disabled}
                onClick={() => handleActionClick(action.id)}
              />
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export default ActionPanel;
