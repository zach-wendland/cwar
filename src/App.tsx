// App.tsx - main application layout and logic integration
import React from 'react';
import { useGameContext } from './game/GameContext';
import MapView from './components/MapView';
import EventFeed from './components/EventFeed';
import ActionPanel from './components/ActionPanel';
import AdvisorsPanel from './components/AdvisorsPanel';
import IntroTutorial from './components/IntroTutorial';
import TutorialOverlay from './components/TutorialOverlay';

const App: React.FC = () => {
  const { state, dispatch } = useGameContext();

  // If there's a pending event (awaiting player choice), prepare to display it
  const pendingEvent = state.pendingEvent;
  const handleEventChoice = (choiceIndex: number) => {
    dispatch({ type: 'RESOLVE_EVENT', optionIndex: choiceIndex });
  };
  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="container-fluid py-3">
      <TutorialOverlay />
      <IntroTutorial />
      <div className="row">
        {/* Left column: Map view */}
        <div className="col-md-4 mb-3">
          <MapView />
        </div>
        {/* Center column: Event feed and stats */}
        <div className="col-md-4 mb-3">
          <EventFeed />
        </div>
        {/* Right column: Actions and Advisors */}
        <div className="col-md-4 mb-3">
          <ActionPanel />
          <AdvisorsPanel />
        </div>
      </div>

      {/* Overlay modal for a pending event (decision prompt) */}
      {pendingEvent && (
        <div className="event-modal">
          <div className="event-content p-3">
            <h4>{pendingEvent.title}</h4>
            <p>{pendingEvent.description}</p>
            {pendingEvent.options && pendingEvent.options.map((opt, idx) => (
              <button key={idx}
                      className="btn btn-secondary btn-sm d-block w-100 text-start mb-2"
                      onClick={() => handleEventChoice(idx)}>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Over / Victory overlay */}
      {(state.victory || state.gameOver) && !pendingEvent && (
        <div className="event-modal">
          <div className="event-content p-3 text-center">
            {state.victory && <h3>Victory! 🎉 You have dominated the culture!</h3>}
            {state.gameOver && <h3>Game Over! 😢 Your movement has been neutralized.</h3>}
            <button className="btn btn-primary mt-3" onClick={handleReset}>
              Restart Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
