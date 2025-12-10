import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { USAMap, USAStateAbbreviation } from '@mirawision/usa-map-react';
import { Map, TrendingUp, TrendingDown, Target, X } from 'lucide-react';
import { useGameContext } from '../../lib/game/GameContext';
import GlassPanel from './GlassPanel';
import { regions, getStateRegion, getAllRegionSupport, getWeakestStates, SWING_STATES } from '../../lib/game/regions';

// Color gradient for support levels
function getStateColor(support: number): string {
  if (support >= 80) return '#059669'; // emerald-600 - victory level
  if (support >= 60) return '#10b981'; // emerald-500
  if (support >= 40) return '#34d399'; // emerald-400
  if (support >= 20) return '#6ee7b7'; // emerald-300
  if (support >= 10) return '#a7f3d0'; // emerald-200
  return '#d1d5db'; // gray-300
}

interface MapViewProps {
  onStateSelect?: (stateCode: string | null) => void;
  selectedState?: string | null;
}

const MapView: React.FC<MapViewProps> = ({ onStateSelect, selectedState: externalSelectedState }) => {
  const { state } = useGameContext();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [changedStates, setChangedStates] = useState<Set<string>>(new Set());
  const [selectedState, setSelectedState] = useState<string | null>(externalSelectedState || null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showRegions, setShowRegions] = useState(false);
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

  // Handle state selection
  const handleStateClick = (code: string) => {
    if (selectedState === code) {
      setSelectedState(null);
      onStateSelect?.(null);
    } else {
      setSelectedState(code);
      setSelectedRegion(null);
      onStateSelect?.(code);
    }
  };

  // Handle region selection
  const handleRegionClick = (regionId: string) => {
    if (selectedRegion === regionId) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(regionId);
      setSelectedState(null);
      onStateSelect?.(null);
    }
  };

  // Get region support averages
  const regionSupport = getAllRegionSupport(state.support);

  // Get weakest states
  const weakestStates = getWeakestStates(state.support, 5);

  // Build custom states configuration
  const customStates: Record<string, {
    fill: string;
    onClick?: () => void;
    onHover?: () => void;
    onLeave?: () => void;
  }> = {};

  for (const code in state.support) {
    const stateRegion = getStateRegion(code);
    const isInSelectedRegion = selectedRegion && stateRegion?.id === selectedRegion;
    const isSelected = selectedState === code;
    const isSwingState = SWING_STATES.includes(code);

    // Determine fill color based on selection and support
    let fill = getStateColor(state.support[code]);
    if (isSelected) {
      fill = '#f59e0b'; // amber highlight for selected
    } else if (isInSelectedRegion) {
      fill = stateRegion?.color || fill; // region color
    }

    customStates[code] = {
      fill,
      onClick: () => handleStateClick(code),
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

        {/* Selection Info */}
        <AnimatePresence>
          {(selectedState || selectedRegion) && (
            <motion.div
              className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-2 mb-2 flex items-center justify-between"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2">
                <Target size={14} className="text-amber-400" />
                <span className="text-sm text-amber-400">
                  {selectedState
                    ? `${selectedState}: ${state.support[selectedState]}% support`
                    : `${regions.find(r => r.id === selectedRegion)?.name}: ${regionSupport[selectedRegion!]}% avg`}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedState(null);
                  setSelectedRegion(null);
                  onStateSelect?.(null);
                }}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Region Selector */}
        <div className="mb-3">
          <button
            onClick={() => setShowRegions(!showRegions)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <Map size={12} />
            {showRegions ? 'Hide' : 'Show'} Regions
          </button>

          <AnimatePresence>
            {showRegions && (
              <motion.div
                className="mt-2 flex flex-wrap gap-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {regions.map(region => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionClick(region.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedRegion === region.id
                        ? 'bg-white/20 border border-white/40'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    style={{
                      borderColor: selectedRegion === region.id ? region.color : undefined,
                      color: selectedRegion === region.id ? region.color : 'rgba(255,255,255,0.7)'
                    }}
                  >
                    {region.name} ({regionSupport[region.id]}%)
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Average Support Display */}
        <div className="map-stats mt-3">
          <div className={`avg-support-badge ${avgSupport >= 80 ? 'victory' : ''}`}>
            <span className="label">Avg Support:</span>
            <span className="value">{avgSupport}%</span>
            {avgSupport >= 80 && <span className="victory-indicator">🏆</span>}
          </div>
        </div>

        {/* Weakest States */}
        <div className="mt-2 text-xs text-white/50">
          <span className="text-white/70">Needs attention: </span>
          {weakestStates.map((code, i) => (
            <span key={code}>
              <button
                onClick={() => handleStateClick(code)}
                className="text-red-400 hover:text-red-300"
              >
                {code} ({state.support[code]}%)
              </button>
              {i < weakestStates.length - 1 && ', '}
            </span>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
};

export default MapView;
