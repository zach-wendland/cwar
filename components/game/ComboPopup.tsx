"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { ComboResult } from "@/lib/game/comboEngine";

interface ComboPopupProps {
  combo: ComboResult;
}

const ComboPopup: React.FC<ComboPopupProps> = ({ combo }) => {
  const isJackpot = combo.isJackpot;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none`}
    >
      <motion.div
        className={`px-6 py-4 rounded-2xl backdrop-blur-md ${
          isJackpot
            ? "bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-400/50"
            : "bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border-2 border-purple-400/50"
        }`}
        animate={{
          boxShadow: isJackpot
            ? [
                "0 0 20px rgba(245, 158, 11, 0.3)",
                "0 0 40px rgba(245, 158, 11, 0.5)",
                "0 0 20px rgba(245, 158, 11, 0.3)",
              ]
            : [
                "0 0 20px rgba(147, 51, 234, 0.3)",
                "0 0 30px rgba(147, 51, 234, 0.4)",
                "0 0 20px rgba(147, 51, 234, 0.3)",
              ],
        }}
        transition={{ duration: 0.5, repeat: 2 }}
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.3, repeat: 3 }}
        >
          {isJackpot ? (
            <Sparkles size={32} className="text-amber-400" />
          ) : (
            <Zap size={32} className="text-purple-400" />
          )}
        </motion.div>

        {/* Combo name */}
        <motion.h3
          className={`text-xl font-bold text-center ${
            isJackpot ? "text-amber-400" : "text-purple-400"
          }`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.2, repeat: 2 }}
        >
          {combo.comboName || "COMBO!"}
        </motion.h3>

        {/* Multiplier */}
        <motion.div
          className="text-3xl font-black text-center text-white mt-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          {combo.multiplier}x
        </motion.div>

        {/* Matched tags */}
        {combo.matchedTags.length > 0 && (
          <div className="flex justify-center gap-1 mt-2">
            {combo.matchedTags.map((tag, idx) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`text-xs px-2 py-0.5 rounded ${
                  isJackpot ? "bg-amber-500/30 text-amber-200" : "bg-purple-500/30 text-purple-200"
                }`}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}

        {/* Jackpot celebration particles */}
        {isJackpot && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-400"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i * Math.PI) / 4) * 60,
                  y: Math.sin((i * Math.PI) / 4) * 60,
                  opacity: 0,
                }}
                transition={{ duration: 0.6, delay: 0.1 }}
              />
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ComboPopup;
