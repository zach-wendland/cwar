// generators.ts - simulate content generation (events, advisors, social posts) via LLM or static logic

import { GameState, GameEvent, Advisor, Tweet } from './GameContext';
import {
  FactionReaction,
  SentimentState,
  FACTION_DISPLAY_NAMES,
  MOOD_THRESHOLDS,
  MoodLevel,
} from './sentimentEngine';

// Event categories for organization and weighting
export type EventCategory = 'tech' | 'media' | 'political' | 'economic' | 'cultural';

// Extended event interface with metadata
interface EventTemplate {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  minTurn?: number;       // Earliest turn this can appear
  maxRisk?: number;       // Only appears if risk is below this
  minSupport?: number;    // Only appears if avg support is above this
  options?: Array<{
    text: string;
    outcome: {
      supportDelta?: { [state: string]: number };
      cloutDelta?: number;
      fundsDelta?: number;
      riskDelta?: number;
      message?: string;
    };
  }>;
  outcome?: {
    supportDelta?: { [state: string]: number };
    cloutDelta?: number;
    fundsDelta?: number;
    riskDelta?: number;
    message?: string;
  };
}

// ============================================================================
// EVENT POOL: 25+ diverse events organized by category
// ============================================================================

const EVENT_POOL: EventTemplate[] = [
  // =========================
  // TECH EVENTS (5)
  // =========================
  {
    id: 'algorithm_change',
    category: 'tech',
    title: 'Algorithm Apocalypse',
    description: 'A major social platform just changed its algorithm. Your content reach has dropped 60% overnight.',
    options: [
      {
        text: 'Pivot to short-form video content',
        outcome: {
          fundsDelta: -20,
          cloutDelta: 15,
          riskDelta: 3,
          message: 'The pivot costs money but your videos are getting traction on the new algorithm.'
        }
      },
      {
        text: 'Rally followers to a new platform',
        outcome: {
          supportDelta: { 'ALL': -2 },
          cloutDelta: 25,
          riskDelta: -5,
          message: 'You lose some casual followers but your core base migrates, reducing platform dependency.'
        }
      },
      {
        text: 'Pay for promoted posts',
        outcome: {
          fundsDelta: -40,
          supportDelta: { 'ALL': 3 },
          riskDelta: 5,
          message: 'Expensive, but your message is reaching new audiences again.'
        }
      }
    ]
  },
  {
    id: 'platform_ban_threat',
    category: 'tech',
    title: 'Shadowban Warning',
    description: 'Internal sources say your accounts are flagged for review. A ban could be imminent.',
    minTurn: 3,
    options: [
      {
        text: 'Self-censor controversial content',
        outcome: {
          riskDelta: -15,
          cloutDelta: -10,
          message: 'Playing it safe reduces risk but your edgier supporters are disappointed.'
        }
      },
      {
        text: 'Double down and go viral before the ban',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 20,
          riskDelta: 20,
          message: 'Your defiant content explodes but you\'re now on borrowed time.'
        }
      },
      {
        text: 'Preemptively archive everything',
        outcome: {
          fundsDelta: -15,
          riskDelta: -8,
          message: 'Smart move. Your content is backed up and you\'ve reduced exposure.'
        }
      }
    ]
  },
  {
    id: 'viral_moment',
    category: 'tech',
    title: '#YourHashtag is Trending!',
    description: 'One of your posts hit the algorithm jackpot. You\'re trending worldwide!',
    outcome: {
      cloutDelta: 30,
      supportDelta: { 'ALL': 4 },
      riskDelta: 8,
      message: 'Massive exposure brings massive scrutiny, but your influence has grown significantly.'
    }
  },
  {
    id: 'data_leak',
    category: 'tech',
    title: 'Data Breach Scandal',
    description: 'A platform breach exposed user data. Some are blaming movements like yours for security risks.',
    options: [
      {
        text: 'Blame the platform loudly',
        outcome: {
          cloutDelta: 10,
          supportDelta: { 'ALL': 2 },
          riskDelta: 5,
          message: 'Deflecting blame works. Your supporters appreciate the corporate criticism.'
        }
      },
      {
        text: 'Offer privacy guidance to followers',
        outcome: {
          cloutDelta: 15,
          riskDelta: -3,
          message: 'Being helpful builds trust and shows you care about your community.'
        }
      }
    ]
  },
  {
    id: 'ai_controversy',
    category: 'tech',
    title: 'AI-Generated Controversy',
    description: 'Someone used AI to create fake content "from" your movement. It\'s spreading fast.',
    options: [
      {
        text: 'Debunk it with receipts',
        outcome: {
          fundsDelta: -10,
          cloutDelta: 20,
          riskDelta: -5,
          message: 'Your thorough debunking goes viral. People respect your transparency.'
        }
      },
      {
        text: 'Ignore it and let it blow over',
        outcome: {
          supportDelta: { 'ALL': -3 },
          riskDelta: 10,
          message: 'The fake content keeps spreading. Some people believe it\'s real.'
        }
      },
      {
        text: 'Embrace the chaos and meme it',
        outcome: {
          cloutDelta: 25,
          riskDelta: 8,
          message: 'Your ironic take confuses critics and delights supporters.'
        }
      }
    ]
  },

  // =========================
  // MEDIA EVENTS (5)
  // =========================
  {
    id: 'celebrity_endorsement',
    category: 'media',
    title: 'Celebrity Endorsement!',
    description: 'A B-list celebrity just publicly endorsed your movement on their podcast.',
    minTurn: 2,
    options: [
      {
        text: 'Amplify and collaborate',
        outcome: {
          cloutDelta: 25,
          supportDelta: { 'ALL': 4 },
          fundsDelta: -20,
          riskDelta: 5,
          message: 'The collab brings new audiences but also new critics.'
        }
      },
      {
        text: 'Accept graciously but keep distance',
        outcome: {
          cloutDelta: 10,
          supportDelta: { 'ALL': 2 },
          message: 'A measured response that doesn\'t tie you too closely to their reputation.'
        }
      }
    ]
  },
  {
    id: 'investigative_report',
    category: 'media',
    title: 'Investigative Exposé Incoming',
    description: 'A journalist is working on a hit piece about your movement. Sources say it drops next week.',
    minTurn: 5,
    options: [
      {
        text: 'Get ahead of it with your own narrative',
        outcome: {
          fundsDelta: -30,
          cloutDelta: 15,
          riskDelta: 5,
          message: 'Your preemptive strike frames the story before they can.'
        }
      },
      {
        text: 'Lawyer up and send cease & desist',
        outcome: {
          fundsDelta: -50,
          riskDelta: -10,
          message: 'Legal pressure delays the piece and waters it down.'
        }
      },
      {
        text: 'Let it drop and mobilize outrage',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 20,
          riskDelta: 15,
          message: 'Playing the victim rallies your base but the story still hurts.'
        }
      }
    ]
  },
  {
    id: 'fact_check',
    category: 'media',
    title: 'Fact-Check Fiasco',
    description: 'A fact-checker labeled your most popular post as "misleading." It\'s being suppressed.',
    options: [
      {
        text: 'Appeal the fact-check formally',
        outcome: {
          riskDelta: -5,
          cloutDelta: 5,
          message: 'The appeal process is slow but shows you play by the rules.'
        }
      },
      {
        text: 'Rally against fact-checkers as biased',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 15,
          riskDelta: 10,
          message: 'Your base loves the anti-establishment angle. Critics call it dangerous.'
        }
      },
      {
        text: 'Quietly delete and move on',
        outcome: {
          cloutDelta: -5,
          riskDelta: -8,
          message: 'Discretion is the better part of valor. The story fades.'
        }
      }
    ]
  },
  {
    id: 'interview_opportunity',
    category: 'media',
    title: 'Prime Time Interview Offer',
    description: 'A major news network wants to interview your spokesperson. This could make or break you.',
    minSupport: 20,
    options: [
      {
        text: 'Accept with full media training prep',
        outcome: {
          fundsDelta: -25,
          supportDelta: { 'ALL': 6 },
          cloutDelta: 30,
          riskDelta: 8,
          message: 'The interview goes well. You looked professional and reached millions.'
        }
      },
      {
        text: 'Accept but keep it unscripted',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 15,
          riskDelta: 15,
          message: 'Authenticity has its risks. Some moments were golden, others... less so.'
        }
      },
      {
        text: 'Decline and cite media bias',
        outcome: {
          cloutDelta: 10,
          riskDelta: -5,
          message: 'Your base appreciates the principled stance. Critics say you\'re hiding.'
        }
      }
    ]
  },
  {
    id: 'documentary',
    category: 'media',
    title: 'Documentary Deal',
    description: 'A streaming service wants to produce a documentary about your movement.',
    minTurn: 8,
    minSupport: 30,
    options: [
      {
        text: 'Full cooperation with editorial control',
        outcome: {
          fundsDelta: 50,
          cloutDelta: 40,
          supportDelta: { 'ALL': 5 },
          riskDelta: 10,
          message: 'The documentary is a hit! New supporters pour in.'
        }
      },
      {
        text: 'Limited access, maintain mystique',
        outcome: {
          fundsDelta: 20,
          cloutDelta: 20,
          riskDelta: 3,
          message: 'The mysterious approach generates buzz without overexposure.'
        }
      },
      {
        text: 'Reject it as a potential hit piece',
        outcome: {
          cloutDelta: 5,
          riskDelta: -5,
          message: 'Can\'t trust Hollywood. Your base respects the caution.'
        }
      }
    ]
  },

  // =========================
  // POLITICAL EVENTS (5)
  // =========================
  {
    id: 'congressional_hearing',
    category: 'political',
    title: 'Congressional Subpoena',
    description: 'A congressional committee wants testimony about "online radicalization." You\'re on the list.',
    minTurn: 10,
    maxRisk: 70,
    options: [
      {
        text: 'Testify and defend the movement',
        outcome: {
          cloutDelta: 35,
          supportDelta: { 'ALL': 5 },
          riskDelta: 15,
          message: 'Your testimony clips go viral. You\'re either a hero or villain depending on who you ask.'
        }
      },
      {
        text: 'Plead the Fifth on everything',
        outcome: {
          cloutDelta: 10,
          riskDelta: 5,
          message: 'Legally safe but optically questionable. The story fades quickly.'
        }
      },
      {
        text: 'Challenge the committee\'s authority',
        outcome: {
          supportDelta: { 'ALL': 8 },
          cloutDelta: 25,
          riskDelta: 25,
          message: 'Your defiance is legendary among supporters. Prosecutors take notice.'
        }
      }
    ]
  },
  {
    id: 'policy_debate',
    category: 'political',
    title: 'Policy Battleground',
    description: 'A major policy proposal aligned with your views is being debated in Congress.',
    options: [
      {
        text: 'Launch a lobbying blitz',
        outcome: {
          fundsDelta: -60,
          supportDelta: { 'ALL': 4 },
          cloutDelta: 20,
          riskDelta: 8,
          message: 'Your pressure campaign makes headlines. Politicians are listening.'
        }
      },
      {
        text: 'Mobilize grassroots phone campaigns',
        outcome: {
          fundsDelta: -15,
          supportDelta: { 'ALL': 6 },
          riskDelta: 3,
          message: 'Congressional offices are flooded with calls. Democracy in action!'
        }
      },
      {
        text: 'Stay out of traditional politics',
        outcome: {
          cloutDelta: -5,
          riskDelta: -5,
          message: 'Some supporters wanted action, but you keep your distance from DC.'
        }
      }
    ]
  },
  {
    id: 'election_cycle',
    category: 'political',
    title: 'Election Season Heat',
    description: 'It\'s election season. Candidates are either courting or attacking your movement.',
    minTurn: 6,
    options: [
      {
        text: 'Endorse a candidate formally',
        outcome: {
          supportDelta: { 'ALL': 7 },
          cloutDelta: 30,
          riskDelta: 15,
          message: 'Huge visibility but you\'re now tied to their fortunes.'
        }
      },
      {
        text: 'Play both sides for influence',
        outcome: {
          fundsDelta: 30,
          cloutDelta: 15,
          riskDelta: 10,
          message: 'Both parties think you might help them. The donations flow.'
        }
      },
      {
        text: 'Declare independence from all parties',
        outcome: {
          cloutDelta: 20,
          riskDelta: -5,
          message: 'Anti-establishment cred boosted. Purists love it.'
        }
      }
    ]
  },
  {
    id: 'scandal_adjacent',
    category: 'political',
    title: 'Scandal by Association',
    description: 'A politician you\'ve been associated with is embroiled in scandal. Media wants your comment.',
    options: [
      {
        text: 'Condemn them immediately',
        outcome: {
          cloutDelta: 10,
          riskDelta: -10,
          supportDelta: { 'ALL': -2 },
          message: 'Clean break. Some loyalists are disappointed but you avoid the fallout.'
        }
      },
      {
        text: 'Stay silent and wait it out',
        outcome: {
          riskDelta: 5,
          message: 'No comment strategy. The story eventually moves on.'
        }
      },
      {
        text: 'Defend them as a victim of smears',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 15,
          riskDelta: 20,
          message: 'Loyal to a fault. If they\'re vindicated, you\'re golden. If not...'
        }
      }
    ]
  },
  {
    id: 'coalition_opportunity',
    category: 'political',
    title: 'Strange Bedfellows',
    description: 'An unlikely ally from across the aisle wants to collaborate on a single issue.',
    options: [
      {
        text: 'Form a tactical alliance',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 25,
          riskDelta: 5,
          message: 'The bipartisan optics are powerful. You\'ve expanded your coalition.'
        }
      },
      {
        text: 'Reject them publicly',
        outcome: {
          supportDelta: { 'ALL': 2 },
          cloutDelta: 10,
          riskDelta: -3,
          message: 'Purity maintained. Your base approves of not "selling out."'
        }
      }
    ]
  },

  // =========================
  // ECONOMIC EVENTS (4)
  // =========================
  {
    id: 'funding_boom',
    category: 'economic',
    title: 'Donor Bonanza',
    description: 'A wealthy donor wants to fund your movement significantly. Strings may be attached.',
    minSupport: 25,
    options: [
      {
        text: 'Accept all funding gratefully',
        outcome: {
          fundsDelta: 100,
          cloutDelta: 10,
          riskDelta: 10,
          message: 'The money flows! But some wonder who\'s really in charge now.'
        }
      },
      {
        text: 'Accept with transparency requirements',
        outcome: {
          fundsDelta: 60,
          cloutDelta: 15,
          riskDelta: 3,
          message: 'Disclosure builds trust. Solid funding without the conspiracy theories.'
        }
      },
      {
        text: 'Reject and stay grassroots',
        outcome: {
          cloutDelta: 20,
          riskDelta: -5,
          message: 'Can\'t be bought. Small donors step up inspired by your integrity.'
        }
      }
    ]
  },
  {
    id: 'market_crash',
    category: 'economic',
    title: 'Economic Anxiety Rising',
    description: 'Markets are tumbling. Economic anxiety is at an all-time high.',
    outcome: {
      supportDelta: { 'ALL': 5 },
      cloutDelta: 15,
      riskDelta: 5,
      message: 'Economic uncertainty drives people toward movements promising change.'
    }
  },
  {
    id: 'merch_opportunity',
    category: 'economic',
    title: 'Merch Empire Potential',
    description: 'Supporters are clamoring for official merchandise. There\'s money to be made.',
    options: [
      {
        text: 'Launch a full merch line',
        outcome: {
          fundsDelta: 40,
          cloutDelta: 10,
          riskDelta: 5,
          message: 'Hats, shirts, and bumper stickers are flying off shelves!'
        }
      },
      {
        text: 'Just basic stuff, keep it tasteful',
        outcome: {
          fundsDelta: 20,
          cloutDelta: 5,
          riskDelta: 2,
          message: 'Modest merch maintains dignity while generating some revenue.'
        }
      },
      {
        text: 'No merch, movements shouldn\'t be monetized',
        outcome: {
          cloutDelta: 10,
          riskDelta: -3,
          message: 'Idealistic stance that some admire, others think is naive.'
        }
      }
    ]
  },
  {
    id: 'sponsorship_offer',
    category: 'economic',
    title: 'Corporate Sponsorship Offer',
    description: 'A major brand wants to sponsor your content. The money is tempting.',
    options: [
      {
        text: 'Take the deal',
        outcome: {
          fundsDelta: 75,
          cloutDelta: -10,
          riskDelta: 5,
          message: 'Money in the bank but "sellout" accusations follow.'
        }
      },
      {
        text: 'Negotiate for more money and less branding',
        outcome: {
          fundsDelta: 50,
          cloutDelta: 5,
          riskDelta: 3,
          message: 'A balanced deal that doesn\'t compromise your image too much.'
        }
      },
      {
        text: 'Publicly reject "corporate influence"',
        outcome: {
          cloutDelta: 20,
          riskDelta: -5,
          message: 'The rejection itself becomes content. Anti-corporate cred soars.'
        }
      }
    ]
  },

  // =========================
  // DECEMBER 2025 CURRENT EVENTS (8)
  // =========================
  {
    id: 'doge_cuts',
    category: 'political',
    title: 'DOGE Targets Your Cause',
    description: 'Elon\'s Department of Government Efficiency is reviewing programs your movement supports. Cuts may be coming.',
    options: [
      {
        text: 'Rally supporters to flood Congressional offices',
        outcome: {
          fundsDelta: -20,
          supportDelta: { 'ALL': 5 },
          cloutDelta: 15,
          riskDelta: 8,
          message: 'Grassroots pressure works! Some programs spared from the chopping block.'
        }
      },
      {
        text: 'Embrace efficiency - pivot your messaging',
        outcome: {
          cloutDelta: 20,
          supportDelta: { 'ALL': 2 },
          riskDelta: -5,
          message: 'Aligning with the zeitgeist. Your "lean government" pivot resonates.'
        }
      },
      {
        text: 'Attack DOGE as billionaire overreach',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 10,
          riskDelta: 12,
          message: 'Populist anger at tech oligarchs finds an audience.'
        }
      }
    ]
  },
  {
    id: 'h1b_debate',
    category: 'political',
    title: 'H-1B Visa Controversy Explodes',
    description: 'The MAGA civil war over H-1B visas has gone nuclear. Musk vs Bannon. Tech bros vs populists. Where do you stand?',
    minTurn: 3,
    options: [
      {
        text: 'Side with Musk - "We need the best talent"',
        outcome: {
          fundsDelta: 30,
          cloutDelta: 15,
          supportDelta: { 'ALL': -3 },
          riskDelta: 8,
          message: 'Tech donors love it. Populist base... not so much.'
        }
      },
      {
        text: 'Side with Bannon - "American workers first"',
        outcome: {
          supportDelta: { 'ALL': 6 },
          cloutDelta: 10,
          fundsDelta: -20,
          riskDelta: 5,
          message: 'The base is fired up! Silicon Valley doors close.'
        }
      },
      {
        text: 'Stay quiet and let them fight',
        outcome: {
          riskDelta: -5,
          cloutDelta: 5,
          message: 'Avoiding the crossfire. Both sides forget you exist for now.'
        }
      }
    ]
  },
  {
    id: 'healthcare_discourse',
    category: 'cultural',
    title: 'Healthcare CEO Discourse',
    description: 'Luigi Mangione\'s trial is dominating headlines. Healthcare CEO villain discourse is everywhere. How do you engage?',
    options: [
      {
        text: 'Channel the anger into healthcare reform messaging',
        outcome: {
          supportDelta: { 'ALL': 7 },
          cloutDelta: 20,
          riskDelta: 10,
          message: 'You\'ve tapped into real frustration. People are listening.'
        }
      },
      {
        text: 'Post "Free Luigi" memes ironically',
        outcome: {
          cloutDelta: 25,
          riskDelta: 15,
          message: 'Edgy content goes viral. Some advertisers get nervous.'
        }
      },
      {
        text: 'Stay out of it entirely',
        outcome: {
          riskDelta: -8,
          cloutDelta: -5,
          message: 'Playing it safe. Boring, but no blowback.'
        }
      }
    ]
  },
  {
    id: 'tucker_interview',
    category: 'media',
    title: 'Tucker Carlson Wants You On',
    description: 'Tucker\'s team reached out. His show has massive reach but also massive scrutiny. What do you do?',
    minTurn: 4,
    minSupport: 25,
    options: [
      {
        text: 'Accept and speak freely',
        outcome: {
          supportDelta: { 'ALL': 8 },
          cloutDelta: 40,
          riskDelta: 15,
          message: 'The interview goes viral. You\'ve reached millions of new people.'
        }
      },
      {
        text: 'Accept with strict talking points',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 25,
          riskDelta: 5,
          message: 'Controlled messaging. Safe but not as exciting.'
        }
      },
      {
        text: 'Decline - too controversial',
        outcome: {
          cloutDelta: -10,
          riskDelta: -10,
          message: 'Some supporters disappointed. Others relieved.'
        }
      }
    ]
  },
  {
    id: 'groyper_infiltration',
    category: 'political',
    title: 'Young Staffers Going Groyper',
    description: 'Reports say 30-40% of young GOP staffers in DC are sympathetic to America First ideas. The establishment is nervous.',
    minTurn: 5,
    options: [
      {
        text: 'Embrace the generational shift',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 20,
          riskDelta: 12,
          message: 'Young conservatives see you as an ally. Old guard takes notice.'
        }
      },
      {
        text: 'Distance yourself from the label',
        outcome: {
          cloutDelta: 5,
          riskDelta: -8,
          fundsDelta: 20,
          message: 'Establishment donors breathe easier. Zoomers are disappointed.'
        }
      },
      {
        text: 'Play both sides',
        outcome: {
          cloutDelta: 10,
          riskDelta: 5,
          message: 'Walking the line. Everyone thinks you agree with them.'
        }
      }
    ]
  },
  {
    id: 'kash_patel_fbi',
    category: 'political',
    title: 'FBI Under New Management',
    description: 'Kash Patel is cleaning house at the FBI. Investigations are opening and closing. Your movement could be affected.',
    minTurn: 6,
    options: [
      {
        text: 'Celebrate the new direction loudly',
        outcome: {
          cloutDelta: 15,
          supportDelta: { 'ALL': 4 },
          riskDelta: -10,
          message: 'The new FBI seems friendlier. Your risk exposure drops.'
        }
      },
      {
        text: 'Stay cautiously optimistic',
        outcome: {
          riskDelta: -5,
          cloutDelta: 5,
          message: 'Measured response. Don\'t want to jinx it.'
        }
      },
      {
        text: 'Warn that power corrupts anyone',
        outcome: {
          cloutDelta: 10,
          supportDelta: { 'ALL': 2 },
          riskDelta: 5,
          message: 'Principled consistency. Some MAGA folks aren\'t happy.'
        }
      }
    ]
  },
  {
    id: 'rfk_health_policy',
    category: 'political',
    title: 'RFK Jr\'s Health Crusade',
    description: 'The new HHS Secretary is pushing controversial health policies. Raw milk and fluoride debates are everywhere.',
    options: [
      {
        text: 'Embrace the health freedom message',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 15,
          riskDelta: 8,
          message: 'Health skeptics love you. Mainstream media less so.'
        }
      },
      {
        text: 'Focus on the anti-corporate angle only',
        outcome: {
          cloutDelta: 10,
          supportDelta: { 'ALL': 3 },
          riskDelta: 3,
          message: 'Big Pharma critique resonates. Avoid the fringe stuff.'
        }
      },
      {
        text: 'Stay out of health debates entirely',
        outcome: {
          riskDelta: -5,
          message: 'Not your lane. No gains, no losses.'
        }
      }
    ]
  },
  {
    id: 'dark_maga_aesthetics',
    category: 'cultural',
    title: 'Dark MAGA Goes Mainstream',
    description: 'The apocalyptic, vengeful Dark MAGA aesthetic is everywhere. Black and red. Vengeance rhetoric. It\'s a vibe.',
    options: [
      {
        text: 'Lean into the aesthetic hard',
        outcome: {
          cloutDelta: 30,
          supportDelta: { 'ALL': 3 },
          riskDelta: 15,
          message: 'Your rebrand is complete. You look dangerous in a cool way.'
        }
      },
      {
        text: 'Adopt some elements tastefully',
        outcome: {
          cloutDelta: 15,
          supportDelta: { 'ALL': 2 },
          riskDelta: 5,
          message: 'Subtle nods to the trend without going full edgelord.'
        }
      },
      {
        text: 'Reject it as cringe',
        outcome: {
          cloutDelta: -5,
          riskDelta: -5,
          message: 'Purists appreciate it. Zoomers think you\'re out of touch.'
        }
      }
    ]
  },

  // =========================
  // CULTURAL EVENTS (6)
  // =========================
  {
    id: 'counter_movement',
    category: 'cultural',
    title: 'Counter-Movement Emerges',
    description: 'An organized opposition movement has formed specifically to counter yours.',
    minTurn: 4,
    minSupport: 20,
    options: [
      {
        text: 'Engage and debate publicly',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 20,
          riskDelta: 10,
          message: 'The debate elevates your profile. Some fence-sitters pick your side.'
        }
      },
      {
        text: 'Mock them relentlessly',
        outcome: {
          cloutDelta: 25,
          supportDelta: { 'ALL': 2 },
          riskDelta: 8,
          message: 'Your memes about them go viral. They\'re not happy.'
        }
      },
      {
        text: 'Ignore them completely',
        outcome: {
          riskDelta: -3,
          message: 'Not feeding the trolls. They eventually focus elsewhere.'
        }
      }
    ]
  },
  {
    id: 'campus_protest',
    category: 'cultural',
    title: 'Campus Free Speech Showdown',
    description: 'A university banned a speaker aligned with your movement, sparking nationwide debate.',
    options: [
      {
        text: 'Condemn the university publicly',
        outcome: {
          supportDelta: { 'ALL': 3 },
          riskDelta: 5,
          message: 'Your bold stance rallies free-speech supporters nationwide.'
        }
      },
      {
        text: 'Launch a meme campaign mocking the ban',
        outcome: {
          cloutDelta: 15,
          supportDelta: { 'ALL': 2 },
          riskDelta: 3,
          message: 'Your memes turn the incident into a viral joke.'
        }
      },
      {
        text: 'Stay out of the controversy',
        outcome: {
          riskDelta: -5,
          message: 'Avoiding controversy reduces risk but misses an opportunity.'
        }
      }
    ]
  },
  {
    id: 'viral_hashtag',
    category: 'cultural',
    title: '#YourMovement Goes Viral',
    description: 'Your hashtag is trending! Everyone is talking about your movement.',
    outcome: {
      cloutDelta: 25,
      supportDelta: { 'ALL': 3 },
      riskDelta: 5,
      message: 'The viral hashtag boosted your movement\'s visibility nationwide.'
    }
  },
  {
    id: 'influencer_drama',
    category: 'cultural',
    title: 'Influencer Civil War',
    description: 'Two major influencers in your movement are publicly feuding. The community is splitting.',
    options: [
      {
        text: 'Mediate and unite them',
        outcome: {
          cloutDelta: 20,
          supportDelta: { 'ALL': 3 },
          riskDelta: -3,
          message: 'Peace restored. You\'re seen as a unifying leader.'
        }
      },
      {
        text: 'Back one side',
        outcome: {
          cloutDelta: 15,
          supportDelta: { 'ALL': -2 },
          riskDelta: 5,
          message: 'You picked a winner but lost some followers to the other camp.'
        }
      },
      {
        text: 'Stay completely neutral',
        outcome: {
          cloutDelta: -5,
          riskDelta: 3,
          message: 'Your silence is seen as weak leadership by some.'
        }
      }
    ]
  },
  {
    id: 'meme_war',
    category: 'cultural',
    title: 'The Great Meme War',
    description: 'Your opponents launched a coordinated meme attack. Your community is fighting back.',
    options: [
      {
        text: 'Deploy your best memers',
        outcome: {
          cloutDelta: 30,
          fundsDelta: -10,
          riskDelta: 5,
          message: 'Your meme army prevails! The internet declares you the winner.'
        }
      },
      {
        text: 'Rise above the meme warfare',
        outcome: {
          cloutDelta: 5,
          riskDelta: -5,
          message: 'Taking the high road. Some call it dignified, others call it boring.'
        }
      }
    ]
  },
  {
    id: 'cultural_moment',
    category: 'cultural',
    title: 'Cultural Zeitgeist Shift',
    description: 'A major cultural event has created an opening for your message to resonate.',
    outcome: {
      supportDelta: { 'ALL': 6 },
      cloutDelta: 20,
      riskDelta: 3,
      message: 'Perfect timing! The cultural moment amplifies your message.'
    }
  },

  // =========================
  // LATE DECEMBER 2025 - JUDGE-APPROVED VIRAL EVENTS
  // =========================
  {
    id: 'target_dual_boycott_2025',
    category: 'economic',
    title: 'Target Faces Dual Boycotts: $12.4B Market Value Evaporates',
    description: 'Target Corporation hemorrhages market value as simultaneous boycotts erupt. Conservatives rage over DEI initiatives while progressives condemn "performative allyship." The CEO\'s apology tour satisfies no one. Your advisors are screaming contradictory advice.',
    minTurn: 5,
    maxRisk: 85,
    options: [
      {
        text: 'Support the Conservative Boycott: "Get woke, go broke!"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 5,
          riskDelta: 8,
          message: 'MAGA influencers amplify your stance. LGBT groups launch counter-campaign. Corporate America watches nervously.'
        }
      },
      {
        text: 'Support the Progressive Boycott: "Rainbow capitalism must end!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 4,
          riskDelta: 9,
          message: 'Progressive activists praise your "authentic" stance. Conservative media calls you a "corporate terrorist."'
        }
      },
      {
        text: 'Condemn BOTH Boycotts: "This is economic terrorism!"',
        outcome: {
          supportDelta: { 'ALL': -3 },
          cloutDelta: -8,
          riskDelta: 15,
          message: 'You\'ve united left and right... in despising you. Social media roasts you from all angles. At least the memes are funny?'
        }
      },
      {
        text: 'Launch "Buy American" Counter-Campaign',
        outcome: {
          supportDelta: { 'ALL': 5 },
          fundsDelta: -40,
          cloutDelta: 6,
          riskDelta: 5,
          message: 'Rust Belt loves your economic nationalism. Coastal elites call it "jingoistic." You\'ve successfully changed the subject.'
        }
      }
    ]
  },
  {
    id: 'h1b_musk_bannon_war_2025',
    category: 'political',
    title: 'H1-B Civil War: Musk vs Bannon, Trump Picks a Side',
    description: 'The MAGA coalition fractures as Elon Musk demands more H1-B visas for tech workers while Steve Bannon denounces "tech oligarch betrayal." Trump sides with Musk, calling Bannon "overrated." Nationalist influencers are in open revolt.',
    minTurn: 8,
    maxRisk: 70,
    options: [
      {
        text: 'Side with Musk: "We need the best talent!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 8,
          fundsDelta: 30,
          riskDelta: 12,
          message: 'Silicon Valley donors open their wallets. Nationalist base calls you a "globalist traitor." Groypers spam your mentions.'
        }
      },
      {
        text: 'Side with Bannon: "America First means Americans FIRST!"',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 7,
          riskDelta: 14,
          message: 'Nationalist influencers rally to your banner. Tech billionaires call you "economically illiterate."'
        }
      },
      {
        text: 'Thread the Needle: "Merit-based with American training requirements"',
        outcome: {
          supportDelta: { 'ALL': 2 },
          cloutDelta: -3,
          riskDelta: 6,
          message: 'Your carefully crafted position satisfies no one but confuses everyone. The discourse moves on.'
        }
      },
      {
        text: 'Exploit the Chaos: Launch "Tech Exodus" fundraiser',
        outcome: {
          supportDelta: { 'ALL': -1 },
          cloutDelta: -10,
          fundsDelta: 80,
          riskDelta: 10,
          message: 'You raised money off the chaos while contributing nothing. Very on-brand for 2025 politics. Cynicism pays.'
        }
      }
    ]
  },
  {
    id: 'x_location_foreign_maga_2025',
    category: 'tech',
    title: 'X Geolocation Exposes Foreign "MAGA Patriots"',
    description: 'A new X feature displays posting locations. Top "MAGA Warriors" with 400K+ followers are suddenly geolocated to India, Nigeria, and Pakistan. Screenshots go viral. Defenders claim VPNs, but the damage is done.',
    minTurn: 4,
    maxRisk: 90,
    options: [
      {
        text: 'Weaponize This: "See? Foreign interference is REAL!"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 9,
          riskDelta: 13,
          message: 'Liberal media amplifies your "told you so" tour. MAGA figures claim you\'re working for the Deep State.'
        }
      },
      {
        text: 'Defend the Accounts: "VPNs exist, this is a witch hunt!"',
        outcome: {
          supportDelta: { 'ALL': 2 },
          cloutDelta: -5,
          riskDelta: 16,
          message: 'MAGA influencers appreciate your loyalty. Fact-checkers have a field day with your claims.'
        }
      },
      {
        text: 'Both-Sides This: "ALL sides use bots, let\'s talk real issues"',
        outcome: {
          supportDelta: { 'ALL': -2 },
          cloutDelta: -4,
          riskDelta: 7,
          message: 'Your enlightened centrist take pleases only NPR listeners. The discourse continues without you.'
        }
      },
      {
        text: 'Launch "Verify American" App',
        outcome: {
          supportDelta: { 'ALL': 4 },
          fundsDelta: -50,
          cloutDelta: 5,
          riskDelta: 11,
          message: 'Your grifter instincts pay off. Swing state voters love the "authenticity verification." Privacy advocates are horrified.'
        }
      }
    ]
  },
  {
    id: 'raw_milk_bird_flu_2025',
    category: 'cultural',
    title: 'Raw Milk Bird Flu: 5 Cats Dead, RFK Jr Defends "Freedom"',
    description: 'An outbreak of bird flu-contaminated raw milk leaves 5 cats dead and 12 humans hospitalized. RFK Jr\'s HHS issues a statement defending "bodily autonomy" and "traditional foodways." Veterinarians are screaming. Pet owners are terrified.',
    minTurn: 6,
    maxRisk: 75,
    minSupport: 30,
    options: [
      {
        text: 'Demand Federal Ban: "This is what deregulation gets us!"',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 6,
          riskDelta: 10,
          message: 'Public health advocates praise your courage. Rural states accuse you of "nanny state tyranny."'
        }
      },
      {
        text: 'Defend Raw Milk: "Personal choice, personal responsibility!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: -7,
          riskDelta: 18,
          message: 'Libertarian influencers love you. Pediatricians are horrified. Twitter adds context notes to your posts.'
        }
      },
      {
        text: 'Blame RFK Jr: "Unqualified leadership kills animals!"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 8,
          riskDelta: 9,
          message: 'Mainstream media amplifies your attack. RFK supporters call you a "pharma shill."'
        }
      },
      {
        text: 'Pivot to Factory Farming: "This is why we need food system reform!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          fundsDelta: -35,
          cloutDelta: 3,
          riskDelta: 6,
          message: 'Progressive food activists embrace you. Rural America rolls their eyes. You\'ve changed the subject.'
        }
      }
    ]
  },
  {
    id: 'doge_musk_failure_2025',
    category: 'political',
    title: 'DOGE Admits Defeat: Musk Says "Wouldn\'t Do It Again"',
    description: 'After months of hype, Elon Musk admits DOGE was "only somewhat successful" and he "wouldn\'t do it again." Government waste persists. Bureaucrats gloat. The techno-solutionist narrative collapses.',
    minTurn: 10,
    maxRisk: 60,
    options: [
      {
        text: 'Pile On: "Billionaires can\'t just \'disrupt\' democracy!"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 7,
          riskDelta: 8,
          message: 'Liberal wonks celebrate your vindication. Musk fans call you a "regime loyalist."'
        }
      },
      {
        text: 'Defend Musk: "At least he tried! Better than career politicians!"',
        outcome: {
          supportDelta: { 'ALL': 2 },
          cloutDelta: -4,
          riskDelta: 11,
          message: 'Tech bros appreciate your loyalty. Government workers mock you for defending failure.'
        }
      },
      {
        text: 'Propose Your Own Plan: "We need REAL reform, not tech stunts"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: -20,
          fundsDelta: 40,
          riskDelta: 7,
          message: 'Your 10-point plan goes viral. Wonks debate it seriously. You\'re now a "serious policy thinker."'
        }
      },
      {
        text: 'Ignore & Pivot to Border Crisis',
        outcome: {
          supportDelta: { 'ALL': 2 },
          fundsDelta: -25,
          cloutDelta: 2,
          riskDelta: 5,
          message: 'You\'ve successfully changed the subject. The news cycle moves on. Strategic cowardice works.'
        }
      }
    ]
  },
  {
    id: 'mtg_trump_civil_war_2025',
    category: 'political',
    title: 'MTG vs Trump: "Traitor" Label Sparks MAGA Civil War',
    description: 'Trump labels MTG a "traitor" and "lunatic" after she demands Epstein files and criticizes his tariffs. MTG announces resignation from Congress, citing 773 death threats - now coming from the RIGHT. Trump dismisses her: "Nobody cares about her."',
    minTurn: 7,
    options: [
      {
        text: 'Side with Trump: "She was never really MAGA!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 5,
          riskDelta: 10,
          message: 'Trump loyalists embrace you. Former MTG fans accuse you of betrayal. The circular firing squad continues.'
        }
      },
      {
        text: 'Defend MTG: "She deserves better than death threats!"',
        outcome: {
          supportDelta: { 'ALL': 2 },
          cloutDelta: -8,
          riskDelta: 15,
          message: 'You\'ve stepped into the crossfire. Both camps are now suspicious of you. Brave, but costly.'
        }
      },
      {
        text: 'Call for Unity: "We\'re tearing ourselves apart!"',
        outcome: {
          supportDelta: { 'ALL': -1 },
          cloutDelta: -5,
          riskDelta: 8,
          message: 'Your call for peace is ignored. Both sides see you as weak. The drama continues without you.'
        }
      },
      {
        text: 'Demand Epstein Files: "Release everything - no exceptions!"',
        outcome: {
          supportDelta: { 'ALL': 6 },
          cloutDelta: 15,
          riskDelta: 20,
          message: 'Conspiracy theorists LOVE you. Mainstream media notices you. You\'ve just painted a massive target on yourself.'
        }
      }
    ]
  },
  {
    id: 'meta_kills_factchecking_2025',
    category: 'tech',
    title: 'Meta Kills Fact-Checking: "We Embrace Mistakes"',
    description: 'Mark Zuckerberg announces Meta will stop fact-checking, admitting 10-20% of daily content removals were "mistakes." Misinformation flows freely. FTC launches inquiry. Your campaign could thrive or drown in the chaos.',
    minTurn: 3,
    options: [
      {
        text: 'Celebrate: "Finally, free speech on social media!"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 12,
          riskDelta: 15,
          message: 'Your viral misinfo potential skyrockets. Responsible media calls you dangerous. Freedom tastes like dopamine.'
        }
      },
      {
        text: 'Condemn: "This is how democracies die!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 5,
          riskDelta: 8,
          message: 'Legacy media amplifies your concern. Tech libertarians call you a censorship apologist.'
        }
      },
      {
        text: 'Start Your Own Fact-Check Squad',
        outcome: {
          supportDelta: { 'ALL': 4 },
          fundsDelta: -50,
          cloutDelta: 8,
          riskDelta: 10,
          message: 'Your "independent verification" gains traction. Critics say you\'re just pushing your own narrative. They\'re not wrong.'
        }
      },
      {
        text: 'Exploit the Void: Flood zone with your messaging',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 15,
          riskDelta: 18,
          message: 'Without fact-checkers, your unverified claims spread like wildfire. Backlash is coming, but not today.'
        }
      }
    ]
  },
  {
    id: 'luigi_trial_2025',
    category: 'cultural',
    title: 'Luigi Mangione Trial: The CEO Killer Cult',
    description: 'The Luigi Mangione evidence hearing enters Day 7. Defense argues illegal search, prosecution fights to keep the gun and manifesto. Online, Luigi has become a folk hero. Healthcare discourse explodes. Your take will define you.',
    minTurn: 5,
    options: [
      {
        text: 'Call him a "Freedom Fighter": Lean into the chaos',
        outcome: {
          supportDelta: { 'ALL': 6 },
          cloutDelta: 20,
          riskDelta: 25,
          message: 'The radical left LOVES you. Mainstream media is horrified. You\'ve just endorsed political violence. Bold move.'
        }
      },
      {
        text: 'Condemn Political Violence: "Murder is never justified"',
        outcome: {
          supportDelta: { 'ALL': 2 },
          cloutDelta: 2,
          riskDelta: 5,
          message: 'Safe and boring. Your base wanted edge. At least you won\'t get investigated.'
        }
      },
      {
        text: 'Focus on Healthcare: "This is what happens when the system fails"',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 10,
          riskDelta: 10,
          message: 'You\'ve threaded the needle. Healthcare reform gets trending. You look thoughtful, not crazy.'
        }
      },
      {
        text: 'Post Luigi Memes Ironically',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 18,
          riskDelta: 15,
          message: 'Plausible deniability is a beautiful thing. "It\'s just a meme, bro." Lawyers are on standby.'
        }
      }
    ]
  },
  {
    id: 'white_house_media_tracker_2025',
    category: 'media',
    title: 'White House Launches "Media Offender" Tracker',
    description: 'The administration creates an official government portal naming journalists and labeling coverage as "lies" and "left-wing lunacy." State Department starts denying visas to fact-checkers. Press freedom groups are in panic mode.',
    minTurn: 6,
    options: [
      {
        text: 'Endorse the Tracker: "Finally, accountability for fake news!"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 10,
          riskDelta: 12,
          message: 'MAGA base cheers. Journalists add you to THEIR lists. You\'re now part of the story.'
        }
      },
      {
        text: 'Defend Press Freedom: "This is authoritarianism 101!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 5,
          riskDelta: 8,
          message: 'Legacy media loves you. Conservative base thinks you\'ve gone soft. Principles cost support.'
        }
      },
      {
        text: 'Create Your Own "Biased Journalist" List as Satire',
        outcome: {
          supportDelta: { 'ALL': 5 },
          cloutDelta: 15,
          riskDelta: 15,
          message: 'Your satirical list goes viral. Some people don\'t get the joke. Poe\'s Law strikes again.'
        }
      },
      {
        text: 'Stay Silent: Let others fight this battle',
        outcome: {
          supportDelta: { 'ALL': -2 },
          cloutDelta: -5,
          riskDelta: 5,
          message: 'Cowardice is noted by all sides. Sometimes the best move is no move. This wasn\'t one of those times.'
        }
      }
    ]
  },
  {
    id: 'texas_bathroom_bill_2025',
    category: 'political',
    title: 'Texas Bathroom Bill: First Arrest at State Capitol',
    description: 'SB 8 goes into effect requiring bathrooms based on "biological sex." Trans activist Ry Vazquez receives criminal trespass citation at the Capitol. DPS officers enforce inconsistently. Protesters call it "unenforceable chaos."',
    minTurn: 4,
    options: [
      {
        text: 'Support the Law: "Protect women\'s spaces!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 5,
          riskDelta: 10,
          message: 'Conservative base energized. LGBT allies are done with you. The culture war claims another victim.'
        }
      },
      {
        text: 'Oppose the Law: "Government doesn\'t belong in bathrooms!"',
        outcome: {
          supportDelta: { 'ALL': 3 },
          cloutDelta: 4,
          riskDelta: 12,
          message: 'Libertarians appreciate the consistency. Social conservatives think you\'ve betrayed them.'
        }
      },
      {
        text: 'Mock the Enforcement: "Bathroom police checking IDs?"',
        outcome: {
          supportDelta: { 'ALL': 4 },
          cloutDelta: 12,
          riskDelta: 8,
          message: 'Your satire goes viral. Both sides are mocked. You\'ve risen above the discourse. For now.'
        }
      },
      {
        text: 'Propose Single-Stall Solution',
        outcome: {
          supportDelta: { 'ALL': 2 },
          fundsDelta: -40,
          cloutDelta: 3,
          riskDelta: 5,
          message: 'A boring, practical solution. Nobody\'s excited, but nobody\'s mad. The discourse moves elsewhere.'
        }
      }
    ]
  }
];

