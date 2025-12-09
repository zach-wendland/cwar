import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'purple';
  showLabel?: boolean;
  label?: string;
}

const colorMap = {
  cyan: 'var(--color-accent-cyan)',
  green: 'var(--color-accent-green)',
  yellow: 'var(--color-accent-yellow)',
  red: 'var(--color-accent-red)',
  purple: 'var(--color-accent-purple)',
};

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = 'cyan',
  showLabel = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${colorMap[color]})` }}
        />
      </svg>
      {showLabel && (
        <div className="progress-ring-label">
          <span className="progress-ring-value" style={{ color: colorMap[color] }}>
            {Math.round(progress)}%
          </span>
          {label && <span className="progress-ring-text">{label}</span>}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
