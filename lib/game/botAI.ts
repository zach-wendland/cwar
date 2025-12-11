// botAI.ts - AI opponents for multiplayer (Easy/Medium/Hard difficulty)

import { actionsConfig } from './actions';
import {
  PoliticalFactionId,
  getPoliticalFaction,
  getActionModifiers,
  getAdjustedCost,
  isStrongholdState,
  getAverageSupport,
  countControlledStates,
  TerritorySupport,
} from './politicalFactions';
import {
  MultiplayerGameState,
  MultiplayerPlayerState,
  SubmittedAction,
} from './MultiplayerState';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

// Bot personality traits per faction
interface BotPersonality {
  aggressiveness: number; // 0-1, how likely to take risky actions
  defensiveness: number;  // 0-1, how likely to reduce risk
  expansion: number;      // 0-1, how much to prioritize new states
  sabotage: number;       // 0-1, how likely to use abilities against opponents
}

const BOT_PERSONALITIES: Record<PoliticalFactionId, BotPersonality> = {
  maga: {
    aggressiveness: 0.8,
    defensiveness: 0.3,
    expansion: 0.7,
    sabotage: 0.5,
  },
  america_first: {
    aggressiveness: 0.4,
    defensiveness: 0.6,
    expansion: 0.9, // Focus on swing states
    sabotage: 0.4,
  },
  liberal: {
    aggressiveness: 0.6,
    defensiveness: 0.4,
    expansion: 0.5,
    sabotage: 0.7, // More likely to use cancel campaign
  },
};

// ================================
// MAIN BOT DECISION FUNCTION
// ================================

/**
 * Generate a bot's action for the current turn
 */
export function generateBotAction(
  state: MultiplayerGameState,
  botPlayer: MultiplayerPlayerState,
  difficulty: BotDifficulty
): SubmittedAction {
  switch (difficulty) {
    case 'easy':
      return generateEasyAction(state, botPlayer);
    case 'medium':
      return generateMediumAction(state, botPlayer);
    case 'hard':
      return generateHardAction(state, botPlayer);
    default:
      return generateEasyAction(state, botPlayer);
  }
}

// ================================
// EASY BOT (Random)
// ================================

function generateEasyAction(
  state: MultiplayerGameState,
  bot: MultiplayerPlayerState
): SubmittedAction {
  // Filter to affordable actions
  const affordableActions = getAffordableActions(bot);

  if (affordableActions.length === 0) {
    // Fallback to fundraise (always free)
    return { actionId: 'fundraise', submittedAt: Date.now() };
  }

  // Pick random action
  const randomAction = affordableActions[Math.floor(Math.random() * affordableActions.length)];

  return {
    actionId: randomAction.id,
    submittedAt: Date.now(),
  };
}

// ================================
// MEDIUM BOT (Heuristic)
// ================================

function generateMediumAction(
  state: MultiplayerGameState,
  bot: MultiplayerPlayerState
): SubmittedAction {
  const faction = bot.faction;
  const personality = BOT_PERSONALITIES[faction];
  const affordableActions = getAffordableActions(bot);

  // Priority scoring for each action
  const scoredActions = affordableActions.map(action => {
    let score = 0;
    const modifiers = getActionModifiers(faction, action.id);

    // Base score from effect multiplier
    score += modifiers.effectMultiplier * 50;

    // Reduce score based on risk (unless aggressive)
    const riskPenalty = (1 - personality.aggressiveness) * modifiers.riskMultiplier * 20;
    score -= riskPenalty;

    // Boost score for faction-appropriate actions
    if (modifiers.effectMultiplier > 1.2) {
      score += 30; // Strong faction action
    }

    // Situational adjustments
    if (bot.risk > 70 && action.id === 'legal_fund') {
      score += 50 * personality.defensiveness; // Reduce risk when high
    }
    if (bot.risk > 70 && action.id === 'platform_hop') {
      score += 40 * personality.defensiveness;
    }
    if (bot.funds < 30 && action.id === 'fundraise') {
      score += 40; // Need money
    }
    if (bot.clout < 20 && action.id === 'podcast') {
      score += 30; // Build clout
    }

    // Add some randomness
    score += Math.random() * 20;

    return { action, score };
  });

  // Sort by score and pick best
  scoredActions.sort((a, b) => b.score - a.score);
  const bestAction = scoredActions[0]?.action || actionsConfig.find(a => a.id === 'fundraise')!;

  // Consider using ability
  const abilityUse = considerAbilityUse(state, bot, 'medium');

  return {
    actionId: bestAction.id,
    useAbility: abilityUse?.abilityId,
    abilityTarget: abilityUse?.target,
    submittedAt: Date.now(),
  };
}

