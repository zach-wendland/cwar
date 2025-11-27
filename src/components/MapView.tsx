// MapView.tsx - component for the U.S. map visualization of state support
import React, { useState, useEffect } from 'react';
import USAMap from 'react-usa-map';  // USA map component (SVG map)
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

  // Custom configuration for state fills (color by support level)
  const statesCustomConfig = () => {
    const config: { [stateCode: string]: { fill: string } } = {};
    for (const code in state.support) {
      config[code] = { fill: getStateColor(state.support[code]) };
    }
    return config;
  };

  // Attach hover event handlers to state elements (since library lacks onMouseEnter prop)
  useEffect(() => {
    const handleMouseEnter = (e: any) => {
      const stateCode = e.target.getAttribute('data-name');
      if (stateCode) setHoveredState(stateCode);
    };
    const handleMouseLeave = () => setHoveredState(null);
    // Select all state <path> elements by class and add event listeners
    const svgStates = document.querySelectorAll('svg .state');
    svgStates.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });
    // Cleanup on unmount
    return () => {
      svgStates.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [state.turn]);  // re-run if the map re-renders on state change

  // Handle state click (for future features like targeting a region)
  const mapHandler = (event: any) => {
    const stateCode = event.target.dataset.name;
    console.log('Clicked on state:', stateCode);
    // (In a future update, clicking could select a target state for certain actions)
  };

  return (
    <div>
      {/* Render the interactive US map with custom fills per state */}
      <USAMap customize={statesCustomConfig()} onClick={mapHandler} />
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
