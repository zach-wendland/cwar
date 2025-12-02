// TutorialOverlay.tsx - Interactive tutorial system with progressive disclosure
import React, { useEffect } from 'react';
import { useGameContext } from '../game/GameContext';
import './TutorialOverlay.css';

const TutorialOverlay: React.FC = () => {
  const { state, dispatch } = useGameContext();
  const { tutorial } = state;

  if (!tutorial.active || tutorial.skipped) {
    return null;
  }

  const currentStage = tutorial.stages[tutorial.currentStage];
  const progress = ((tutorial.currentStage / (tutorial.stages.length - 1)) * 100).toFixed(0);
  const isFirstStage = tutorial.currentStage === 0;
  const isLastStage = tutorial.currentStage === tutorial.stages.length - 1;

  const handleNext = () => {
    dispatch({ type: 'NEXT_TUTORIAL_STAGE' });

    // If it's the last stage, close tutorial after showing completion
    if (isLastStage) {
      setTimeout(() => {
        dispatch({ type: 'SKIP_TUTORIAL' });
      }, 3000);
    }
  };

  const handleSkip = () => {
    if (window.confirm('Are you sure you want to skip the tutorial? You can restart the game to see it again.')) {
      dispatch({ type: 'SKIP_TUTORIAL' });
    }
  };

  // Auto-detect tutorial progression based on game state
  useEffect(() => {
    if (!tutorial.active || currentStage.completed) return;

    const stageId = currentStage.id;

    // Auto-complete certain stages based on game state
    switch (stageId) {
      case 'first_action':
        if (state.turn > 0) {
          dispatch({ type: 'COMPLETE_TUTORIAL_STAGE', stageId });
        }
        break;
      case 'advisor_abilities':
        // Check if any advisor ability was used (cooldown > 0)
        if (state.advisors.some(a => a.ability && a.ability.currentCooldown > 0)) {
          dispatch({ type: 'COMPLETE_TUTORIAL_STAGE', stageId });
        }
        break;
      case 'events':
        // Completed when an event is resolved
        if (state.turn > 1 && !state.pendingEvent) {
          dispatch({ type: 'COMPLETE_TUTORIAL_STAGE', stageId });
        }
        break;
    }
  }, [state, currentStage, tutorial.active, dispatch]);

  return (
    <>
      {/* Dimmed overlay */}
      <div className="tutorial-backdrop" />

      {/* Tutorial panel */}
      <div className="tutorial-panel">
        <div className="tutorial-header">
          <div className="tutorial-title">
            <span className="tutorial-icon">📚</span>
            <span>Tutorial</span>
            <span className="tutorial-progress">
              Stage {tutorial.currentStage + 1} of {tutorial.stages.length}
            </span>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary tutorial-skip-btn"
            onClick={handleSkip}
            title="Skip tutorial"
          >
            Skip
          </button>
        </div>

        <div className="tutorial-progress-bar">
          <div className="tutorial-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="tutorial-content">
          <h3>{currentStage.title}</h3>
          <p className="tutorial-description">{currentStage.description}</p>
          <div className="tutorial-objective">
            <strong>Objective:</strong> {currentStage.objective}
          </div>
        </div>

        <div className="tutorial-footer">
          <div className="tutorial-hint">
            {currentStage.highlight && (
              <span className="text-muted small">
                💡 Look for the highlighted {currentStage.highlight} section
              </span>
            )}
          </div>
          <button
            className="btn btn-primary tutorial-next-btn"
            onClick={handleNext}
            disabled={!isFirstStage && currentStage.id !== 'welcome' &&
                     currentStage.id !== 'ui_overview' && currentStage.id !== 'resources' &&
                     currentStage.id !== 'advisors' && currentStage.id !== 'regional_strategy' &&
                     currentStage.id !== 'achievements' && currentStage.id !== 'opposition' &&
                     currentStage.id !== 'victory_conditions' && !currentStage.completed}
          >
            {isLastStage ? 'Finish Tutorial' : 'Next'}
          </button>
        </div>
      </div>

      {/* Highlight specific UI elements */}
      {currentStage.highlight && (
        <div className={`tutorial-highlight tutorial-highlight-${currentStage.highlight}`} />
      )}
    </>
  );
};

export default TutorialOverlay;