// ================================
// HARD BOT (Minimax-inspired)
// ================================

function generateHardAction(
  state: MultiplayerGameState,
  bot: MultiplayerPlayerState
): SubmittedAction {
  const faction = bot.faction;
  const personality = BOT_PERSONALITIES[faction];
  const factionData = getPoliticalFaction(faction);
  const affordableActions = getAffordableActions(bot);

  // Analyze game state
  const territories = Object.fromEntries(
    Object.entries(state.territories).map(([code, t]) => [code, t.support])
  );
  const myAvgSupport = getAverageSupport(faction, territories);
  const controlledCounts = countControlledStates(territories);
  const myControlled = controlledCounts[faction];

  // Identify opponents
  const opponents = (['maga', 'america_first', 'liberal'] as PoliticalFactionId[])
    .filter(f => f !== faction);
  const leadingOpponent = opponents.reduce((a, b) =>
    getAverageSupport(a, territories) > getAverageSupport(b, territories) ? a : b
  );
  const opponentSupport = getAverageSupport(leadingOpponent, territories);

  // Calculate strategic priorities
  const behindLeader = opponentSupport - myAvgSupport;
  const needsExpansion = myControlled < 20;
  const closeToVictory = myAvgSupport > 55 || myControlled > 22;
  const inDanger = bot.risk > 75;

  // Score actions with strategic awareness
  const scoredActions = affordableActions.map(action => {
    let score = 0;
    const modifiers = getActionModifiers(faction, action.id);

    // Base effectiveness
    score += modifiers.effectMultiplier * 40;
    score -= modifiers.riskMultiplier * 15;
    score -= modifiers.costMultiplier * 10;

    // Strategic context
    if (inDanger) {
      // Prioritize risk reduction
      if (action.id === 'legal_fund') score += 80;
      if (action.id === 'platform_hop') score += 60;
      // Avoid high-risk actions
      if (action.id === 'bot_army') score -= 50;
      if (action.id === 'debate') score -= 30;
    }

    if (behindLeader > 10) {
      // Need to catch up - be aggressive
      if (action.id === 'bot_army') score += 30;
      if (action.id === 'rally') score += 25;
      if (action.id === 'influencer') score += 25;
    }

    if (closeToVictory) {
      // Play safe, consolidate
      if (action.id === 'canvass') score += 20;
      if (action.id === 'podcast') score += 15;
      // Avoid risks
      if (action.id === 'debate') score -= 20;
      if (action.id === 'bot_army') score -= 30;
    }

    if (needsExpansion) {
      // Target weak states
      if (action.id === 'rally') score += 25;
      if (action.id === 'canvass') score += 30;
      if (action.id === 'hashtag') score += 20;
    }

    // Resource management
    if (bot.funds < 50) {
      if (action.id === 'fundraise') score += 40;
    }
    if (bot.clout < 30) {
      if (action.id === 'podcast') score += 30;
    }

    // Faction-specific bonuses
    if (faction === 'maga' && action.id === 'rally') score += 20;
    if (faction === 'america_first' && action.id === 'canvass') score += 20;
    if (faction === 'liberal' && action.id === 'hashtag') score += 20;

    // Small randomness to avoid predictability
    score += Math.random() * 10;

    return { action, score };
  });

  scoredActions.sort((a, b) => b.score - a.score);
  const bestAction = scoredActions[0]?.action || actionsConfig.find(a => a.id === 'fundraise')!;

  // Hard bot is smarter about abilities
  const abilityUse = considerAbilityUse(state, bot, 'hard');

  return {
    actionId: bestAction.id,
    useAbility: abilityUse?.abilityId,
    abilityTarget: abilityUse?.target,
    submittedAt: Date.now(),
  };
}

