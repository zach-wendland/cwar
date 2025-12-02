// generators.ts - simulate content generation (events, advisors, social posts) via LLM or static logic

import { GameState, GameEvent, Advisor, Tweet } from './GameContext';

// Generate advisors using prompt-based templates (static fallback for MVP)
export function generateAdvisors(): Advisor[] {
  return [
    {
      id: 'mike_memelord',
      name: 'Mike "MemeLord" Miller',
      role: 'Social Media Strategist',
      ideology: 'Chaotic Neutral Meme Sorcerer',
      traits: 'Former meme lord turned campaign strategist, irreverent and witty',
      quotes: [
        'We memed the establishment into oblivion.',
        'If it isn\'t viral, it didn\'t happen.',
        'They can\'t ban us all... right?'
      ],
      loyalty: 70,
      morale: 80,
      specialization: 'social',
      bonuses: {
        cloutBonus: 25,
        supportBonus: 10
      },
      ability: {
        id: 'viral_boost',
        name: 'Viral Boost',
        description: 'Create a mega-viral campaign that spreads like wildfire',
        cooldown: 5,
        currentCooldown: 0,
        perform: (state: GameState) => ({
          cloutDelta: 30,
          supportDelta: { 'ALL': 5 },
          riskDelta: 10,
          message: 'Viral campaign reached millions!'
        })
      },
      hired: true,
      hireCost: 0
    },
    {
      id: 'dana_data',
      name: 'Dana Data',
      role: 'Analytics Guru',
      ideology: 'Pragmatic Technocrat',
      traits: 'Data-driven strategist who trusts numbers over gut feelings',
      quotes: [
        'Numbers never lie, but politicians do.',
        'Viral content is just a data point trending upward.',
        'In meme wars, I bring the spreadsheets.'
      ],
      loyalty: 75,
      morale: 70,
      specialization: 'analytics',
      bonuses: {
        riskReduction: 20,
        supportBonus: 15
      },
      ability: {
        id: 'targeted_analytics',
        name: 'Targeted Analytics',
        description: 'Use data to identify and target weak points',
        cooldown: 4,
        currentCooldown: 0,
        perform: (state: GameState) => {
          const lowestStates = Object.keys(state.support)
            .sort((a, b) => state.support[a] - state.support[b])
            .slice(0, 5);
          const supportDelta: { [state: string]: number } = {};
          lowestStates.forEach(s => { supportDelta[s] = 15; });
          return {
            supportDelta,
            riskDelta: -5,
            message: 'Analytics reveal key opportunities in 5 states'
          };
        }
      },
      hired: true,
      hireCost: 0
    },
    {
      id: 'riley_rebel',
      name: 'Riley Rebel',
      role: 'Grassroots Organizer',
      ideology: 'Radical Idealist',
      traits: 'Street protest veteran who adapted to digital activism',
      quotes: [
        'I was organizing rallies before it was cool.',
        'Memes are the new street murals.',
        'The revolution will be livestreamed.'
      ],
      loyalty: 65,
      morale: 85,
      specialization: 'grassroots',
      bonuses: {
        supportBonus: 20,
        fundsBonus: 10
      },
      ability: {
        id: 'mass_mobilization',
        name: 'Mass Mobilization',
        description: 'Organize simultaneous rallies across multiple regions',
        cooldown: 6,
        currentCooldown: 0,
        perform: (state: GameState) => ({
          supportDelta: { 'ALL': 8 },
          fundsDelta: 50,
          riskDelta: 8,
          message: 'Grassroots rallies energize the movement nationwide!'
        })
      },
      hired: false,
      hireCost: 80
    },
    {
      id: 'victor_venture',
      name: 'Victor Venture',
      role: 'Fundraising Expert',
      ideology: 'Capitalist Opportunist',
      traits: 'Smooth-talking fundraiser with deep-pocketed connections',
      quotes: [
        'Money talks, and I\'m fluent.',
        'Every donor is just a pitch away.',
        'The culture war runs on capital, not just memes.'
      ],
      loyalty: 50,
      morale: 60,
      specialization: 'fundraising',
      bonuses: {
        fundsBonus: 50,
        cloutBonus: 10
      },
      ability: {
        id: 'fundraising_blitz',
        name: 'Fundraising Blitz',
        description: 'Host exclusive fundraising events to maximize donations',
        cooldown: 4,
        currentCooldown: 0,
        perform: (state: GameState) => ({
          fundsDelta: 200,
          cloutDelta: 15,
          riskDelta: 3,
          message: 'Fundraising blitz brings in major donations!'
        })
      },
      hired: false,
      hireCost: 100
    },
    {
      id: 'shadow_ops',
      name: 'Shadow "Ops" O\'Brien',
      role: 'Covert Operations Specialist',
      ideology: 'Pragmatic Machiavellian',
      traits: 'Former intelligence operative with questionable ethics',
      quotes: [
        'The end justifies the memes.',
        'What they don\'t know won\'t hurt us.',
        'In the shadows, we thrive.'
      ],
      loyalty: 60,
      morale: 75,
      specialization: 'social',
      bonuses: {
        cloutBonus: 15,
        riskReduction: 15
      },
      ability: {
        id: 'dark_ops',
        name: 'Dark Operations',
        description: 'Deploy covert tactics to undermine opposition',
        cooldown: 5,
        currentCooldown: 0,
        perform: (state: GameState) => ({
          supportDelta: { 'ALL': 10 },
          riskDelta: 20,
          cloutDelta: -10,
          message: 'Covert operations successful, but at a cost to reputation'
        })
      },
      hired: false,
      hireCost: 120
    }
  ];
}

