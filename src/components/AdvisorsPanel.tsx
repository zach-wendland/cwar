// AdvisorsPanel.tsx - displays the roster of advisor NPCs
import React, { useState } from 'react';
import { useGameContext } from '../game/GameContext';

const AdvisorsPanel: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const [showHiring, setShowHiring] = useState(false);

  const handleUseAbility = (advisorId: string) => {
    dispatch({ type: 'USE_ADVISOR_ABILITY', advisorId });
  };

  const handleFireAdvisor = (advisorId: string) => {
    if (window.confirm('Are you sure you want to fire this advisor?')) {
      dispatch({ type: 'FIRE_ADVISOR', advisorId });
    }
  };

  const handleHireAdvisor = (advisorId: string) => {
    dispatch({ type: 'HIRE_ADVISOR', advisorId });
  };

  return (
    <div className="mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>Your Advisors ({state.advisors.length})</h5>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowHiring(!showHiring)}
        >
          {showHiring ? 'Hide' : 'Hire Advisor'}
        </button>
      </div>

      {/* Hired Advisors */}
      {state.advisors.map((adv) => (
        <div key={adv.id} className="card mb-2 p-2 bg-light">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <strong>{adv.name}</strong> – {adv.role}
              <div className="small text-muted">{adv.specialization}</div>
            </div>
            <button
              className="btn btn-sm btn-danger ms-2"
              onClick={() => handleFireAdvisor(adv.id)}
              title="Fire Advisor"
            >
              ✕
            </button>
          </div>

          {/* Stats bars */}
          <div className="mt-2">
            <div className="d-flex justify-content-between small">
              <span>Loyalty</span>
              <span>{adv.loyalty}%</span>
            </div>
            <div className="progress mb-1" style={{ height: '8px' }}>
              <div
                className={`progress-bar ${adv.loyalty > 70 ? 'bg-success' : adv.loyalty > 40 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${adv.loyalty}%` }}
              />
            </div>

            <div className="d-flex justify-content-between small">
              <span>Morale</span>
              <span>{adv.morale}%</span>
            </div>
            <div className="progress mb-1" style={{ height: '8px' }}>
              <div
                className={`progress-bar ${adv.morale > 70 ? 'bg-success' : adv.morale > 40 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${adv.morale}%` }}
              />
            </div>
          </div>

          {/* Bonuses */}
          {Object.keys(adv.bonuses).length > 0 && (
            <div className="mt-2 small">
              <strong>Bonuses:</strong>
              <ul className="mb-0 ps-3">
                {adv.bonuses.cloutBonus && <li>+{adv.bonuses.cloutBonus}% Clout</li>}
                {adv.bonuses.fundsBonus && <li>+{adv.bonuses.fundsBonus}% Funds</li>}
                {adv.bonuses.supportBonus && <li>+{adv.bonuses.supportBonus}% Support</li>}
                {adv.bonuses.riskReduction && <li>-{adv.bonuses.riskReduction}% Risk</li>}
              </ul>
            </div>
          )}

          {/* Ability */}
          {adv.ability && (
            <div className="mt-2">
              <button
                className="btn btn-sm btn-primary w-100"
                disabled={adv.ability.currentCooldown > 0 || adv.morale < 50}
                onClick={() => handleUseAbility(adv.id)}
              >
                {adv.ability.name}
                {adv.ability.currentCooldown > 0 && ` (${adv.ability.currentCooldown} turns)`}
                {adv.morale < 50 && ' (Low Morale)'}
              </button>
              <div className="small text-muted mt-1">{adv.ability.description}</div>
            </div>
          )}
        </div>
      ))}

      {/* Hiring Panel */}
      {showHiring && (
        <div className="card p-2 bg-info bg-opacity-10 mt-3">
          <h6>Available Advisors</h6>
          {state.availableAdvisors.length === 0 ? (
            <p className="text-muted small mb-0">No advisors available to hire</p>
          ) : (
            state.availableAdvisors.map((adv) => (
              <div key={adv.id} className="card mb-2 p-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <strong>{adv.name}</strong> – {adv.role}
                    <div className="small text-muted">{adv.traits}</div>
                    <div className="small mt-1">
                      <strong>Specialization:</strong> {adv.specialization}
                    </div>
                    {Object.keys(adv.bonuses).length > 0 && (
                      <div className="small">
                        <strong>Bonuses:</strong>{' '}
                        {adv.bonuses.cloutBonus && `+${adv.bonuses.cloutBonus}% Clout `}
                        {adv.bonuses.fundsBonus && `+${adv.bonuses.fundsBonus}% Funds `}
                        {adv.bonuses.supportBonus && `+${adv.bonuses.supportBonus}% Support `}
                        {adv.bonuses.riskReduction && `-${adv.bonuses.riskReduction}% Risk`}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-success mt-2 w-100"
                  onClick={() => handleHireAdvisor(adv.id)}
                  disabled={state.funds < adv.hireCost}
                >
                  Hire for ${adv.hireCost}k {state.funds < adv.hireCost && '(Not enough funds)'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdvisorsPanel;
