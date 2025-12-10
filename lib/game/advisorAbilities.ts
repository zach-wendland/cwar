// advisorAbilities.ts - Advisor passive abilities that affect gameplay

import { EventOutcome } from './GameContext';

export interface AdvisorAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: AbilityEffect;
}

export type AbilityEffect =
  | { type: 'action_bonus'; actionId: string; bonus: number }      // % bonus to action effect
  | { type: 'action_discount'; actionId: string; discount: number } // % discount on action cost
  | { type: 'risk_reduction'; percent: number }                     // Reduce all risk gains
  | { type: 'clout_bonus'; percent: number }                        // Bonus clout from all sources
  | { type: 'funds_bonus'; percent: number }                        // Bonus funds from all sources
  | { type: 'support_bonus'; percent: number }                      // Bonus support from all sources
  | { type: 'critical_chance'; bonus: number }                      // Extra critical hit chance
  | { type: 'faction_bonus'; factionId: string; percent: number }   // Bonus faction effect
  | { type: 'event_reveal' };                                       // Show event outcomes before choosing

// Pre-defined advisor abilities
export const ADVISOR_ABILITIES: { [advisorName: string]: AdvisorAbility } = {
  'Mike "MemeLord" Miller': {
    id: 'meme_master',
    name: 'Meme Master',
    description: '+20% effect from Meme Campaign, +5% critical hit chance',
    icon: '🎭',
    effect: { type: 'action_bonus', actionId: 'meme_campaign', bonus: 20 },
  },
  'Dana Data': {
    id: 'data_driven',
    name: 'Data-Driven',
    description: 'All support gains +10%, can preview event outcomes',
    icon: '📊',
    effect: { type: 'support_bonus', percent: 10 },
  },
  'Riley Rebel': {
    id: 'rally_leader',
    name: 'Rally Leader',
    description: 'Rally costs 25% less funds, +15% Rally effect',
    icon: '📢',
    effect: { type: 'action_discount', actionId: 'rally', discount: 25 },
  },
};

// Apply advisor abilities to an action outcome
export function applyAdvisorBonus(
  outcome: EventOutcome,
  actionId: string,
  advisorNames: string[]
): EventOutcome {
  let modifiedOutcome = { ...outcome };

  advisorNames.forEach(name => {
    const ability = ADVISOR_ABILITIES[name];
    if (!ability) return;

    const effect = ability.effect;

    switch (effect.type) {
      case 'action_bonus':
        if (effect.actionId === actionId) {
          // Apply bonus to positive effects
          if (modifiedOutcome.supportDelta) {
            modifiedOutcome.supportDelta = { ...modifiedOutcome.supportDelta };
            for (const key in modifiedOutcome.supportDelta) {
              const value = modifiedOutcome.supportDelta[key];
              if (value > 0) {
                modifiedOutcome.supportDelta[key] = Math.round(value * (1 + effect.bonus / 100));
              }
            }
          }
          if (modifiedOutcome.cloutDelta && modifiedOutcome.cloutDelta > 0) {
            modifiedOutcome.cloutDelta = Math.round(modifiedOutcome.cloutDelta * (1 + effect.bonus / 100));
          }
        }
        break;

      case 'support_bonus':
        if (modifiedOutcome.supportDelta) {
          modifiedOutcome.supportDelta = { ...modifiedOutcome.supportDelta };
          for (const key in modifiedOutcome.supportDelta) {
            const value = modifiedOutcome.supportDelta[key];
            if (value > 0) {
              modifiedOutcome.supportDelta[key] = Math.round(value * (1 + effect.percent / 100));
            }
          }
        }
        break;

      case 'clout_bonus':
        if (modifiedOutcome.cloutDelta && modifiedOutcome.cloutDelta > 0) {
          modifiedOutcome.cloutDelta = Math.round(modifiedOutcome.cloutDelta * (1 + effect.percent / 100));
        }
        break;

      case 'funds_bonus':
        if (modifiedOutcome.fundsDelta && modifiedOutcome.fundsDelta > 0) {
          modifiedOutcome.fundsDelta = Math.round(modifiedOutcome.fundsDelta * (1 + effect.percent / 100));
        }
        break;

      case 'risk_reduction':
        if (modifiedOutcome.riskDelta && modifiedOutcome.riskDelta > 0) {
          modifiedOutcome.riskDelta = Math.round(modifiedOutcome.riskDelta * (1 - effect.percent / 100));
        }
        break;
    }
  });

  return modifiedOutcome;
}

// Get action cost discount from advisors
export function getActionDiscount(
  actionId: string,
  advisorNames: string[]
): { fundsDiscount: number; cloutDiscount: number } {
  let fundsDiscount = 0;
  let cloutDiscount = 0;

  advisorNames.forEach(name => {
    const ability = ADVISOR_ABILITIES[name];
    if (!ability) return;

    const effect = ability.effect;
    if (effect.type === 'action_discount' && effect.actionId === actionId) {
      fundsDiscount += effect.discount;
      cloutDiscount += effect.discount;
    }
  });

  return { fundsDiscount: Math.min(fundsDiscount, 50), cloutDiscount: Math.min(cloutDiscount, 50) };
}

// Get critical hit chance bonus from advisors
export function getCriticalBonus(advisorNames: string[]): number {
  let bonus = 0;

  advisorNames.forEach(name => {
    const ability = ADVISOR_ABILITIES[name];
    if (!ability) return;

    const effect = ability.effect;
    if (effect.type === 'critical_chance') {
      bonus += effect.bonus;
    }
  });

  // Mike "MemeLord" also gives +5% crit
  if (advisorNames.includes('Mike "MemeLord" Miller')) {
    bonus += 5;
  }

  return bonus;
}

// Check if any advisor has event reveal ability
export function hasEventReveal(advisorNames: string[]): boolean {
  // Dana Data's ability includes event preview
  return advisorNames.includes('Dana Data');
}

// Get advisor ability info for display
export function getAdvisorAbility(advisorName: string): AdvisorAbility | undefined {
  return ADVISOR_ABILITIES[advisorName];
}
