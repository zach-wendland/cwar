// comboEngine.ts - Emergent combo detection for the spin system
// Any matching theme tags across reels create bonuses
// Named combos give extra multipliers

import { ReelItem, THEME_TAGS } from './reelConfigs';

// ================================
// COMBO RESULT TYPE
// ================================

export interface ComboResult {
  multiplier: number;
  matchedTags: string[];
  comboName: string | null;
  isJackpot: boolean;  // 3-way match
}

// ================================
// NAMED COMBOS (Special combinations with bonus multipliers)
// ================================

interface NamedCombo {
  name: string;
  requiredTags: string[];  // All must be present
  bonusMultiplier: number;
  description: string;
}

export const NAMED_COMBOS: NamedCombo[] = [
  // Triple matches (jackpots)
  {
    name: 'Digital Blitz',
    requiredTags: [THEME_TAGS.DIGITAL, THEME_TAGS.VIRAL, THEME_TAGS.BLITZ],
    bonusMultiplier: 3.0,
    description: 'Maximum viral impact across digital channels',
  },
  {
    name: 'Grassroots Wave',
    requiredTags: [THEME_TAGS.GRASSROOTS, THEME_TAGS.RURAL, THEME_TAGS.MIDWEST],
    bonusMultiplier: 2.8,
    description: 'Authentic movement sweeps the heartland',
  },
  {
    name: 'Youth Uprising',
    requiredTags: [THEME_TAGS.YOUTH, THEME_TAGS.DIGITAL, THEME_TAGS.URBAN],
    bonusMultiplier: 2.8,
    description: 'Gen-Z mobilizes in major cities',
  },
  {
    name: 'Suburban Surge',
    requiredTags: [THEME_TAGS.SUBURBAN, THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    bonusMultiplier: 2.5,
    description: 'Soccer moms and swing voters unite',
  },
  {
    name: 'Coastal Elite',
    requiredTags: [THEME_TAGS.COASTAL, THEME_TAGS.URBAN, THEME_TAGS.BROADCAST],
    bonusMultiplier: 2.6,
    description: 'Media dominance on both coasts',
  },
  {
    name: 'Southern Strategy',
    requiredTags: [THEME_TAGS.SOUTH, THEME_TAGS.RURAL, THEME_TAGS.GRASSROOTS],
    bonusMultiplier: 2.7,
    description: 'Deep roots in Dixie territory',
  },
  {
    name: 'Battleground Blitz',
    requiredTags: [THEME_TAGS.SWING, THEME_TAGS.BLITZ, THEME_TAGS.AGGRESSIVE],
    bonusMultiplier: 3.0,
    description: 'All-out assault on swing states',
  },

  // Risky combos (high reward, high risk)
  {
    name: 'Chaos Agent',
    requiredTags: [THEME_TAGS.RISKY, THEME_TAGS.AGGRESSIVE, THEME_TAGS.VIRAL],
    bonusMultiplier: 2.5,
    description: 'Embrace the chaos, reap the rewards',
  },
  {
    name: 'Safe Harbor',
    requiredTags: [THEME_TAGS.SAFE, THEME_TAGS.STEADY, THEME_TAGS.SUBURBAN],
    bonusMultiplier: 2.0,
    description: 'Slow and steady wins the race',
  },

  // Double matches (common combos)
  {
    name: 'Meme Machine',
    requiredTags: [THEME_TAGS.DIGITAL, THEME_TAGS.VIRAL],
    bonusMultiplier: 2.0,
    description: 'Content goes viral online',
  },
  {
    name: 'Ground Game',
    requiredTags: [THEME_TAGS.GRASSROOTS, THEME_TAGS.RURAL],
    bonusMultiplier: 1.8,
    description: 'Boots on the ground pays off',
  },
  {
    name: 'Media Darling',
    requiredTags: [THEME_TAGS.BROADCAST, THEME_TAGS.SAFE],
    bonusMultiplier: 1.7,
    description: 'Favorable coverage everywhere',
  },
  {
    name: 'Risk Taker',
    requiredTags: [THEME_TAGS.RISKY, THEME_TAGS.BLITZ],
    bonusMultiplier: 1.9,
    description: 'Fortune favors the bold',
  },
  {
    name: 'Steady Eddie',
    requiredTags: [THEME_TAGS.SAFE, THEME_TAGS.STEADY],
    bonusMultiplier: 1.5,
    description: 'Consistent, reliable progress',
  },
];

// ================================
// COMBO DETECTION
// ================================

/**
 * Calculate combo multiplier from a spin result
 */
export function calculateComboMultiplier(
  action: ReelItem,
  modifier: ReelItem,
  target: ReelItem
): ComboResult {
  // Collect all tags from the three reels
  const allTags = [...action.tags, ...modifier.tags, ...target.tags];

  // Find matching tags (appear in 2+ reels)
  const tagCounts: { [tag: string]: number } = {};
  for (const tag of allTags) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  const matchedTags = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag);

  // Check for named combos (highest priority)
  const namedCombo = findBestNamedCombo(matchedTags);
  if (namedCombo) {
    return {
      multiplier: namedCombo.bonusMultiplier,
      matchedTags,
      comboName: namedCombo.name,
      isJackpot: namedCombo.requiredTags.length >= 3,
    };
  }

  // Calculate emergent combo multiplier based on tag matches
  const tripleMatches = Object.values(tagCounts).filter(c => c >= 3).length;
  const doubleMatches = Object.values(tagCounts).filter(c => c === 2).length;

  if (tripleMatches > 0) {
    // 3-way match = 2x base
    return {
      multiplier: 2.0 + (tripleMatches - 1) * 0.5,
      matchedTags,
      comboName: `${matchedTags[0]?.toUpperCase() || 'TRIPLE'} JACKPOT`,
      isJackpot: true,
    };
  }

  if (doubleMatches >= 2) {
    // Multiple 2-way matches = 1.8x
    return {
      multiplier: 1.5 + (doubleMatches * 0.15),
      matchedTags,
      comboName: null,
      isJackpot: false,
    };
  }

  if (doubleMatches === 1) {
    // Single 2-way match = 1.5x
    return {
      multiplier: 1.5,
      matchedTags,
      comboName: null,
      isJackpot: false,
    };
  }

  // No matches
  return {
    multiplier: 1.0,
    matchedTags: [],
    comboName: null,
    isJackpot: false,
  };
}

