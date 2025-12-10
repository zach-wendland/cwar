// factions.ts - Different voter demographics with distinct preferences

export interface Faction {
  id: string;
  name: string;
  description: string;
  icon: string;  // emoji for display
  baseSupport: number;  // starting support level (0-100)
  // Modifiers for different action types (-100 to +100, applied as percentage)
  actionModifiers: {
    meme_campaign: number;
    fundraise: number;
    rally: number;
    bot_army: number;
    podcast: number;
    hashtag: number;
    debate: number;
    canvass: number;
    influencer: number;
    legal_fund: number;
    platform_hop: number;
  };
  // States where this faction has strong presence (gets bonus effects)
  strongholdStates: string[];
}

export const factions: Faction[] = [
  {
    id: 'tech_workers',
    name: 'Tech Workers',
    description: 'Silicon Valley types who value innovation and authenticity. Hate obvious manipulation.',
    icon: '💻',
    baseSupport: 40,
    actionModifiers: {
      meme_campaign: 20,      // They appreciate clever memes
      fundraise: 0,
      rally: -20,             // Think rallies are outdated
      bot_army: -80,          // HATE bots - they can detect them
      podcast: 50,            // Love long-form content
      hashtag: 30,            // Native to social media
      debate: 40,             // Appreciate intellectual discourse
      canvass: -30,           // Prefer digital outreach
      influencer: 20,         // Follow tech influencers
      legal_fund: 10,
      platform_hop: 60,       // Understand platform dynamics
    },
    strongholdStates: ['CA', 'WA', 'NY', 'TX', 'CO', 'MA'],
  },
  {
    id: 'rural_voters',
    name: 'Rural Voters',
    description: 'Heartland Americans who value tradition and face-to-face connection.',
    icon: '🌾',
    baseSupport: 30,
    actionModifiers: {
      meme_campaign: -30,     // Skeptical of internet culture
      fundraise: -10,
      rally: 60,              // LOVE rallies and gatherings
      bot_army: -40,          // Suspicious of online manipulation
      podcast: 20,            // Listen during commutes
      hashtag: -50,           // Don't use Twitter much
      debate: 30,             // Appreciate direct confrontation
      canvass: 80,            // Value personal connection
      influencer: -40,        // Don't follow influencers
      legal_fund: 0,
      platform_hop: -20,      // Don't care about platforms
    },
    strongholdStates: ['TX', 'OK', 'KS', 'NE', 'ND', 'SD', 'MT', 'WY', 'ID', 'IA', 'MO', 'AR'],
  },
  {
    id: 'young_activists',
    name: 'Young Activists',
    description: 'Gen Z and millennials demanding radical change. High energy but impatient.',
    icon: '✊',
    baseSupport: 50,
    actionModifiers: {
      meme_campaign: 80,      // LOVE memes
      fundraise: -20,         // Suspicious of money in politics
      rally: 40,              // Love protests
      bot_army: 10,           // Pragmatic about tactics
      podcast: 30,            // Content consumers
      hashtag: 70,            // Native to hashtag activism
      debate: -10,            // Want action not talk
      canvass: 30,            // Will do grassroots work
      influencer: 60,         // Follow progressive influencers
      legal_fund: -30,        // Think legal system is corrupt
      platform_hop: 40,       // Understand platform migration
    },
    strongholdStates: ['CA', 'NY', 'OR', 'WA', 'MA', 'VT', 'CO', 'IL'],
  },
  {
    id: 'moderates',
    name: 'Moderates',
    description: 'Middle-of-the-road voters who dislike extremism and value stability.',
    icon: '⚖️',
    baseSupport: 35,
    actionModifiers: {
      meme_campaign: -20,     // Find memes divisive
      fundraise: 30,          // Appreciate transparent funding
      rally: -10,             // Worried about extremism
      bot_army: -90,          // HATE manipulation
      podcast: 40,            // Like nuanced discussion
      hashtag: -40,           // Think hashtags are shallow
      debate: 60,             // LOVE civil debate
      canvass: 50,            // Appreciate personal outreach
      influencer: -20,        // Skeptical of influencers
      legal_fund: 50,         // Value rule of law
      platform_hop: 0,
    },
    strongholdStates: ['PA', 'MI', 'WI', 'OH', 'FL', 'NC', 'AZ', 'GA', 'NV', 'NH'],
  },
  {
    id: 'business_class',
    name: 'Business Class',
    description: 'Entrepreneurs and executives focused on economic outcomes.',
    icon: '💼',
    baseSupport: 25,
    actionModifiers: {
      meme_campaign: -10,
      fundraise: 70,          // LOVE successful fundraising
      rally: 0,
      bot_army: 20,           // Pragmatic about tactics
      podcast: 50,            // Business podcast listeners
      hashtag: -10,
      debate: 30,             // Appreciate competence displays
      canvass: -20,           // Busy, don't want door knocks
      influencer: 40,         // Follow business influencers
      legal_fund: 80,         // Very pro legal protection
      platform_hop: 30,       // Understand business pivots
    },
    strongholdStates: ['NY', 'CT', 'NJ', 'TX', 'FL', 'IL', 'GA'],
  },
];

