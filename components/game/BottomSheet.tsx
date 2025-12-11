"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ChevronUp, GripHorizontal, X } from "lucide-react";

interface BottomSheetProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  peekHeight?: number;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  peekHeight = 56,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const dragControls = useDragControls();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sheet */}
      <motion.div
        className="relative bg-gradient-to-t from-slate-900 via-slate-900/98 to-slate-900/95 border-t border-cyan-500/30 rounded-t-2xl"
        initial={false}
        animate={{
          height: isOpen ? "70vh" : peekHeight,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y > 50) {
            setIsOpen(false);
          } else if (info.offset.y < -50) {
            setIsOpen(true);
          }
        }}
      >
        {/* Handle */}
        <div
          className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pb-3 border-b border-white/10 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp size={20} className="text-white/50" />
          </motion.div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="overflow-y-auto px-4 py-3"
              style={{ maxHeight: "calc(70vh - 80px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed preview */}
        {!isOpen && (
          <div className="px-4 py-1 text-xs text-white/40 truncate">
            Tap to expand
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BottomSheet;
