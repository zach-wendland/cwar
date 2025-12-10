import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Lock, Unlock, ChevronRight } from 'lucide-react';
import {
  PrestigeData,
  PrestigeUnlock,
  loadPrestigeData,
  purchaseUpgrade,
  prestigeUpgrades,
  getPrestigeTitle,
} from '../../lib/game/prestige';
import GlassPanel from './GlassPanel';

interface PrestigePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeCard: React.FC<{
  upgrade: PrestigeUnlock;
  unlocked: boolean;
  canAfford: boolean;
  onPurchase: () => void;
}> = ({ upgrade, unlocked, canAfford, onPurchase }) => {
  return (
    <motion.div
      className={`p-3 rounded-lg border transition-all ${
        unlocked
          ? 'bg-green-500/20 border-green-500/50'
          : canAfford
          ? 'bg-white/5 border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer'
          : 'bg-white/5 border-white/10 opacity-60'
      }`}
      whileHover={!unlocked && canAfford ? { scale: 1.02 } : {}}
      onClick={!unlocked && canAfford ? onPurchase : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{upgrade.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white">{upgrade.name}</h4>
            {unlocked ? (
              <Unlock size={16} className="text-green-400" />
            ) : (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400" />
                <span className={`text-sm ${canAfford ? 'text-yellow-400' : 'text-white/40'}`}>
                  {upgrade.cost}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/60 mt-1">{upgrade.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const PrestigePanel: React.FC<PrestigePanelProps> = ({ isOpen, onClose }) => {
  const [prestigeData, setPrestigeData] = useState<PrestigeData>(loadPrestigeData());
  const [selectedCategory, setSelectedCategory] = useState<string>('resources');

  useEffect(() => {
    setPrestigeData(loadPrestigeData());
  }, [isOpen]);

  const availablePoints = prestigeData.totalLegacyPoints - prestigeData.spentLegacyPoints;

  const handlePurchase = (upgradeId: string) => {
    const result = purchaseUpgrade(upgradeId, prestigeData);
    if (result) {
      setPrestigeData(result);
    }
  };

  const categories = [
    { id: 'resources', name: 'Starting Bonuses', ids: ['extra_clout_1', 'extra_clout_2', 'extra_funds_1', 'extra_funds_2', 'extra_support_1', 'extra_support_2'] },
    { id: 'actions', name: 'Action Upgrades', ids: ['cheaper_memes', 'cheaper_rallies', 'cheaper_influencer'] },
    { id: 'luck', name: 'Luck & Streaks', ids: ['lucky_1', 'lucky_2', 'streak_master'] },
    { id: 'risk', name: 'Risk Management', ids: ['risk_reducer_1', 'risk_reducer_2'] },
    { id: 'factions', name: 'Faction Relations', ids: ['tech_friend', 'rural_friend', 'youth_friend', 'moderate_friend', 'business_friend'] },
  ];

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const categoryUpgrades = prestigeUpgrades.filter(u => currentCategory?.ids.includes(u.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="text-yellow-400" size={32} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Legacy Shop</h2>
                    <p className="text-white/60 text-sm">{getPrestigeTitle(prestigeData.prestigeLevel)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Star size={20} />
                    <span className="text-2xl font-bold">{availablePoints}</span>
                  </div>
                  <p className="text-xs text-white/40">Legacy Points</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-2xl font-bold text-cyan-400">{prestigeData.totalVictories}</p>
                  <p className="text-xs text-white/60">Victories</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-2xl font-bold text-green-400">
                    {prestigeData.fastestVictory === Infinity ? '-' : prestigeData.fastestVictory}
                  </p>
                  <p className="text-xs text-white/60">Fastest Win</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-2xl font-bold text-orange-400">{prestigeData.highestStreak}</p>
                  <p className="text-xs text-white/60">Best Streak</p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-white/60 hover:text-white'
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Upgrades */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              <div className="space-y-3">
                {categoryUpgrades.map(upgrade => (
                  <UpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    unlocked={prestigeData.unlockedUpgrades.includes(upgrade.id)}
                    canAfford={availablePoints >= upgrade.cost}
                    onPurchase={() => handlePurchase(upgrade.id)}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex justify-between items-center">
              <p className="text-xs text-white/40">
                Win games to earn Legacy Points
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrestigePanel;
