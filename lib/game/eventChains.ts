// eventChains.ts - Multi-part narrative events that unfold over several turns

import { GameEvent, EventOutcome, GameState } from './GameContext';

// Event chain step definition
interface ChainStep {
  stepId: string;
  title: string;
  description: string;
  options: Array<{
    text: string;
    outcome: EventOutcome;
    nextStep?: string;  // ID of next step, or undefined to end chain
    requirement?: (state: GameState) => boolean;  // Optional condition
  }>;
}

// Full event chain definition
interface EventChain {
  chainId: string;
  name: string;
  category: 'tech' | 'media' | 'political' | 'economic' | 'cultural';
  minTurn: number;
  steps: ChainStep[];
  triggerChance: number;  // 0-1 probability when eligible
}

// Extended GameEvent with chain metadata
export interface ChainedGameEvent extends GameEvent {
  chainId?: string;
  stepId?: string;
  isChainEvent?: boolean;
}

// ============================================================================
// EVENT CHAINS: 5 multi-part narrative arcs
// ============================================================================

export const EVENT_CHAINS: EventChain[] = [
  // =========================
  // CHAIN 1: The Whistleblower
  // =========================
  {
    chainId: 'whistleblower',
    name: 'The Whistleblower Saga',
    category: 'media',
    minTurn: 5,
    triggerChance: 0.15,
    steps: [
      {
        stepId: 'whistleblower_1',
        title: '🔔 Anonymous Tip Received',
        description: 'Someone claiming to be a platform insider wants to leak documents proving algorithmic suppression of your movement.',
        options: [
          {
            text: 'Meet with them secretly',
            outcome: {
              fundsDelta: -20,
              riskDelta: 10,
              message: 'You arrange a covert meeting. The risk is high but the potential is huge.'
            },
            nextStep: 'whistleblower_2a'
          },
          {
            text: 'Demand proof first',
            outcome: {
              riskDelta: 5,
              message: 'You ask for preliminary evidence before committing.'
            },
            nextStep: 'whistleblower_2b'
          },
          {
            text: 'Ignore - could be a trap',
            outcome: {
              riskDelta: -5,
              message: 'You play it safe. The opportunity passes.'
            }
            // No nextStep = ends chain
          }
        ]
      },
      {
        stepId: 'whistleblower_2a',
        title: '🔔 The Documents Are Real',
        description: 'The whistleblower provided explosive documents. Internal memos show deliberate suppression of your content.',
        options: [
          {
            text: 'Release everything immediately',
            outcome: {
              cloutDelta: 50,
              supportDelta: { 'ALL': 8 },
              riskDelta: 25,
              message: 'The leak goes viral! You\'re vindicated but now a major target.'
            },
            nextStep: 'whistleblower_3_viral'
          },
          {
            text: 'Coordinate with journalists first',
            outcome: {
              fundsDelta: -30,
              cloutDelta: 35,
              supportDelta: { 'ALL': 5 },
              riskDelta: 15,
              message: 'The coordinated release maximizes impact while providing some legal cover.'
            },
            nextStep: 'whistleblower_3_press'
          },
          {
            text: 'Use as leverage privately',
            outcome: {
              fundsDelta: 40,
              riskDelta: -10,
              cloutDelta: 10,
              message: 'You negotiate quietly. The platform agrees to "adjust" their algorithm.'
            }
          }
        ]
      },
      {
        stepId: 'whistleblower_2b',
        title: '🔔 Partial Proof Received',
        description: 'The whistleblower sent redacted screenshots. Looks legitimate but incomplete.',
        options: [
          {
            text: 'Proceed with caution',
            outcome: {
              fundsDelta: -15,
              riskDelta: 8,
              message: 'You move forward carefully, requesting more evidence.'
            },
            nextStep: 'whistleblower_2a'  // Loops to full documents
          },
          {
            text: 'Publish what you have',
            outcome: {
              cloutDelta: 20,
              supportDelta: { 'ALL': 3 },
              riskDelta: 15,
              message: 'The partial leak raises questions but skeptics demand more proof.'
            }
          },
          {
            text: 'Walk away - too risky',
            outcome: {
              riskDelta: -5,
              message: 'Without full documents, you decide it\'s not worth the risk.'
            }
          }
        ]
      },
      {
        stepId: 'whistleblower_3_viral',
        title: '🔔 Congressional Interest',
        description: 'Your viral leak caught Congress\'s attention. They want the whistleblower to testify.',
        options: [
          {
            text: 'Help arrange testimony',
            outcome: {
              cloutDelta: 40,
              supportDelta: { 'ALL': 10 },
              riskDelta: 10,
              message: 'The testimony makes history. Your movement is at the center of a national conversation.'
            }
          },
          {
            text: 'Protect the source\'s identity',
            outcome: {
              cloutDelta: 25,
              riskDelta: -10,
              message: 'You refuse to expose them. Journalists praise your principles.'
            }
          }
        ]
      },
      {
        stepId: 'whistleblower_3_press',
        title: '🔔 Media Aftermath',
        description: 'The press coverage was extensive. Both sides are spinning the story.',
        options: [
          {
            text: 'Do a media tour',
            outcome: {
              fundsDelta: -25,
              cloutDelta: 30,
              supportDelta: { 'ALL': 5 },
              riskDelta: 8,
              message: 'Your face is everywhere. Name recognition soars.'
            }
          },
          {
            text: 'Let the story speak for itself',
            outcome: {
              cloutDelta: 15,
              riskDelta: -5,
              message: 'The documents do the talking. You avoid overexposure.'
            }
          }
        ]
      }
    ]
  },

  // =========================
  // CHAIN 2: The Rival Movement
  // =========================
  {
    chainId: 'rival',
    name: 'Rise of the Rival',
    category: 'cultural',
    minTurn: 7,
    triggerChance: 0.12,
    steps: [
      {
        stepId: 'rival_1',
        title: '⚔️ A Challenger Appears',
        description: 'A charismatic figure has started a competing movement. They\'re stealing your talking points and your followers.',
        options: [
          {
            text: 'Challenge them to a public debate',
            outcome: {
              cloutDelta: 15,
              riskDelta: 10,
              message: 'The challenge is issued. The internet is buzzing.'
            },
            nextStep: 'rival_2_debate'
          },
          {
            text: 'Expose their inconsistencies',
            outcome: {
              cloutDelta: 20,
              supportDelta: { 'ALL': -2 },
              riskDelta: 8,
              message: 'You dig up dirt. Some see it as principled, others as petty.'
            },
            nextStep: 'rival_2_expose'
          },
          {
            text: 'Ignore them completely',
            outcome: {
              cloutDelta: -10,
              supportDelta: { 'ALL': -3 },
              message: 'Your silence is seen as weakness. They gain ground.'
            },
            nextStep: 'rival_2_ignore'
          }
        ]
      },
      {
        stepId: 'rival_2_debate',
        title: '⚔️ The Great Debate',
        description: 'Millions are watching the live debate. This is your moment.',
        options: [
          {
            text: 'Go for the knockout',
            outcome: {
              cloutDelta: 40,
              supportDelta: { 'ALL': 8 },
              riskDelta: 5,
              message: 'You dominated! Clips of your best moments go viral.'
            }
          },
          {
            text: 'Take the high road',
            outcome: {
              cloutDelta: 25,
              supportDelta: { 'ALL': 5 },
              riskDelta: -5,
              message: 'You came across as the mature one. Moderates impressed.'
            }
          },
          {
            text: 'Propose an alliance mid-debate',
            outcome: {
              cloutDelta: 30,
              supportDelta: { 'ALL': 6 },
              fundsDelta: -20,
              message: 'The shocking twist! You merge movements and dominate together.'
            }
          }
        ]
      },
      {
        stepId: 'rival_2_expose',
        title: '⚔️ Dirty Laundry',
        description: 'Your opposition research found something juicy. Their past isn\'t clean.',
        options: [
          {
            text: 'Release it all',
            outcome: {
              cloutDelta: 25,
              supportDelta: { 'ALL': 5 },
              riskDelta: 15,
              message: 'Their reputation is shattered. But you look ruthless.'
            }
          },
          {
            text: 'Use it as leverage',
            outcome: {
              fundsDelta: 30,
              cloutDelta: 10,
              riskDelta: 5,
              message: 'They back off quietly. You got what you wanted.'
            }
          }
        ]
      },
      {
        stepId: 'rival_2_ignore',
        title: '⚔️ Growing Threat',
        description: 'The rival movement has doubled in size. Ignoring them didn\'t work.',
        options: [
          {
            text: 'Finally engage',
            outcome: {
              cloutDelta: 15,
              riskDelta: 10,
              message: 'Better late than never. The battle begins.'
            },
            nextStep: 'rival_2_debate'
          },
          {
            text: 'Focus on your core base',
            outcome: {
              supportDelta: { 'ALL': 3 },
              cloutDelta: 5,
              message: 'You double down on loyal supporters. Quality over quantity.'
            }
          }
        ]
      }
    ]
  },

  // =========================
  // CHAIN 3: The Funding Crisis
  // =========================
  {
    chainId: 'funding_crisis',
    name: 'Financial Reckoning',
    category: 'economic',
    minTurn: 8,
    triggerChance: 0.10,
    steps: [
      {
        stepId: 'funding_1',
        title: '💰 Payment Processor Ban',
        description: 'Your main payment processor just terminated your account. Donations have stopped.',
        options: [
          {
            text: 'Find alternative processors',
            outcome: {
              fundsDelta: -30,
              riskDelta: 5,
              message: 'The search is costly and time-consuming.'
            },
            nextStep: 'funding_2_alternatives'
          },
          {
            text: 'Launch crypto donations',
            outcome: {
              fundsDelta: 20,
              cloutDelta: 15,
              riskDelta: 10,
              message: 'Crypto bros love this. Traditional supporters confused.'
            },
            nextStep: 'funding_2_crypto'
          },
          {
            text: 'Sue for discrimination',
            outcome: {
              fundsDelta: -60,
              cloutDelta: 25,
              riskDelta: -5,
              message: 'The lawsuit generates headlines and sympathy donations.'
            },
            nextStep: 'funding_2_lawsuit'
          }
        ]
      },
      {
        stepId: 'funding_2_alternatives',
        title: '💰 New Options Emerge',
        description: 'Several smaller processors are willing to work with you, but with higher fees.',
        options: [
          {
            text: 'Accept the higher fees',
            outcome: {
              fundsDelta: 30,
              riskDelta: 3,
              message: 'Money flows again, though margins are thinner.'
            }
          },
          {
            text: 'Build your own payment system',
            outcome: {
              fundsDelta: -50,
              cloutDelta: 20,
              riskDelta: -10,
              message: 'Expensive but now you can\'t be deplatformed again.'
            }
          }
        ]
      },
      {
        stepId: 'funding_2_crypto',
        title: '💰 Crypto Complications',
        description: 'Crypto donations are up 300% but there\'s a catch - volatile prices and regulatory scrutiny.',
        options: [
          {
            text: 'Go all in on crypto',
            outcome: {
              fundsDelta: 50,
              riskDelta: 15,
              cloutDelta: 20,
              message: 'You\'re the crypto movement now. For better or worse.'
            }
          },
          {
            text: 'Diversify carefully',
            outcome: {
              fundsDelta: 25,
              riskDelta: 5,
              message: 'A balanced approach. Crypto supplements but doesn\'t replace.'
            }
          }
        ]
      },
      {
        stepId: 'funding_2_lawsuit',
        title: '💰 Legal Victory?',
        description: 'The lawsuit is gaining traction. The processor wants to settle.',
        options: [
          {
            text: 'Accept the settlement',
            outcome: {
              fundsDelta: 100,
              cloutDelta: 15,
              message: 'A significant payout! Plus they have to process your donations again.'
            }
          },
          {
            text: 'Push for a full trial',
            outcome: {
              fundsDelta: -30,
              cloutDelta: 40,
              supportDelta: { 'ALL': 5 },
              riskDelta: 10,
              message: 'The trial becomes a national story about deplatforming.'
            }
          }
        ]
      }
    ]
  },

  // =========================
  // CHAIN 4: The Scandal
  // =========================
  {
    chainId: 'scandal',
    name: 'Internal Scandal',
    category: 'political',
    minTurn: 10,
    triggerChance: 0.08,
    steps: [
      {
        stepId: 'scandal_1',
        title: '🚨 Accusation Surfaces',
        description: 'A former member is accusing a key figure in your movement of misconduct. The media is calling.',
        options: [
          {
            text: 'Investigate internally first',
            outcome: {
              fundsDelta: -20,
              riskDelta: 5,
              message: 'You buy time but journalists are digging.'
            },
            nextStep: 'scandal_2_investigate'
          },
          {
            text: 'Defend your colleague publicly',
            outcome: {
              cloutDelta: -10,
              supportDelta: { 'ALL': -3 },
              riskDelta: 15,
              message: 'Loyalty is valued but you\'re now tied to their fate.'
            },
            nextStep: 'scandal_2_defend'
          },
          {
            text: 'Cut ties immediately',
            outcome: {
              cloutDelta: 15,
              supportDelta: { 'ALL': 2 },
              riskDelta: -10,
              message: 'Swift action. Some call it principled, others say betrayal.'
            }
          }
        ]
      },
      {
        stepId: 'scandal_2_investigate',
        title: '🚨 Investigation Findings',
        description: 'Your internal investigation found mixed evidence. Not conclusive either way.',
        options: [
          {
            text: 'Release the findings transparently',
            outcome: {
              cloutDelta: 20,
              riskDelta: 5,
              message: 'Transparency earns respect. The story becomes nuanced.'
            }
          },
          {
            text: 'Part ways quietly',
            outcome: {
              cloutDelta: 5,
              riskDelta: -5,
              message: 'A quiet exit. The story loses steam.'
            }
          },
          {
            text: 'Stand by them despite ambiguity',
            outcome: {
              supportDelta: { 'ALL': -4 },
              cloutDelta: -15,
              riskDelta: 10,
              message: 'Your loyalty is seen as enabling by many.'
            }
          }
        ]
      },
      {
        stepId: 'scandal_2_defend',
        title: '🚨 Evidence Emerges',
        description: 'More accusers came forward. The evidence is damning.',
        options: [
          {
            text: 'Reverse course immediately',
            outcome: {
              cloutDelta: -20,
              supportDelta: { 'ALL': -5 },
              riskDelta: 15,
              message: 'The flip-flop hurts. Critics say you enabled too long.'
            }
          },
          {
            text: 'Claim you were deceived',
            outcome: {
              cloutDelta: 5,
              supportDelta: { 'ALL': -2 },
              riskDelta: 5,
              message: 'Playing the victim of deception. Mixed reception.'
            }
          }
        ]
      }
    ]
  },

  // =========================
  // CHAIN 5: The Political Opportunity
  // =========================
  {
    chainId: 'political_run',
    name: 'The Political Gambit',
    category: 'political',
    minTurn: 12,
    triggerChance: 0.10,
    steps: [
      {
        stepId: 'political_1',
        title: '🏛️ Run for Office?',
        description: 'Party operatives are urging you to run for Congress. Your movement has real political capital.',
        options: [
          {
            text: 'Announce candidacy',
            outcome: {
              cloutDelta: 40,
              fundsDelta: -50,
              riskDelta: 20,
              message: 'You\'re officially in the race! The stakes have never been higher.'
            },
            nextStep: 'political_2_campaign'
          },
          {
            text: 'Endorse a candidate instead',
            outcome: {
              cloutDelta: 25,
              supportDelta: { 'ALL': 5 },
              riskDelta: 5,
              message: 'Your endorsement carries weight. The candidate owes you.'
            }
          },
          {
            text: 'Stay a movement leader',
            outcome: {
              cloutDelta: 10,
              riskDelta: -10,
              message: 'You keep your outsider credibility. Politics can wait.'
            }
          }
        ]
      },
      {
        stepId: 'political_2_campaign',
        title: '🏛️ Campaign Trail',
        description: 'The campaign is in full swing. Polls show a tight race.',
        options: [
          {
            text: 'Go negative on opponent',
            outcome: {
              supportDelta: { 'ALL': 6 },
              cloutDelta: 20,
              riskDelta: 15,
              message: 'Attack ads work. But you\'ve made enemies.'
            },
            nextStep: 'political_3'
          },
          {
            text: 'Stay positive, policy-focused',
            outcome: {
              supportDelta: { 'ALL': 4 },
              cloutDelta: 15,
              riskDelta: 5,
              message: 'The high road. Moderates are impressed.'
            },
            nextStep: 'political_3'
          },
          {
            text: 'Mobilize online army',
            outcome: {
              supportDelta: { 'ALL': 8 },
              cloutDelta: 30,
              riskDelta: 25,
              message: 'Your followers flood the discourse. Effective but controversial.'
            },
            nextStep: 'political_3'
          }
        ]
      },
      {
        stepId: 'political_3',
        title: '🏛️ Election Night',
        description: 'The votes are being counted. It\'s coming down to the wire.',
        options: [
          {
            text: 'Declare victory early',
            outcome: {
              cloutDelta: 35,
              supportDelta: { 'ALL': 10 },
              riskDelta: 10,
              message: 'Bold move pays off! You won by a narrow margin. History made.'
            }
          },
          {
            text: 'Wait for official results',
            outcome: {
              cloutDelta: 25,
              supportDelta: { 'ALL': 7 },
              riskDelta: 5,
              message: 'A close race but you pulled through. Legitimacy intact.'
            }
          }
        ]
      }
    ]
  }
];