// Calculate faction-adjusted support change for an action
export function calculateFactionEffect(
  actionId: string,
  baseChange: number,
  factionSupport: { [factionId: string]: number }
): { [factionId: string]: number } {
  const changes: { [factionId: string]: number } = {};

  factions.forEach(faction => {
    const modifier = faction.actionModifiers[actionId as keyof typeof faction.actionModifiers] || 0;
    // Apply modifier as percentage change: base * (1 + modifier/100)
    const adjustedChange = Math.round(baseChange * (1 + modifier / 100));
    changes[faction.id] = adjustedChange;
  });

  return changes;
}

// Get weighted average support considering faction presence in state
export function getStateEffectiveSupport(
  stateCode: string,
  factionSupport: { [factionId: string]: number }
): number {
  let totalWeight = 0;
  let weightedSupport = 0;

  factions.forEach(faction => {
    // Factions have more weight in their stronghold states
    const weight = faction.strongholdStates.includes(stateCode) ? 2 : 1;
    totalWeight += weight;
    weightedSupport += (factionSupport[faction.id] || faction.baseSupport) * weight;
  });

  return Math.round(weightedSupport / totalWeight);
}

// Get faction with highest/lowest support
export function getLeadingFaction(factionSupport: { [factionId: string]: number }): Faction {
  let maxSupport = -1;
  let leader = factions[0];

  factions.forEach(faction => {
    const support = factionSupport[faction.id] || faction.baseSupport;
    if (support > maxSupport) {
      maxSupport = support;
      leader = faction;
    }
  });

  return leader;
}

export function getLowestFaction(factionSupport: { [factionId: string]: number }): Faction {
  let minSupport = 101;
  let lowest = factions[0];

  factions.forEach(faction => {
    const support = factionSupport[faction.id] || faction.baseSupport;
    if (support < minSupport) {
      minSupport = support;
      lowest = faction;
    }
  });

  return lowest;
}

// Initialize faction support
export function initializeFactionSupport(): { [factionId: string]: number } {
  const support: { [factionId: string]: number } = {};
  factions.forEach(faction => {
    support[faction.id] = faction.baseSupport;
  });
  return support;
}

// Get faction-specific event modifiers
export function getFactionEventModifier(
  factionId: string,
  eventCategory: string
): number {
  const faction = factions.find(f => f.id === factionId);
  if (!faction) return 0;

  // Different factions react differently to event categories
  const categoryModifiers: { [category: string]: { [factionId: string]: number } } = {
    'tech': {
      tech_workers: 50,
      young_activists: 20,
      rural_voters: -20,
      moderates: 0,
      business_class: 30,
    },
    'media': {
      tech_workers: 10,
      young_activists: 30,
      rural_voters: -10,
      moderates: 20,
      business_class: 0,
    },
    'political': {
      tech_workers: -10,
      young_activists: 40,
      rural_voters: 20,
      moderates: 30,
      business_class: 10,
    },
    'economic': {
      tech_workers: 20,
      young_activists: -20,
      rural_voters: 10,
      moderates: 20,
      business_class: 60,
    },
    'cultural': {
      tech_workers: 0,
      young_activists: 50,
      rural_voters: -30,
      moderates: -20,
      business_class: -10,
    },
  };

  return categoryModifiers[eventCategory]?.[factionId] || 0;
}
