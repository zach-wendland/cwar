import React, { useEffect, useMemo, useState } from 'react';
import { useGameContext } from '../game/GameContext';

const EventResolutionOverlays: React.FC = () => {
  const { state } = useGameContext();
  const meta = state.resolutionMeta;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!meta) return undefined;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 5500);
    return () => clearTimeout(timeout);
  }, [meta]);

  useEffect(() => {
    if (!meta || typeof window === 'undefined') return undefined;
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as
      | AudioContextConstructor
      | undefined;
    if (!AudioCtx) return undefined;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = meta.tone === 'positive' ? 720 : meta.tone === 'risky' ? 320 : 520;
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.27);
    const cleanup = setTimeout(() => ctx.close(), 350);
    return () => {
      clearTimeout(cleanup);
      ctx.close();
    };
  }, [meta]);

  const confettiPieces = useMemo(() => new Array(14).fill(null).map((_, idx) => idx), []);

  if (!meta) return null;

  return (
    <div className="resolution-overlay">
      <div
        className={`resolution-toast ${meta.tone || 'neutral'} ${visible ? 'show' : ''}`}
        aria-live="polite"
      >
        <div className="d-flex align-items-start justify-content-between">
          <div>
            <div className="small text-uppercase fw-bold">{meta.rewardTier} tier resolution</div>
            <div className="fw-semibold">{meta.eventTitle}</div>
            {meta.optionText && <div className="text-muted small">Chose: {meta.optionText}</div>}
          </div>
          <div className="ms-3 tone-pill">
            {meta.tone === 'positive' ? '🎉' : meta.tone === 'risky' ? '⚠️' : '✨'}
          </div>
        </div>
        {meta.message && <div className="mt-2 small">{meta.message}</div>}
        <div className="mt-2 stats-row">
          {meta.cloutDelta !== undefined && (
            <span className="stat-chip">Clout Δ: {meta.cloutDelta >= 0 ? '+' : ''}{meta.cloutDelta}</span>
          )}
          {meta.riskDelta !== undefined && (
            <span className="stat-chip">Risk Δ: {meta.riskDelta >= 0 ? '+' : ''}{meta.riskDelta}</span>
          )}
        </div>
        {meta.appliedBuff && (
          <div className="buff-chip mt-2">
            {meta.appliedBuff.type === 'cloutMultiplier' ? '🚀' : '🛡️'} {meta.appliedBuff.label} active (until Turn {meta.appliedBuff.expiresTurn})
          </div>
        )}
      </div>

      {meta.rewardTier === 'high' && (
        <div className="confetti-wrapper" aria-hidden="true">
          {confettiPieces.map(piece => (
            <span key={piece} className={`confetti-piece tone-${meta.tone || 'neutral'} seed-${piece % 5}`}>★</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventResolutionOverlays;
