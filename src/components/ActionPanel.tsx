// ActionPanel.tsx - lists available actions for the player to perform
import React from 'react';
import { useGameContext } from '../game/GameContext';
import { actionsConfig } from '../game/actions';

const ActionPanel: React.FC = () => {
  const { state, dispatch } = useGameContext();

  const handleActionClick = (actionId: string) => {
    dispatch({ type: 'PERFORM_ACTION', actionId });
  };

  return (
    <div>
      <h5>Actions</h5>
      {actionsConfig.map(action => {
        // Determine if the action button should be disabled (lack resources, pending event, or game ended)
        let disabled = false;
        if (action.cost) {
          if (action.cost.funds && state.funds < action.cost.funds) disabled = true;
          if (action.cost.clout && state.clout < action.cost.clout) disabled = true;
        }
        if (state.pendingEvent || state.victory || state.gameOver) {
          disabled = true;
        }
        return (
          <button
            key={action.id}
            className="btn btn-primary btn-sm d-block w-100 text-start mb-2"
            onClick={() => handleActionClick(action.id)}
            disabled={disabled}
          >
            <strong>{action.name}</strong> – {action.description}
            {/* Show cost in parentheses if any */}
            {action.cost && (action.cost.funds || action.cost.clout) && (
              <span className="text-light small">
                {" "}(
                {action.cost.funds ? `$${action.cost.funds} funds` : ""}
                {action.cost.funds && action.cost.clout ? ", " : ""}
                {action.cost.clout ? `${action.cost.clout} clout` : ""}
                )
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ActionPanel;
