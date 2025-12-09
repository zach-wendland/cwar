// MapView.tsx - component for the U.S. map visualization of state support
import React, { useState } from 'react';
import { USAMap, USAStateAbbreviation } from '@mirawision/usa-map-react';
import { useGameContext } from '../game/GameContext';

// Utility function to determine fill color based on support %
function getStateColor(support: number): string {
  if (support >= 80) return '#2d6a4f';     // dark green for very high support
  if (support >= 50) return '#52b788';     // medium green for moderate support
  if (support >= 20) return '#99d98c';     // light green for low support
  return '#ccc';                           // gray for very little support
}

const MapView: React.FC = () => {
  const { state } = useGameContext();
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Build custom states configuration for the map
  const customStates: Record<string, {
    fill: string;
    onClick?: () => void;
    onHover?: () => void;
    onLeave?: () => void;
  }> = {};

  for (const code in state.support) {
    customStates[code] = {
      fill: getStateColor(state.support[code]),
      onClick: () => {
        console.log('Clicked on state:', code);
        // (In a future update, clicking could select a target state for certain actions)
      },
      onHover: () => setHoveredState(code),
      onLeave: () => setHoveredState(null),
    };
  }

  return (
    <div>
      {/* Render the interactive US map with custom fills per state */}
      <USAMap customStates={customStates} />
      {/* If a state is hovered, display its support percentage */}
      {hoveredState && (
        <div className="mt-2 text-center">
          <strong>{hoveredState}:</strong> {state.support[hoveredState]}% support
        </div>
      )}
    </div>
  );
};

export default MapView;
