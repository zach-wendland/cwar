import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { USAMap, USAStateAbbreviation } from '@mirawision/usa-map-react';
import { Map, TrendingUp, TrendingDown } from 'lucide-react';
import { useGameContext } from '../game/GameContext';
import GlassPanel from './modern/GlassPanel';

// Color gradient for support levels
function getStateColor(support: number): string {
  if (support >= 80) return '#059669'; // emerald-600 - victory level
  if (support >= 60) return '#10b981'; // emerald-500
  if (support >= 40) return '#34d399'; // emerald-400
  if (support >= 20) return '#6ee7b7'; // emerald-300
  if (support >= 10) return '#a7f3d0'; // emerald-200
  return '#d1d5db'; // gray-300
}

const MapView: React.FC = () => {
  const { state } = useGameContext();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [changedStates, setChangedStates] = useState<Set<string>>(new Set());
  const prevSupport = useRef<{ [key: string]: number }>({});

  // Track support changes for pulse animation
  useEffect(() => {
    const changed = new Set<string>();
    for (const code in state.support) {
      if (prevSupport.current[code] !== undefined &&
          prevSupport.current[code] !== state.support[code]) {
        changed.add(code);
      }
    }
    if (changed.size > 0) {
      setChangedStates(changed);
      const timer = setTimeout(() => setChangedStates(new Set()), 1000);
      return () => clearTimeout(timer);
    }
    prevSupport.current = { ...state.support };
  }, [state.support]);

  // Calculate average support
  const avgSupport = Math.round(
    Object.values(state.support).reduce((a, b) => a + b, 0) / Object.keys(state.support).length
  );

  // Build custom states configuration
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
        console.log('Clicked on state:', code, 'Support:', state.support[code]);
      },
      onHover: () => setHoveredState(code),
      onLeave: () => setHoveredState(null),
    };
  }

  // Get trend for hovered state
  const getTrend = (code: string) => {
    const prev = prevSupport.current[code];
    const current = state.support[code];
    if (prev === undefined) return null;
    if (current > prev) return 'up';
    if (current < prev) return 'down';
    return null;
  };

  return (
    <GlassPanel title="Support Map" icon={Map} glowColor="green">
      <div className="map-container relative">
        {/* Map Legend */}
        <div className="map-legend mb-3">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#d1d5db' }}></span>
            <span className="legend-label">&lt;10%</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#6ee7b7' }}></span>
            <span className="legend-label">20%+</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#34d399' }}></span>
            <span className="legend-label">40%+</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#10b981' }}></span>
            <span className="legend-label">60%+</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#059669' }}></span>
            <span className="legend-label">80%+</span>
          </div>
        </div>

        {/* USA Map */}
        <div className="usa-map-wrapper">
          <USAMap customStates={customStates} />
        </div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredState && (
            <motion.div
              className="map-tooltip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="tooltip-header">
                <strong>{hoveredState}</strong>
                {getTrend(hoveredState) === 'up' && <TrendingUp size={14} className="text-green-400" />}
                {getTrend(hoveredState) === 'down' && <TrendingDown size={14} className="text-red-400" />}
              </div>
              <div className="tooltip-value">
                {state.support[hoveredState]}% support
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Average Support Display */}
        <div className="map-stats mt-3">
          <div className={`avg-support-badge ${avgSupport >= 80 ? 'victory' : ''}`}>
            <span className="label">Avg Support:</span>
            <span className="value">{avgSupport}%</span>
            {avgSupport >= 80 && <span className="victory-indicator">🏆</span>}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default MapView;
