// actions.ts - define the available player actions and their effects
import { EventOutcome, GameState } from './GameContext';

// Schema for an action definition
interface GameActionConfig {
  id: string;
  name: string;
  description: string;
  cost?: { funds?: number; clout?: number };
  perform: (state: GameState) => EventOutcome;
}

// List of playable actions
export const actionsConfig: GameActionConfig[] = [
  {
    id: 'meme_campaign',
    name: 'Launch Meme Campaign',
    description: 'Spend clout to create a viral meme campaign that boosts your support base online.',
    cost: { clout: 10 },
    perform: (state: GameState) => {
      // Increase support in a few random states and raise risk (meme warfare can attract attention)
      const supportDelta: { [state: string]: number } = {};
      const states = Object.keys(state.support);
      for (let i = 0; i < 3; i++) {
        const randState = states[Math.floor(Math.random() * states.length)];
        supportDelta[randState] = (supportDelta[randState] || 0) + 5;
      }
      return {
        supportDelta,
        riskDelta: 5,
        cloutDelta: 5,  // successful campaign can recoup some clout
        message: 'Your meme campaign goes viral, boosting support in several states!'
      };
    }
  },
  {
    id: 'fundraise',
    name: 'Fundraise',
    description: 'Raise funds from supporters through online crowdfunding.',
    cost: {},  // no upfront cost, just consumes a turn
    perform: (state: GameState) => {
      return {
        fundsDelta: 50,
        riskDelta: 2,
        message: 'You held a successful fundraiser and gained $50k in donations.'
      };
    }
  },
  {
    id: 'rally',
    name: 'Organize Rally',
    description: 'Spend funds to organize a rally in a target region to boost local support.',
    cost: { funds: 30 },
    perform: (state: GameState) => {
      // Focus on the state with the lowest support to maximize impact
      let lowestState: string | null = null;
      let minSupport = 101;
      for (const s in state.support) {
        if (state.support[s] < minSupport) {
          minSupport = state.support[s];
          lowestState = s;
        }
      }
      const supportDelta: { [state: string]: number } = {};
      if (lowestState) {
        supportDelta[lowestState] = 10;
      }
      return {
        supportDelta,
        riskDelta: 3,
        message: `A rally is held in ${lowestState}, giving a boost to support there.`
      };
    }
  },
  {
    id: 'bot_army',
    name: 'Deploy Bot Army',
    description: 'Secretly deploy a bot army to spread propaganda (high risk, high reward).',
    cost: { funds: 20, clout: 5 },
    perform: (state: GameState) => {
      // Broad influence increase at the cost of high risk
      return {
        supportDelta: { 'ALL': 3 },  // +3% support in all states
        riskDelta: 15,
        message: 'Bot army deployed nationwide, boosting influence everywhere (but greatly increasing exposure risk).'
      };
    }
  },
  {
    id: 'regional_focus',
    name: 'Regional Focus Campaign',
    description: 'Concentrate efforts on a specific region for maximum impact.',
    cost: { funds: 40, clout: 15 },
    perform: (state: GameState) => {
      // Find the region with highest average support to amplify momentum
      const bestRegion = state.regions.reduce((best, region) => {
        return region.influence > best.influence ? region : best;
      }, state.regions[0]);

      const supportDelta: { [state: string]: number } = {};
      bestRegion.states.forEach(stateCode => {
        supportDelta[stateCode] = 12;
      });

      return {
        supportDelta,
        riskDelta: 5,
        message: `Concentrated campaign in ${bestRegion.name} region yields strong results!`
      };
    }
  },
  {
    id: 'damage_control',
    name: 'Damage Control',
    description: 'Launch a PR campaign to reduce risk and repair reputation.',
    cost: { funds: 50, clout: 10 },
    perform: (state: GameState) => {
      return {
        riskDelta: -25,
        cloutDelta: 10,
        message: 'Damage control campaign successfully reduces exposure risk.'
      };
    }
  },
  {
    id: 'momentum_builder',
    name: 'Build Momentum',
    description: 'Invest in building long-term momentum through sustained campaigning.',
    cost: { funds: 30 },
    perform: (state: GameState) => {
      const momentumBoost = Math.min(100, state.momentum + 20);
      return {
        supportDelta: { 'ALL': 2 },
        cloutDelta: 5,
        riskDelta: 3,
        message: 'Sustained campaign efforts build momentum for future actions.'
      };
    }
  },
  {
    id: 'opposition_intel',
    name: 'Gather Opposition Intel',
    description: 'Research opposition movements to counter their strategies.',
    cost: { funds: 25, clout: 5 },
    perform: (state: GameState) => {
      // Counter opposition by gaining support in their focus areas
      const supportDelta: { [state: string]: number } = {};
      state.opposition.forEach(opp => {
        opp.focus.forEach(stateCode => {
          supportDelta[stateCode] = (supportDelta[stateCode] || 0) + 8;
        });
      });

      return {
        supportDelta: Object.keys(supportDelta).length > 0 ? supportDelta : { 'ALL': 3 },
        riskDelta: 2,
        message: 'Intelligence gathered on opposition movements, countering their influence.'
      };
    }
  },
  {
    id: 'influencer_partnership',
    name: 'Partner with Influencers',
    description: 'Collaborate with social media influencers to expand reach.',
    cost: { funds: 60, clout: 20 },
    perform: (state: GameState) => {
      return {
        cloutDelta: 40,
        supportDelta: { 'ALL': 4 },
        riskDelta: 7,
        message: 'Influencer partnerships dramatically expand your reach and visibility!'
      };
    }
  },
  {
    id: 'grassroots_network',
    name: 'Expand Grassroots Network',
    description: 'Build local volunteer networks for sustained growth.',
    cost: { funds: 45 },
    perform: (state: GameState) => {
      // Focus on states with mid-range support (30-60%) for best conversion
      const supportDelta: { [state: string]: number } = {};
      Object.keys(state.support).forEach(stateCode => {
        if (state.support[stateCode] >= 30 && state.support[stateCode] <= 60) {
          supportDelta[stateCode] = 10;
        }
      });

      return {
        supportDelta: Object.keys(supportDelta).length > 0 ? supportDelta : { 'ALL': 3 },
        fundsDelta: 20,  // Grassroots networks help with fundraising
        riskDelta: 2,
        message: 'Grassroots networks established, providing sustainable support growth.'
      };
    }
  },
  {
    id: 'media_blitz',
    name: 'Media Blitz',
    description: 'Saturate traditional and social media with your message.',
    cost: { funds: 80, clout: 25 },
    perform: (state: GameState) => {
      return {
        supportDelta: { 'ALL': 6 },
        cloutDelta: 30,
        riskDelta: 12,
        message: 'Media blitz creates massive awareness, but draws significant attention.'
      };
    }
  }
];
