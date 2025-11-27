// AdvisorsPanel.tsx - displays the roster of advisor NPCs
import React from 'react';
import { useGameContext } from '../game/GameContext';

const AdvisorsPanel: React.FC = () => {
  const { state } = useGameContext();
  const advisors = state.advisors;
  return (
    <div>
      <h5>Advisors</h5>
      {advisors.map((adv, idx) => (
        <div key={idx} className="card mb-2 p-2">
          <strong>{adv.name}</strong> – {adv.role} <br />
          <em>{adv.traits}</em>
          <ul className="mb-1 mt-1">
            {adv.quotes.map((q, qi) => (
              <li key={qi} className="text-muted">"{q}"</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default AdvisorsPanel;