// Generate a satirical in-game event (could integrate an LLM API in a real implementation)
export function generateEvent(state: GameState): GameEvent {
  const eventPool: GameEvent[] = [
    // Narrative events (no choices)
    {
      title: '#SealTheSteel Goes Viral',
      description: 'Your recent meme campaign hashtag #SealTheSteel has exploded in popularity, gaining mainstream media attention.',
      options: [],
      outcome: {
        cloutDelta: 20,
        supportDelta: { 'ALL': 2 },
        message: 'The viral hashtag greatly boosted your movement\'s clout and gave a small bump to support everywhere.'
      }
    },
    {
      title: 'Opposition Splits',
      description: 'Internal conflicts cause a major opposition group to fragment, reducing their effectiveness.',
      options: [],
      outcome: {
        supportDelta: { 'ALL': 3 },
        riskDelta: -5,
        message: 'Opposition infighting creates an opening for your movement to expand.'
      }
    },
    {
      title: 'Unexpected Endorsement',
      description: 'A prominent celebrity unexpectedly endorses your movement on social media.',
      options: [],
      outcome: {
        cloutDelta: 35,
        supportDelta: { 'ALL': 4 },
        riskDelta: 8,
        message: 'The celebrity endorsement brings massive attention and new supporters!'
      }
    },
    // Interactive events
    {
      title: 'Campus Free Speech Showdown',
      description: 'A university banned a speaker aligned with your movement, sparking nationwide debate.',
      options: [
        {
          text: 'Condemn the university publicly',
          outcome: {
            supportDelta: { 'ALL': 2 },
            riskDelta: 5,
            message: 'Your bold stance rallies free-speech supporters nationwide, but also draws increased scrutiny.'
          }
        },
        {
          text: 'Launch a meme campaign mocking the ban',
          outcome: {
            cloutDelta: 10,
            supportDelta: { 'ALL': 1 },
            riskDelta: 2,
            message: 'Your memes turn the incident into a viral joke, boosting clout with minimal fallout.'
          }
        },
        {
          text: 'Stay out of the controversy',
          outcome: {
            riskDelta: -5,
            message: 'You decide to stay out of it, avoiding controversy and reducing risk, but missing a chance to gain support.'
          }
        }
      ]
    },
    {
      title: 'Platform Moderation Crisis',
      description: 'A major social media platform announces new content moderation policies that could affect your movement.',
      options: [
        {
          text: 'Organize a protest campaign',
          outcome: {
            cloutDelta: 15,
            riskDelta: 15,
            supportDelta: { 'ALL': 3 },
            message: 'The protest campaign energizes supporters but puts you on the platform\'s radar.'
          }
        },
        {
          text: 'Adapt messaging to comply',
          outcome: {
            riskDelta: -10,
            cloutDelta: -5,
            message: 'Adapting your message reduces risk but disappoints some supporters who wanted defiance.'
          }
        },
        {
          text: 'Migrate to alternative platforms',
          outcome: {
            cloutDelta: -10,
            supportDelta: { 'ALL': -2 },
            riskDelta: -15,
            fundsDelta: -30,
            message: 'Moving platforms reduces reach short-term but establishes presence on censorship-resistant alternatives.'
          }
        }
      ]
    },
    {
      title: 'Donor Scandal',
      description: 'A major donor to your movement is embroiled in a public scandal.',
      options: [
        {
          text: 'Distance yourself immediately',
          outcome: {
            fundsDelta: -50,
            riskDelta: -8,
            cloutDelta: -10,
            message: 'Cutting ties protects your reputation but costs significant funding.'
          }
        },
        {
          text: 'Stand by them',
          outcome: {
            fundsDelta: 100,
            riskDelta: 20,
            supportDelta: { 'ALL': -3 },
            message: 'Loyalty is rewarded financially, but public perception suffers.'
          }
        },
        {
          text: 'Issue vague statement',
          outcome: {
            riskDelta: 5,
            cloutDelta: -5,
            message: 'Your non-committal response satisfies no one but avoids worst outcomes.'
          }
        }
      ]
    },
    {
      title: 'Regional Controversy',
      description: 'Your movement becomes embroiled in a regional controversy in the ' +
                   (state.regions.find(r => r.influence > 20)?.name || 'Northeast') + '.',
      options: [
        {
          text: 'Double down on presence',
          outcome: {
            supportDelta: Object.fromEntries(
              (state.regions.find(r => r.influence > 20)?.states || state.regions[0].states)
                .map(s => [s, 8])
            ),
            riskDelta: 12,
            fundsDelta: -40,
            message: 'Intensifying regional efforts pays off but at significant cost.'
          }
        },
        {
          text: 'Pull back and regroup',
          outcome: {
            riskDelta: -8,
            cloutDelta: -15,
            message: 'Strategic retreat reduces pressure but looks weak to supporters.'
          }
        }
      ]
    },
    {
      title: 'Grassroots Uprising',
      description: 'Spontaneous grassroots supporters organize rallies without your coordination.',
      options: [
        {
          text: 'Embrace and amplify',
          outcome: {
            supportDelta: { 'ALL': 5 },
            cloutDelta: 20,
            riskDelta: 10,
            message: 'Embracing the grassroots energy amplifies your movement significantly!'
          }
        },
        {
          text: 'Try to control messaging',
          outcome: {
            supportDelta: { 'ALL': 2 },
            riskDelta: 3,
            cloutDelta: -5,
            message: 'Attempting control maintains message discipline but dampens grassroots enthusiasm.'
          }
        },
        {
          text: 'Observe without interfering',
          outcome: {
            supportDelta: { 'ALL': 3 },
            riskDelta: 7,
            message: 'Letting grassroots develop organically shows trust but is unpredictable.'
          }
        }
      ]
    },
    {
      title: 'Advisor Conflict',
      description: 'Two of your advisors have a major disagreement about campaign strategy.',
      options: [
        {
          text: 'Side with the analytics approach',
          outcome: {
            riskDelta: -5,
            cloutDelta: 5,
            message: 'Data-driven approach reduces risk but some advisors question your vision.'
          }
        },
        {
          text: 'Side with the bold approach',
          outcome: {
            supportDelta: { 'ALL': 4 },
            riskDelta: 10,
            cloutDelta: 15,
            message: 'Bold strategy excites supporters but increases exposure.'
          }
        },
        {
          text: 'Force them to compromise',
          outcome: {
            supportDelta: { 'ALL': 1 },
            riskDelta: 2,
            message: 'Compromise satisfies no one but maintains team cohesion.'
          }
        }
      ]
    }
  ];

  // Filter events based on state conditions
  const viableEvents = eventPool.filter(event => {
    // Some events only make sense with certain state conditions
    if (event.title.includes('Regional') && !state.regions.some(r => r.influence > 20)) {
      return false;
    }
    return true;
  });

  // Return a random event from the viable pool
  return viableEvents[Math.floor(Math.random() * viableEvents.length)];
}

// Generate fake social media posts reacting to the player's last action
export function generateTweets(lastActionName: string): Tweet[] {
  // Example prompt: "Write 3 humorous fictional tweets reacting to the player's last move: <lastActionName>"
  const handles = ['@Anon123', '@MemeQueen', '@TruthHurts', '@SnarkyGuy', '@FanGirl'];
  const randomHandle = () => handles[Math.floor(Math.random() * handles.length)];

  return [
    {
      user: randomHandle(),
      content: `Can't believe they just did "${lastActionName}". This is wild! #CultureWar`
    },
    {
      user: randomHandle(),
      content: `${lastActionName} might just change the game... or completely flop. 🤔`
    },
    {
      user: randomHandle(),
      content: `Everyone's talking about "${lastActionName}" now. The movement sure knows how to stay in the spotlight!`
    }
  ];
}