/**
 * Find the best named combo that matches the given tags
 */
function findBestNamedCombo(matchedTags: string[]): NamedCombo | null {
  let bestCombo: NamedCombo | null = null;
  let bestMultiplier = 0;

  for (const combo of NAMED_COMBOS) {
    // Check if all required tags are present in matchedTags
    const hasAllTags = combo.requiredTags.every(tag => matchedTags.includes(tag));

    if (hasAllTags && combo.bonusMultiplier > bestMultiplier) {
      bestCombo = combo;
      bestMultiplier = combo.bonusMultiplier;
    }
  }

  return bestCombo;
}

// ================================
// COMBO PREVIEW
// ================================

/**
 * Preview potential combos from partial spin (for UI hints)
 */
export function previewPotentialCombos(
  lockedItems: { action?: ReelItem; modifier?: ReelItem; target?: ReelItem }
): { possibleCombos: NamedCombo[]; lockedTags: string[] } {
  const lockedTags: string[] = [];

  if (lockedItems.action) lockedTags.push(...lockedItems.action.tags);
  if (lockedItems.modifier) lockedTags.push(...lockedItems.modifier.tags);
  if (lockedItems.target) lockedTags.push(...lockedItems.target.tags);

  // Find combos that could be completed with remaining spins
  const possibleCombos = NAMED_COMBOS.filter(combo => {
    const matchedRequired = combo.requiredTags.filter(tag => lockedTags.includes(tag));
    // At least one tag matched, and combo is still achievable
    return matchedRequired.length > 0 && matchedRequired.length < combo.requiredTags.length;
  });

  return { possibleCombos, lockedTags };
}

/**
 * Get all discovered combos (for codex/achievement system)
 */
export function getAllNamedCombos(): NamedCombo[] {
  return NAMED_COMBOS;
}

/**
 * Check if a specific named combo was achieved
 */
export function checkNamedCombo(
  action: ReelItem,
  modifier: ReelItem,
  target: ReelItem,
  comboName: string
): boolean {
  const result = calculateComboMultiplier(action, modifier, target);
  return result.comboName === comboName;
}
