// useScreenShake.ts - Hook for screen shake effects on critical moments

import { useState, useCallback, useRef, useEffect } from 'react';

interface ShakeConfig {
  intensity: number;  // How far to shake (pixels)
  duration: number;   // How long to shake (ms)
  decay: number;      // How quickly shake diminishes (0-1)
}

interface UseScreenShakeReturn {
  shakeStyle: React.CSSProperties;
  triggerShake: (config?: Partial<ShakeConfig>) => void;
  isShaking: boolean;
}

const defaultConfig: ShakeConfig = {
  intensity: 10,
  duration: 500,
  decay: 0.9,
};

export const useScreenShake = (): UseScreenShakeReturn => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const configRef = useRef<ShakeConfig>(defaultConfig);

  const shake = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const { intensity, duration, decay } = configRef.current;

    if (elapsed >= duration) {
      setOffset({ x: 0, y: 0 });
      setIsShaking(false);
      startTimeRef.current = 0;
      return;
    }

    // Calculate remaining intensity based on decay
    const progress = elapsed / duration;
    const currentIntensity = intensity * Math.pow(decay, progress * 10);

    // Random shake in all directions
    const x = (Math.random() - 0.5) * 2 * currentIntensity;
    const y = (Math.random() - 0.5) * 2 * currentIntensity;

    setOffset({ x, y });
    animationRef.current = requestAnimationFrame(shake);
  }, []);

  const triggerShake = useCallback((config?: Partial<ShakeConfig>) => {
    configRef.current = { ...defaultConfig, ...config };
    setIsShaking(true);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(shake);
  }, [shake]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const shakeStyle: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  return { shakeStyle, triggerShake, isShaking };
};

export default useScreenShake;