// Track active chains
interface ActiveChain {
  chainId: string;
  currentStep: string;
  startedTurn: number;
}

let activeChains: ActiveChain[] = [];

// Get current active chain event if any
export function getActiveChainEvent(state: GameState): ChainedGameEvent | null {
  if (activeChains.length === 0) return null;

  const active = activeChains[0];
  const chain = EVENT_CHAINS.find(c => c.chainId === active.chainId);
  if (!chain) return null;

  const step = chain.steps.find(s => s.stepId === active.currentStep);
  if (!step) return null;

  return {
    title: step.title,
    description: step.description,
    options: step.options.map(opt => ({
      text: opt.text,
      outcome: opt.outcome
    })),
    chainId: active.chainId,
    stepId: active.currentStep,
    isChainEvent: true
  };
}

// Try to start a new chain based on game state
export function tryStartChain(state: GameState): ChainedGameEvent | null {
  // Don't start new chains if one is active
  if (activeChains.length > 0) return null;

  // Filter eligible chains
  const eligible = EVENT_CHAINS.filter(chain => {
    if (state.turn < chain.minTurn) return false;
    if (Math.random() > chain.triggerChance) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  // Select random eligible chain
  const selected = eligible[Math.floor(Math.random() * eligible.length)];
  const firstStep = selected.steps[0];

  // Start the chain
  activeChains.push({
    chainId: selected.chainId,
    currentStep: firstStep.stepId,
    startedTurn: state.turn
  });

  return {
    title: firstStep.title,
    description: firstStep.description,
    options: firstStep.options.map(opt => ({
      text: opt.text,
      outcome: opt.outcome
    })),
    chainId: selected.chainId,
    stepId: firstStep.stepId,
    isChainEvent: true
  };
}

// Progress chain based on choice
export function progressChain(chainId: string, optionIndex: number): string | null {
  const activeIndex = activeChains.findIndex(c => c.chainId === chainId);
  if (activeIndex === -1) return null;

  const active = activeChains[activeIndex];
  const chain = EVENT_CHAINS.find(c => c.chainId === chainId);
  if (!chain) return null;

  const currentStep = chain.steps.find(s => s.stepId === active.currentStep);
  if (!currentStep) return null;

  const selectedOption = currentStep.options[optionIndex];
  if (!selectedOption) return null;

  // Check if chain continues
  if (selectedOption.nextStep) {
    active.currentStep = selectedOption.nextStep;
    return selectedOption.nextStep;
  } else {
    // Chain ends
    activeChains.splice(activeIndex, 1);
    return null;
  }
}

// Reset all chain tracking
export function resetChainTracking(): void {
  activeChains = [];
}

// Check if a chain is active
export function hasActiveChain(): boolean {
  return activeChains.length > 0;
}
