// generators.ts - simulate content generation (events, advisors, social posts) via LLM or static logic

import { GameState, GameEvent, Advisor, Tweet } from './GameContext';

// Generate advisors using prompt-based templates (static fallback for MVP)
export function generateAdvisors(): Advisor[] {
  // Example prompt: "Create a fictional political advisor NPC who is an ex-meme lord turned campaign strategist. Give them a name, role, ideology, traits, and 3 sample quotes."
  return [
    {
      name: 'Mike "MemeLord" Miller',
      role: 'Social Media Strategist',
      ideology: 'Chaotic Neutral Meme Sorcerer',
      traits: 'Former meme lord turned campaign strategist, irreverent and witty',
      quotes: [
        'We memed the establishment into oblivion.',
        'If it isn\'t viral, it didn\'t happen.',
        'They can\'t ban us all... right?'
      ]
    },
    {
      name: 'Dana Data',
      role: 'Analytics Guru',
      ideology: 'Pragmatic Technocrat',
      traits: 'Data-driven strategist who trusts numbers over gut feelings',
      quotes: [
        'Numbers never lie, but politicians do.',
        'Viral content is just a data point trending upward.',
        'In meme wars, I bring the spreadsheets.'
      ]
    },
    {
      name: 'Riley Rebel',
      role: 'Grassroots Organizer',
      ideology: 'Radical Idealist',
      traits: 'Street protest veteran who adapted to digital activism',
      quotes: [
        'I was organizing rallies before it was cool.',
        'Memes are the new street murals.',
        'The revolution will be livestreamed.'
      ]
    }
  ];
}

// Generate a satirical in-game event (could integrate an LLM API in a real implementation)
export function generateEvent(state: GameState): GameEvent {
  // 50% chance to return a narrative event vs an interactive event
  if (Math.random() < 0.5) {
    return {
      title: '#SealTheSteel Goes Viral',
      description: 'Your recent meme campaign hashtag #SealTheSteel has exploded in popularity, gaining mainstream media attention.',
      options: [],  // no player choice (narrative event)
      outcome: {
        cloutDelta: 20,
        supportDelta: { 'ALL': 2 },
        message: 'The viral hashtag greatly boosted your movement\'s clout and gave a small bump to support everywhere.',
        rewardTier: 'high',
        tone: 'positive'
      }
    };
  }
  // Example interactive event prompt: "Generate a satirical in-game event involving a controversy on college campuses about free speech. Include headline, description, and 2-3 options with outcomes."
  const event: GameEvent = {
    title: 'Campus Free Speech Showdown',
    description: 'A university banned a speaker aligned with your movement, sparking nationwide debate.',
    options: [
      {
        text: 'Condemn the university publicly',
        outcome: {
          supportDelta: { 'ALL': 2 },  // boost support broadly among free-speech advocates
          riskDelta: 5,
          message: 'Your bold stance rallies free-speech supporters nationwide, but also draws increased scrutiny.',
          rewardTier: 'high',
          tone: 'risky'
        }
      },
      {
        text: 'Launch a meme campaign mocking the ban',
        outcome: {
          cloutDelta: 10,
          supportDelta: { 'ALL': 1 },
          riskDelta: 2,
          message: 'Your memes turn the incident into a viral joke, boosting clout with minimal fallout.',
          rewardTier: 'high',
          tone: 'positive'
        }
      },
      {
        text: 'Stay out of the controversy',
        outcome: {
          riskDelta: -5,
          message: 'You decide to stay out of it, avoiding controversy and reducing risk, but missing a chance to gain support.',
          rewardTier: 'low',
          tone: 'neutral'
        }
      }
    ]
  };
  return event;
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