// ================================
// HELPERS
// ================================

/**
 * Get all actions the bot can afford
 */
function getAffordableActions(bot: MultiplayerPlayerState) {
  return actionsConfig.filter(action => {
    const adjustedCost = getAdjustedCost(bot.faction, action.id, action.cost || {});
    const fundsCost = adjustedCost.funds || 0;
    const cloutCost = adjustedCost.clout || 0;
    return bot.funds >= fundsCost && bot.clout >= cloutCost;
  });
}

/**
 * Consider using a faction ability
 */
function considerAbilityUse(
  state: MultiplayerGameState,
  bot: MultiplayerPlayerState,
  difficulty: BotDifficulty
): { abilityId: string; target?: PoliticalFactionId } | null {
  if (difficulty === 'easy') {
    // Easy bots don't use abilities
    return null;
  }

  const faction = getPoliticalFaction(bot.faction);
  const personality = BOT_PERSONALITIES[bot.faction];

  // Check available abilities
  for (const ability of faction.abilities) {
    // Check cooldown
    if ((bot.abilityCooldowns[ability.id] || 0) > 0) continue;

    // Check unlock threshold
    const territories = Object.fromEntries(
      Object.entries(state.territories).map(([code, t]) => [code, t.support])
    );
    const avgSupport = getAverageSupport(bot.faction, territories);
    if (avgSupport < ability.unlockThreshold) continue;

    // Decision based on ability type
    if (ability.effect.type === 'support_boost') {
      // Use support abilities when not leading
      const controlCounts = countControlledStates(territories);
      const myControl = controlCounts[bot.faction];
      if (myControl < 20 || difficulty === 'hard') {
        return { abilityId: ability.id };
      }
    }

    if (ability.effect.type === 'sabotage') {
      // Use sabotage against leader (if we're not the leader)
      const opponents: PoliticalFactionId[] = ['maga', 'america_first', 'liberal']
        .filter(f => f !== bot.faction) as PoliticalFactionId[];

      const leader = opponents.reduce((a, b) =>
        getAverageSupport(a, territories) > getAverageSupport(b, territories) ? a : b
      );

      // More likely to sabotage if behind
      const shouldSabotage = Math.random() < personality.sabotage;
      if (shouldSabotage && difficulty === 'hard') {
        return { abilityId: ability.id, target: leader };
      }
    }

    if (ability.effect.type === 'buff') {
      // Use buffs when pushing for victory
      if (avgSupport > 50 && Math.random() < 0.5) {
        return { abilityId: ability.id };
      }
    }
  }

  return null;
}

// ================================
// BOT NAMES
// ================================

const BOT_NAMES: Record<PoliticalFactionId, string[]> = {
  maga: [
    'PatriotBot_47',
    'MAGA_Mike',
    'DarkMAGA_2025',
    'DOGEPatriot',
    'KashPatelFan',
    'FreedomBot',
    'SilentMajority',
    'DeplorableAI',
    'TrumpTrain2028',
    'H1B_Skeptic',
    'BannonArmy',
  ],
  america_first: [
    'GroyperGPT',
    'TuckerPilled',
    'CoalitionBuilder',
    'AmFirst_Strategist',
    'SwingStateSteve',
    'CatholicNat',
    'BasedZoomer',
    'FuentesFan2025',
    'PaleoConBot',
    'GrassrootsAI',
  ],
  liberal: [
    'BlueWaveBot',
    'IndivisibleAI',
    'FreeLuigiBot',
    'ResistanceNow',
    'MoveOnBot',
    'HashtagHero',
    'ViralVicky',
    'ProgressiveAI',
    'M4A_Now',
    'ClimateActionBot',
  ],
};

