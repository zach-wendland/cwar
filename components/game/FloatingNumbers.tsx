import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingNumber {
  id: string;
  value: number;
  type: 'clout' | 'funds' | 'risk' | 'support';
  x?: number;
  y?: number;
}

interface FloatingNumbersProps {
  numbers: FloatingNumber[];
  onComplete: (id: string) => void;
}

const typeConfig = {
  clout: { color: '#f59e0b', icon: '💪', prefix: '' },      // amber
  funds: { color: '#22c55e', icon: '$', prefix: '$' },      // green
  risk: { color: '#ef4444', icon: '⚠️', prefix: '' },       // red
  support: { color: '#3b82f6', icon: '📊', prefix: '' },    // blue
};

const FloatingNumber: React.FC<{
  data: FloatingNumber;
  onComplete: () => void;
}> = ({ data, onComplete }) => {
  const config = typeConfig[data.type];
  const isPositive = data.value > 0;
  const displayValue = isPositive ? `+${data.value}` : `${data.value}`;

  return (
    <motion.div
      className="fixed pointer-events-none z-50 font-bold text-lg"
      style={{
        left: data.x || '50%',
        top: data.y || '50%',
        color: config.color,
        textShadow: `0 0 10px ${config.color}80`,
      }}
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{
        opacity: 0,
        y: -60,
        scale: 1.2,
      }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    >
      {config.prefix}{displayValue}
      {data.type === 'support' && '%'}
    </motion.div>
  );
};

export const FloatingNumbers: React.FC<FloatingNumbersProps> = ({
  numbers,
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {numbers.map(num => (
        <FloatingNumber
          key={num.id}
          data={num}
          onComplete={() => onComplete(num.id)}
        />
      ))}
    </AnimatePresence>
  );
};

// Hook to manage floating numbers
export const useFloatingNumbers = () => {
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);
  const idCounter = useRef(0);

  const addNumber = useCallback((
    value: number,
    type: FloatingNumber['type'],
    position?: { x: number; y: number }
  ) => {
    if (value === 0) return;

    const id = `float-${idCounter.current++}`;
    const newNumber: FloatingNumber = {
      id,
      value,
      type,
      x: position?.x || window.innerWidth / 2,
      y: position?.y || window.innerHeight / 3,
    };

    setNumbers(prev => [...prev, newNumber]);
  }, []);

  const removeNumber = useCallback((id: string) => {
    setNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  return { numbers, addNumber, removeNumber };
};

export default FloatingNumbers;
