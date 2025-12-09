import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface GlassPanelProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
  animate?: boolean;
  glowColor?: 'cyan' | 'purple' | 'green' | 'red' | 'yellow';
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  title,
  icon: Icon,
  className = '',
  animate = true,
  glowColor = 'cyan',
}) => {
  const content = (
    <>
      {title && (
        <div className="section-header">
          {Icon && <Icon className="w-5 h-5 section-header__icon" />}
          <h5>{title}</h5>
        </div>
      )}
      {children}
    </>
  );

  if (animate) {
    return (
      <motion.div
        className={`glass-panel ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={`glass-panel ${className}`}>{content}</div>;
};

export default GlassPanel;