// Track which events have been shown to prevent repetition
const shownEventIds = new Set<string>();

// Get average support from state
function getAverageSupport(state: GameState): number {
  const values = Object.values(state.support);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Filter events based on game state conditions
function getEligibleEvents(state: GameState): EventTemplate[] {
  const avgSupport = getAverageSupport(state);

  return EVENT_POOL.filter(event => {
    // Skip already shown events (unless we've shown most of them)
    if (shownEventIds.size < EVENT_POOL.length * 0.7 && shownEventIds.has(event.id)) {
      return false;
    }

    // Check turn requirement
    if (event.minTurn && state.turn < event.minTurn) {
      return false;
    }

    // Check risk requirement
    if (event.maxRisk && state.risk > event.maxRisk) {
      return false;
    }

    // Check support requirement
    if (event.minSupport && avgSupport < event.minSupport) {
      return false;
    }

    return true;
  });
}

// Generate advisors using prompt-based templates (static fallback for MVP)
export function generateAdvisors(): Advisor[] {
  return [
    {
      name: 'Chad "DOGE" Williams',
      role: 'Efficiency Consultant',
      ideology: 'Techno-Populist',
      traits: 'Former tech bro who pivoted to political consulting after the 2024 election',
      quotes: [
        'We\'re cutting the bloat. Government efficiency is the new punk rock.',
        'Elon showed us the way. Now we execute.',
        'If DOGE can cut it, we can meme it.'
      ]
    },
    {
      name: 'Dana "Dark MAGA" Reyes',
      role: 'Aesthetic Director',
      ideology: 'Accelerationist Aesthete',
      traits: 'Graphic designer who pioneered the black-and-red Dark MAGA look',
      quotes: [
        'Vengeance is a brand now. Embrace it.',
        'The algorithm rewards intensity. Go dark or go home.',
        'Every meme is a psy-op. Make yours count.'
      ]
    },
    {
      name: 'Tucker\'s Intern Kyle',
      role: 'Media Booker',
      ideology: 'Reluctant Celebrity Handler',
      traits: 'Young staffer who knows everyone in conservative media',
      quotes: [
        'I can get you on Tucker. The question is: are you ready?',
        '30-40% of DC staffers are on our side now. We\'re winning.',
        'Bannon wants a call. Musk is posting about you. Pick your fighter.'
      ]
    }
  ];
}

// Fallback event when no eligible events are available
const FALLBACK_EVENT: GameEvent = {
  title: 'Quiet News Day',
  description: 'The news cycle takes a breather. Use this time to consolidate your position.',
  outcome: {},
};

// Generate a satirical in-game event based on game state
export function generateEvent(state: GameState, _recursionGuard: boolean = false): GameEvent {
  const eligibleEvents = getEligibleEvents(state);

  // If no eligible events, reset shown events and try once more
  if (eligibleEvents.length === 0) {
    if (_recursionGuard) {
      // Already tried resetting, return fallback event
      return FALLBACK_EVENT;
    }
    shownEventIds.clear();
    return generateEvent(state, true);
  }

  // Weight selection toward events matching current game state
  const avgSupport = getAverageSupport(state);

  // Categorize current situation
  const isHighRisk = state.risk > 60;
  const isLowFunds = state.funds < 30;
  const isHighSupport = avgSupport > 50;

  // Prefer certain categories based on situation
  let weightedEvents = eligibleEvents;

  if (isHighRisk) {
    // When risk is high, weight toward events with risk-reduction options
    weightedEvents = eligibleEvents.filter(e =>
      e.options?.some(o => (o.outcome.riskDelta || 0) < 0) ||
      (e.outcome?.riskDelta || 0) < 0
    );
    if (weightedEvents.length === 0) weightedEvents = eligibleEvents;
  }

  if (isLowFunds) {
    // When funds are low, weight toward economic events
    const economicEvents = eligibleEvents.filter(e => e.category === 'economic');
    if (economicEvents.length > 0 && Math.random() < 0.4) {
      weightedEvents = economicEvents;
    }
  }

  // Random selection from weighted pool
  const selected = weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
  shownEventIds.add(selected.id);

  // Convert to GameEvent format
  const gameEvent: GameEvent = {
    title: selected.title,
    description: selected.description,
    options: selected.options,
    outcome: selected.outcome
  };

  return gameEvent;
}

// Reset event tracking (call on game reset)
export function resetEventTracking(): void {
  shownEventIds.clear();
}

// Generate fake social media posts reacting to the player's last action
export function generateTweets(lastActionName: string): Tweet[] {
  const handles = [
    '@DOGEPatriot47',
    '@DarkMAGA_Dana',
    '@GroyperKing',
    '@IndivisibleNow',
    '@FreeLuigiBot',
    '@TuckerFanAccount',
    '@BannonWarRoom',
    '@ResistanceRises',
    '@H1BDebater',
    '@KashFan2025'
  ];
  const randomHandle = () => handles[Math.floor(Math.random() * handles.length)];

  const reactions = [
    `"${lastActionName}" is exactly what DOGE would approve of. Efficient. Based.`,
    `${lastActionName}?? This is giving Dark MAGA energy and I'm here for it.`,
    `Bannon just mentioned "${lastActionName}" on the War Room. You're on the radar.`,
    `Can't believe they just did "${lastActionName}". Tucker needs to cover this.`,
    `${lastActionName} might just change the game... or completely flop. The algorithm decides.`,
    `The Groypers are posting about "${lastActionName}" now. Mainstream incoming.`,
    `Healthcare CEO discourse has entered the "${lastActionName}" debate. Wild times.`,
    `Everyone's talking about "${lastActionName}". The 30-40% are paying attention.`,
    `"${lastActionName}" - this is the kind of move that gets you on the podcast circuit.`,
    `Indivisible chapters are organizing against "${lastActionName}". You're making waves.`
  ];

  // Pick 3 random reactions
  const shuffled = reactions.sort(() => Math.random() - 0.5);
  return [
    { user: randomHandle(), content: shuffled[0] },
    { user: randomHandle(), content: shuffled[1] },
    { user: randomHandle(), content: shuffled[2] }
  ];
}

// =========================
// SENTIMENT-AWARE SOCIAL FEED (Sprint 6a)
// =========================

// Faction-specific Twitter handles
const FACTION_HANDLES: Record<string, string[]> = {
  'tech-elite': ['@SiliconValleyVC', '@TechBroChad', '@AIOptimist2025'],
  'rural-heartland': ['@FarmCountryUSA', '@HeartlandMom', '@TractorTruth'],
  'urban-progressive': ['@BrooklynActivist', '@UrbanOrganizer', '@CityRising'],
  'corporate-establishment': ['@FortuneInsider', '@WallStObserver', '@BoardroomBeat'],
  'media-influencers': ['@ViralTakes', '@MainstreamMike', '@ClickbaitKing'],
  'grassroots-activists': ['@DoorKnockerDan', '@GrassrootsGrind', '@PeoplesPower'],
};

// Mood-specific reaction templates
const MOOD_REACTIONS: Record<MoodLevel, { positive: string[]; negative: string[] }> = {
  ENTHUSIASTIC: {
    positive: [
      "THIS IS EXACTLY WHAT WE NEEDED! 🔥🔥🔥",
      "We're ALL IN on this! The movement is unstoppable!",
      "Our people are FIRED UP! This changes everything!",
      "Incredible move! The momentum is building fast!",
    ],
    negative: [
      "Wait, what?! This doesn't match our energy AT ALL!",
      "We were so hyped... and then this happens?!",
      "Our coalition is confused - why pivot now?",
    ],
  },
  ENGAGED: {
    positive: [
      "Solid move. This resonates with our base.",
      "We can work with this. Good direction.",
      "Finally, someone who gets what we need.",
      "This is the kind of action we've been waiting for.",
    ],
    negative: [
      "Not thrilled about this direction, tbh.",
      "We expected better. Disappointing.",
      "This isn't what we signed up for.",
    ],
  },
  APATHETIC: {
    positive: [
      "Hm, okay. Maybe there's hope after all.",
      "*yawns* Fine, I guess this is something.",
      "Cautiously optimistic... for now.",
    ],
    negative: [
      "Whatever. We're checked out at this point.",
      "Hard to care anymore. Just noise.",
      "Wake us when something actually changes.",
    ],
  },
  HOSTILE: {
    positive: [
      "Wait... is this actually good? We're suspicious.",
      "Don't think this makes up for everything else.",
      "Too little, too late. But fine.",
    ],
    negative: [
      "This is EXACTLY why we can't trust this campaign!",
      "Betrayal confirmed. We're organizing against this.",
      "Our worst fears confirmed. Never again.",
      "We warned everyone. Now they'll see.",
    ],
  },
};

/**
 * Generate sentiment-aware tweets that reflect faction moods and reactions
 * This makes the social feed mechanically meaningful - players can read faction health
 */
export function generateSentimentTweets(
  actionName: string,
  factionReactions: FactionReaction[],
  sentimentState: SentimentState
): Tweet[] {
  const tweets: Tweet[] = [];

  // Generate tweets from factions that reacted
  for (const reaction of factionReactions.slice(0, 2)) {
    const factionHandles = FACTION_HANDLES[reaction.factionId] || ['@Anonymous'];
    const handle = factionHandles[Math.floor(Math.random() * factionHandles.length)];
    const moodInfo = MOOD_THRESHOLDS[sentimentState.factions[reaction.factionId]?.mood || 'ENGAGED'];

    // Create faction-attributed tweet with mood indicator
    const moodEmoji = moodInfo.icon;
    const factionName = FACTION_DISPLAY_NAMES[reaction.factionId] || reaction.factionId;

    tweets.push({
      user: handle,
      content: `${moodEmoji} [${factionName}] ${reaction.message}`,
    });
  }

  // Add 1-2 general reaction tweets to fill the feed
  const generalHandles = [
    '@DOGEPatriot47', '@DarkMAGA_Dana', '@GroyperKing', '@IndivisibleNow',
    '@FreeLuigiBot', '@TuckerFanAccount', '@BannonWarRoom', '@ResistanceRises'
  ];

  const generalReactions = [
    `The "${actionName}" discourse is heating up. Everyone's watching.`,
    `${actionName} trending for all the wrong reasons... or right ones?`,
    `My timeline is split 50/50 on "${actionName}". Classic culture war.`,
    `The algorithm is LOVING this "${actionName}" content. Engagement through the roof.`,
  ];

  const numGeneral = Math.max(1, 3 - tweets.length);
  for (let i = 0; i < numGeneral; i++) {
    tweets.push({
      user: generalHandles[Math.floor(Math.random() * generalHandles.length)],
      content: generalReactions[Math.floor(Math.random() * generalReactions.length)],
    });
  }

  return tweets.slice(0, 3);
}

/**
 * Generate a tweet reflecting a faction's current mood (for Social Pulse display)
 */
export function generateFactionMoodTweet(
  factionId: string,
  mood: MoodLevel,
  impact: number
): Tweet {
  const handles = FACTION_HANDLES[factionId] || ['@Coalition'];
  const handle = handles[Math.floor(Math.random() * handles.length)];
  const reactions = MOOD_REACTIONS[mood];
  const pool = impact >= 0 ? reactions.positive : reactions.negative;
  const content = pool[Math.floor(Math.random() * pool.length)];
  const moodEmoji = MOOD_THRESHOLDS[mood].icon;
  const factionName = FACTION_DISPLAY_NAMES[factionId] || factionId;

  return {
    user: handle,
    content: `${moodEmoji} [${factionName}] ${content}`,
  };
}
