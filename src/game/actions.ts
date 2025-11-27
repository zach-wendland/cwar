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
  }
];
