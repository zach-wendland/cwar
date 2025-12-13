import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  velocity: { x: number; y: number };
  rotation: number;
  scale: number;
}

interface ParticleSystemProps {
  particles: Particle[];
}

// Pre-defined particle effects
export type ParticleEffect = 'victory' | 'critical' | 'streak' | 'support' | 'funds';

const effectConfig: Record<ParticleEffect, {
  emojis: string[];
  count: number;
  spread: number;
  gravity: number;
}> = {
  victory: {
    emojis: ['🎉', '🏆', '⭐', '👑', '🎊', '✨'],
    count: 30,
    spread: 300,
    gravity: 0.3,
  },
  critical: {
    emojis: ['⚡', '💥', '🔥', '✨'],
    count: 15,
    spread: 150,
    gravity: 0.5,
  },
  streak: {
    emojis: ['🔥', '💨', '⚡'],
    count: 10,
    spread: 100,
    gravity: 0.4,
  },
  support: {
    emojis: ['💙', '💪', '📈', '✨'],
    count: 8,
    spread: 80,
    gravity: 0.3,
  },
  funds: {
    emojis: ['💵', '💰', '💲', '🪙'],
    count: 12,
    spread: 120,
    gravity: 0.4,
  },
};

const ParticleComponent: React.FC<{ particle: Particle }> = ({ particle }) => {
  return (
    <motion.div
      className="fixed pointer-events-none z-50 text-2xl"
      style={{ left: particle.x, top: particle.y }}
      initial={{
        opacity: 1,
        scale: particle.scale,
        rotate: 0,
      }}
      animate={{
        opacity: 0,
        y: particle.velocity.y * 100 + 200,
        x: particle.velocity.x * 100,
        rotate: particle.rotation,
        scale: particle.scale * 0.5,
      }}
      transition={{
        duration: 2,
        ease: 'easeOut',
      }}
    >
      {particle.emoji}
    </motion.div>
  );
};

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ particles }) => {
  return (
    <AnimatePresence>
      {particles.map(p => (
        <ParticleComponent key={p.id} particle={p} />
      ))}
    </AnimatePresence>
  );
};

// Hook to manage particle system
export const useParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idCounter = useRef(0);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up particles after animation with proper memory management
  useEffect(() => {
    if (particles.length === 0) return;

    // Clear any existing timer to prevent memory leaks
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
    }

    cleanupTimerRef.current = setTimeout(() => {
      setParticles([]);
      cleanupTimerRef.current = null;
    }, 2500);

    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, [particles]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      // Clear particles on unmount
      setParticles([]);
    };
  }, []);

  const emit = useCallback((
    effect: ParticleEffect,
    origin?: { x: number; y: number }
  ) => {
    const config = effectConfig[effect];
    const centerX = origin?.x || window.innerWidth / 2;
    const centerY = origin?.y || window.innerHeight / 3;

    const newParticles: Particle[] = [];

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5;
      const speed = 0.5 + Math.random() * 1.5;

      newParticles.push({
        id: `particle-${idCounter.current++}`,
        x: centerX + (Math.random() - 0.5) * 50,
        y: centerY + (Math.random() - 0.5) * 50,
        emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
        velocity: {
          x: Math.cos(angle) * speed * (config.spread / 100),
          y: Math.sin(angle) * speed * (config.spread / 100) - config.gravity,
        },
        rotation: (Math.random() - 0.5) * 720,
        scale: 0.5 + Math.random() * 0.5,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const clear = useCallback(() => {
    setParticles([]);
  }, []);

  return { particles, emit, clear };
};

export default ParticleSystem;