/**
 * Generate a bot display name
 */
export function generateBotName(faction: PoliticalFactionId): string {
  const names = BOT_NAMES[faction];
  return names[Math.floor(Math.random() * names.length)];
}

// ================================
// BOT SOCIAL POSTS
// ================================

const BOT_VICTORY_POSTS: Record<PoliticalFactionId, string[]> = {
  maga: [
    "WINNING! That's what we do! 🦅",
    "Another state falls to the MAGA movement!",
    "The silent majority speaks LOUDLY!",
    "DOGE is cutting the waste! Efficiency!",
    "Dark MAGA rises! 🔥",
    "Kash is cleaning house at the FBI!",
    "Trump 47 delivers AGAIN!",
    "Make America Great Again - no brakes!",
  ],
  america_first: [
    "Strategic victory in the heartland.",
    "Building coalitions, winning elections.",
    "The swing states are swinging our way!",
    "Grassroots power in action.",
    "Tucker was right about everything.",
    "The youth are with us. 30-40% of young staffers.",
    "Real America First, not the watered down version.",
    "Paleocon values winning again.",
  ],
  liberal: [
    "Blue wave rising! 🌊",
    "Progress marches forward!",
    "The people have spoken.",
    "Democracy wins again!",
    "Indivisible. Organized. Victorious.",
    "Healthcare is a human right!",
    "The resistance grows stronger!",
    "Project 2025 won't stop us!",
  ],
};

const BOT_DEFEAT_POSTS: Record<PoliticalFactionId, string[]> = {
  maga: [
    "FAKE NEWS won't stop us!",
    "We'll be back stronger!",
    "This isn't over...",
    "The deep state thinks they've won. They haven't.",
    "Even Elon had setbacks. We adapt.",
    "2028 is coming!",
  ],
  america_first: [
    "Regrouping for the next push.",
    "The fundamentals are still strong.",
    "One setback doesn't define us.",
    "The movement is bigger than any one election.",
    "Young conservatives are still rising.",
    "Tucker will have us back on to discuss this.",
  ],
  liberal: [
    "The fight continues!",
    "Resistance never dies.",
    "We rise again!",
    "They can't stop the blue wave forever.",
    "Healthcare reform WILL happen.",
    "Organizing for the next battle.",
  ],
};

const BOT_TAUNT_POSTS: Record<PoliticalFactionId, string[]> = {
  maga: [
    "Cope and seethe, libs!",
    "Rent free in your heads!",
    "This is the way.",
    "DOGE is coming for your bloated agencies!",
    "Baby Head Vance says hi 👶",
    "H-1B debate got you shook?",
    "Banger meme incoming...",
  ],
  america_first: [
    "While you tweet, we organize.",
    "Swing states don't care about your hashtags.",
    "Ground game > Online game.",
    "Tucker's audience > your whole platform.",
    "The youth are waking up.",
    "Silicon Valley doesn't speak for us.",
    "Real populism, not corporate MAGA.",
  ],
  liberal: [
    "Ratio'd again lmao",
    "Community Note incoming...",
    "Touch grass, chuds.",
    "#FreeLuigi trending for a reason",
    "Healthcare CEO discourse has entered the chat",
    "Your DOGE cuts are cutting your own voters",
    "Indivisible chapters in every district btw",
  ],
};

/**
 * Generate a social post for a bot
 */
export function generateBotSocialPost(
  faction: PoliticalFactionId,
  context: 'victory' | 'defeat' | 'taunt' | 'neutral'
): string {
  let posts: string[];

  switch (context) {
    case 'victory':
      posts = BOT_VICTORY_POSTS[faction];
      break;
    case 'defeat':
      posts = BOT_DEFEAT_POSTS[faction];
      break;
    case 'taunt':
      posts = BOT_TAUNT_POSTS[faction];
      break;
    default:
      posts = BOT_VICTORY_POSTS[faction]; // Default to positive
  }

  return posts[Math.floor(Math.random() * posts.length)];
}
